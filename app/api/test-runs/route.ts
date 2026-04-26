import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyAccessToken } from '@/lib/jwt'
import { consumeTokens } from '@/lib/quota'

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
        substituted = substituted.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), String(value))
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

    const modelToUse = model || promptVersion.prompt.model || userSettings?.default_model || 'llama3.2:3b'
    const tempToUse = temperature ?? userSettings?.default_temperature ?? 0.7
    const maxTokensToUse = max_tokens || userSettings?.default_max_tokens || 1024

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
    } catch (error) {
      await prisma.testRun.update({
        where: { id: testRun.id },
        data: { status: 'error', error_message: error instanceof Error ? error.message : String(error), completed_at: new Date() },
      })
      throw error
    }

    const endTime = Date.now()
    const durationMs = endTime - startTime

    await prisma.testRun.update({
      where: { id: testRun.id },
      data: {
        status: 'success',
        output,
        total_tokens: totalTokens,
        completed_at: new Date(),
        duration_ms: durationMs,
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