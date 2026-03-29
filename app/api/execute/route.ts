/**
 * API Route: /api/execute
 * 
 * POST request to execute a prompt with the specified LLM provider.
 * 
 * Request body:
 * {
 *   promptVersionId: string
 *   variables: Record<string, string | number>
 *   apiKey?: string (optional - can be stored in env)
 * }
 * 
 * Response:
 * {
 *   testRunId: string
 *   output: string
 *   inputTokens: number
 *   outputTokens: number
 *   totalTokens: number
 *   costUsd: number
 *   latencyMs: number
 *   status: 'success' | 'error'
 *   errorMessage?: string
 * }
 */

import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { compilePrompt, substituteVariables } from '@/lib/compiler'

const prisma = new PrismaClient()

// Token counting utilities for different models
const TOKEN_COUNTS = {
  'gpt-4': { input: 0.00003, output: 0.00006 },
  'gpt-3.5-turbo': { input: 0.0005, output: 0.0015 },
  'claude-3-opus': { input: 0.000015, output: 0.00075 },
  'claude-3-sonnet': { input: 0.000003, output: 0.00015 },
}

interface ExecuteRequest {
  promptVersionId: string
  variables: Record<string, string | number>
  apiKey?: string
}

/**
 * Call OpenAI API
 */
async function callOpenAI(
  prompt: string,
  model: string,
  config: Record<string, any>,
  apiKey: string
) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: prompt }],
      temperature: config.temperature || 0.7,
      max_tokens: config.max_tokens || 2000,
      top_p: config.top_p || 0.9,
    }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(`OpenAI API error: ${error.error?.message || 'Unknown error'}`)
  }

  const data = await response.json()

  return {
    output: data.choices[0].message.content,
    inputTokens: data.usage.prompt_tokens,
    outputTokens: data.usage.completion_tokens,
    totalTokens: data.usage.total_tokens,
  }
}

/**
 * Call Anthropic Claude API
 */
async function callAnthropic(
  prompt: string,
  model: string,
  config: Record<string, any>,
  apiKey: string
) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      max_tokens: config.max_tokens || 2000,
      messages: [{ role: 'user', content: prompt }],
      temperature: config.temperature || 0.7,
      top_p: config.top_p || 0.9,
    }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(`Anthropic API error: ${error.error?.message || 'Unknown error'}`)
  }

  const data = await response.json()

  return {
    output: data.content[0].text,
    inputTokens: data.usage.input_tokens,
    outputTokens: data.usage.output_tokens,
    totalTokens: data.usage.input_tokens + data.usage.output_tokens,
  }
}

/**
 * Calculate cost based on token usage and model
 */
function calculateCost(
  model: string,
  inputTokens: number,
  outputTokens: number
): number {
  const pricing = TOKEN_COUNTS[model as keyof typeof TOKEN_COUNTS] || {
    input: 0.00001,
    output: 0.00001,
  }

  return inputTokens * pricing.input + outputTokens * pricing.output
}

/**
 * POST handler
 */
export async function POST(request: NextRequest) {
  try {
    const body: ExecuteRequest = await request.json()
    const { promptVersionId, variables, apiKey } = body

    // Validate input
    if (!promptVersionId || !variables) {
      return NextResponse.json(
        { error: 'Missing required fields: promptVersionId, variables' },
        { status: 400 }
      )
    }

    const startTime = Date.now()

    // Step 1: Compile the prompt
    let compiled
    try {
      compiled = await compilePrompt(promptVersionId)
    } catch (error) {
      return NextResponse.json(
        { error: `Failed to compile prompt: ${error instanceof Error ? error.message : String(error)}` },
        { status: 400 }
      )
    }

    // Step 2: Substitute variables
    const { result: finalPrompt, missingVariables } = substituteVariables(
      compiled.compiled,
      variables
    )

    if (missingVariables.length > 0) {
      return NextResponse.json(
        {
          error: `Missing required variables: ${missingVariables.join(', ')}`,
          providedVariables: Object.keys(variables),
          requiredVariables: compiled.variables,
        },
        { status: 400 }
      )
    }

    // Step 3: Call LLM API
    let llmResponse
    const model = compiled.model_config?.model || 'gpt-3.5-turbo'

    try {
      // Determine which API to use based on model
      if (model.includes('claude')) {
        const claudeApiKey = apiKey || process.env.ANTHROPIC_API_KEY
        if (!claudeApiKey) {
          throw new Error('Anthropic API key not provided or configured')
        }
        llmResponse = await callAnthropic(finalPrompt, model, compiled.model_config, claudeApiKey)
      } else {
        const openaiApiKey = apiKey || process.env.OPENAI_API_KEY
        if (!openaiApiKey) {
          throw new Error('OpenAI API key not provided or configured')
        }
        llmResponse = await callOpenAI(finalPrompt, model, compiled.model_config, openaiApiKey)
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error)

      // Create failed test run
      const testRun = await prisma.testRun.create({
        data: {
          promptVersionId,
          promptId: compiled.promptId,
          workspaceId: 'workspace_default', // TODO: Get from auth context
          variables,
          compiledPrompt: finalPrompt,
          status: 'error',
          errorMessage: errorMsg,
          model,
          latencyMs: Date.now() - startTime,
        },
      })

      return NextResponse.json(
        {
          testRunId: testRun.id,
          error: errorMsg,
          status: 'error',
          latencyMs: testRun.latencyMs,
        },
        { status: 500 }
      )
    }

    // Step 4: Calculate cost
    const costUsd = calculateCost(
      model,
      llmResponse.inputTokens,
      llmResponse.outputTokens
    )
    const latencyMs = Date.now() - startTime

    // Step 5: Store test run in database
    const testRun = await prisma.testRun.create({
      data: {
        promptVersionId,
        promptId: compiled.promptId,
        workspaceId: 'workspace_default', // TODO: Get from auth context
        variables,
        compiledPrompt: finalPrompt,
        output: llmResponse.output,
        model,
        inputTokens: llmResponse.inputTokens,
        outputTokens: llmResponse.outputTokens,
        totalTokens: llmResponse.totalTokens,
        costUsd,
        latencyMs,
        status: 'success',
      },
    })

    // Return success response
    return NextResponse.json(
      {
        testRunId: testRun.id,
        output: llmResponse.output,
        inputTokens: llmResponse.inputTokens,
        outputTokens: llmResponse.outputTokens,
        totalTokens: llmResponse.totalTokens,
        costUsd: parseFloat(costUsd.toFixed(4)),
        latencyMs,
        status: 'success',
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}

/**
 * GET handler - fetch test run history
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const promptVersionId = searchParams.get('promptVersionId')
    const limit = parseInt(searchParams.get('limit') || '10')

    if (!promptVersionId) {
      return NextResponse.json(
        { error: 'Missing promptVersionId parameter' },
        { status: 400 }
      )
    }

    const testRuns = await prisma.testRun.findMany({
      where: { promptVersionId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })

    return NextResponse.json({ testRuns }, { status: 200 })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch test runs',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}
