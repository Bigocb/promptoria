import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyAccessToken } from '@/lib/jwt'

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

    // Verify prompt version exists and belongs to workspace
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

    // If variables are provided instead of test_case_input, build the test input
    let finalTestInput = test_case_input
    if (!finalTestInput && variables) {
      // Substitute variables into the template
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

    // Create test run
    const testRun = await prisma.testRun.create({
      data: {
        workspace_id: workspace.id,
        prompt_version_id,
        test_case_input: finalTestInput,
        status: 'pending',
      },
    })

    // Immediately execute the test run inline to match frontend expectations
    const { Anthropic } = await import('@anthropic-ai/sdk')

    // Get user settings for API key
    const userSettings = await prisma.userSettings.findUnique({
      where: { user_id: userId },
    })

    const apiKey = userSettings?.anthropic_api_key || process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      await prisma.testRun.update({
        where: { id: testRun.id },
        data: {
          status: 'error',
          error_message: 'No Anthropic API key configured',
          completed_at: new Date(),
        },
      })
      return NextResponse.json(
        { error: 'No Anthropic API key configured' },
        { status: 400 }
      )
    }

    const anthropic = new Anthropic({ apiKey })
    const startTime = Date.now()

    // Call Claude API
    const modelToUse = model || promptVersion.prompt.model || 'claude-3-haiku-20240307'
    const tempToUse = temperature ?? 0.7
    const maxTokensToUse = max_tokens || 1024

    const message = await anthropic.messages.create({
      model: modelToUse,
      max_tokens: maxTokensToUse,
      temperature: tempToUse,
      messages: [
        {
          role: 'user',
          content: finalTestInput,
        },
      ],
    })

    const endTime = Date.now()
    const durationMs = endTime - startTime

    // Extract output
    const output = message.content
      .filter((block: any) => block.type === 'text')
      .map((block: any) => block.text)
      .join('\n')

    // Count tokens
    const totalTokens = (message.usage?.input_tokens || 0) + (message.usage?.output_tokens || 0)

    // Update test run with results
    const updatedTestRun = await prisma.testRun.update({
      where: { id: testRun.id },
      data: {
        status: 'success',
        output,
        completed_at: new Date(),
        duration_ms: durationMs,
      },
    })

    // Log execution
    await prisma.syncLog.create({
      data: {
        workspace_id: workspace.id,
        action: 'execute',
        entity_type: 'test_run',
        entity_id: testRun.id,
        data: { status: 'success', duration_ms: durationMs, total_tokens: totalTokens },
      },
    })

    // Return response in format frontend expects
    return NextResponse.json({
      id: updatedTestRun.id,
      created_at: updatedTestRun.created_at,
      model: modelToUse,
      output,
      total_tokens: totalTokens,
      latency_ms: durationMs,
      request_duration_ms: durationMs,
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
