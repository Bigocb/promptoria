import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyAccessToken } from '@/lib/jwt'
import { consumeTokens } from '@/lib/quota'
import { resolveAvailableModel } from '@/lib/model-fallback'
import { canUserAccessModel, computeTestRunCost } from '@/lib/cost-tracker'
import { checkRateLimit } from '@/lib/rate-limit'
import Anthropic from '@anthropic-ai/sdk'

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434'
const OLLAMA_API_KEY = process.env.OLLAMA_API_KEY || ''

async function getWorkspaceForUser(userId: string) {
  return prisma.workspace.findFirst({ where: { user_id: userId } })
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    let userId: string
    try {
      const decoded = verifyAccessToken(token)
      userId = decoded.userId
    } catch (error) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const workspace = await getWorkspaceForUser(userId)
    if (!workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })
    }

    const body = await request.json()
    const {
      prompt_version_id,
      test_case_input,
      variables,
      model,
      temperature,
      max_tokens
    } = body

    if (!prompt_version_id) {
      return NextResponse.json(
        { error: 'prompt_version_id is required' },
        { status: 400 }
      )
    }

    const promptVersion = await prisma.promptVersion.findUnique({
      where: { id: prompt_version_id },
      include: { prompt: true },
    })

    if (!promptVersion || promptVersion.prompt.workspace_id !== workspace.id) {
      return NextResponse.json(
        { error: 'Prompt version not found or does not belong to your workspace' },
        { status: 404 }
      )
    }

    let finalTestInput = test_case_input
    if (!finalTestInput && variables) {
      let substituted = promptVersion.template_body
      for (const [key, value] of Object.entries(variables)) {
        substituted = substituted.replace(new RegExp(`\\{${key}\\}`, 'g'), String(value))
      }
      finalTestInput = substituted
    }

    if (!finalTestInput) {
      return NextResponse.json(
        { error: 'test_case_input or variables are required' },
        { status: 400 }
      )
    }

    const userSettings = await prisma.userSettings.findUnique({
      where: { user_id: userId },
    })

    const requestedModel = model || promptVersion.prompt.model || userSettings?.default_model || 'qwen3.5:2b'
    const modelToUse = await resolveAvailableModel(requestedModel, promptVersion.prompt.model, userSettings?.default_model)
    const tempToUse = temperature ?? userSettings?.default_temperature ?? 0.7
    const maxTokensToUse = max_tokens || userSettings?.default_max_tokens || 1024

    const accessCheck = await canUserAccessModel(userId, modelToUse)
    if (!accessCheck.allowed) {
      return NextResponse.json(
        { error: accessCheck.reason || 'Model not available for your tier' },
        { status: 403 }
      )
    }

    const rateLimit = checkRateLimit(userId)
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please wait before running another test.', retryAfterMs: rateLimit.resetInMs },
        { status: 429, headers: { 'Retry-After': String(Math.ceil(rateLimit.resetInMs / 1000)) } }
      )
    }

    const estimatedTokens = Math.ceil(((finalTestInput?.length || 0) + maxTokensToUse) / 4)

    const quotaResult = await consumeTokens(userId, estimatedTokens)
    if (!quotaResult.allowed) {
      return NextResponse.json(
        {
          error: 'Daily token quota exceeded',
          quota: {
            used: quotaResult.remaining + estimatedTokens,
            limit: quotaResult.limit,
            remaining: quotaResult.remaining,
          },
        },
        { status: 429 }
      )
    }

    const testRun = await prisma.testRun.create({
      data: {
        workspace_id: workspace.id,
        prompt_id: promptVersion.prompt.id,
        prompt_version_id,
        user_id: userId,
        test_case_input: finalTestInput,
        model: modelToUse,
        temperature: tempToUse,
        max_tokens: maxTokensToUse,
        status: 'pending',
      },
    })

    const startTime = Date.now()
    let output: string = ''
    let totalTokens: number = 0

    try {
      const isClaudeModel = modelToUse.startsWith('claude-')

      if (isClaudeModel) {
        const apiKey = userSettings?.anthropic_api_key || process.env.ANTHROPIC_API_KEY
        if (!apiKey) throw new Error('No Anthropic API key configured. Add one in Settings.')

        const anthropic = new Anthropic({ apiKey })
        const message = await anthropic.messages.create({
          model: modelToUse,
          max_tokens: maxTokensToUse,
          temperature: tempToUse,
          messages: [{ role: 'user', content: finalTestInput }],
        })

        output = message.content
          .filter((block: any) => block.type === 'text')
          .map((block: any) => block.text)
          .join('\n')
        totalTokens = (message.usage?.input_tokens || 0) + (message.usage?.output_tokens || 0)
      } else {
        const headers: Record<string, string> = { 'Content-Type': 'application/json' }
        if (OLLAMA_API_KEY) {
          headers['Authorization'] = `Bearer ${OLLAMA_API_KEY}`
        }

        const ollamaResponse = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            model: modelToUse,
            prompt: finalTestInput,
            stream: false,
            options: {
              temperature: tempToUse,
              num_predict: maxTokensToUse,
            },
          }),
        })

        if (!ollamaResponse.ok) {
          const errorBody = await ollamaResponse.text()
          throw new Error(`Model server error (${ollamaResponse.status}): ${errorBody || ollamaResponse.statusText}`)
        }

        const ollamaData = await ollamaResponse.json()
        output = ollamaData.response || ''
        totalTokens = Math.ceil((finalTestInput.length + output.length) / 4)
      }
    } catch (error) {
      await prisma.testRun.update({
        where: { id: testRun.id },
        data: { status: 'error', error_message: error instanceof Error ? error.message : String(error), completed_at: new Date() },
      })
      throw error
    }

    const endTime = Date.now()
    const durationMs = endTime - startTime

    const isOllama = !modelToUse.startsWith('claude-')
    const costResult = await computeTestRunCost(modelToUse, totalTokens, durationMs, isOllama)

    await prisma.testRun.update({
      where: { id: testRun.id },
      data: {
        status: 'success',
        output,
        total_tokens: totalTokens,
        completed_at: new Date(),
        duration_ms: durationMs,
        cost_cents: costResult.cost_cents,
        gpu_seconds: costResult.gpu_seconds,
      },
    })

    await prisma.syncLog.create({
      data: {
        workspace_id: workspace.id,
        action: 'execute',
        entity_type: 'test_run',
        entity_id: testRun.id,
        data: { status: 'success', duration_ms: durationMs, total_tokens: totalTokens },
      },
    })

    return NextResponse.json({
      id: testRun.id,
      created_at: testRun.created_at,
      model: modelToUse,
      output,
      total_tokens: totalTokens,
      latency_ms: durationMs,
      request_duration_ms: durationMs,
      quota: {
        used: quotaResult.limit - quotaResult.remaining,
        limit: quotaResult.limit,
        remaining: quotaResult.remaining,
      },
    }, { status: 201 })
  } catch (error: any) {
    console.error('Create test run error:', error)
    return NextResponse.json(
      { error: 'Server error: ' + error.message },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    let userId: string
    try {
      const decoded = verifyAccessToken(token)
      userId = decoded.userId
    } catch (error) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const workspace = await getWorkspaceForUser(userId)
    if (!workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })
    }

    const testRuns = await prisma.testRun.findMany({
      where: { workspace_id: workspace.id },
      include: { prompt_version: { include: { prompt: true } } },
      orderBy: { created_at: 'desc' },
    })

    return NextResponse.json({ test_runs: testRuns }, { status: 200 })
  } catch (error: any) {
    console.error('List test runs error:', error)
    return NextResponse.json(
      { error: 'Server error: ' + error.message },
      { status: 500 }
    )
  }
}