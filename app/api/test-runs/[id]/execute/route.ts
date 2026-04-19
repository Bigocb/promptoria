import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyAccessToken } from '@/lib/jwt'
import { Anthropic } from '@anthropic-ai/sdk'

// Helper to verify ownership
async function getWorkspaceForUser(userId: string) {
  return prisma.workspace.findFirst({
    where: { user_id: userId },
  })
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify JWT token
    const authHeader = request.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized - missing or invalid token' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)
    let userId: string
    try {
      const decoded = verifyAccessToken(token)
      userId = decoded.userId
    } catch (error) {
      return NextResponse.json(
        { error: 'Unauthorized - invalid or expired token' },
        { status: 401 }
      )
    }

    // Get user's workspace
    const workspace = await getWorkspaceForUser(userId)
    if (!workspace) {
      return NextResponse.json(
        { error: 'Workspace not found' },
        { status: 404 }
      )
    }

    // Get test run
    let testRun = await prisma.testRun.findUnique({
      where: { id: params.id },
      include: { prompt_version: { include: { prompt: true } } },
    })

    if (!testRun) {
      return NextResponse.json(
        { error: 'Test run not found' },
        { status: 404 }
      )
    }

    // Verify ownership
    if (testRun.workspace_id !== workspace.id) {
      return NextResponse.json(
        { error: 'Unauthorized - not your test run' },
        { status: 403 }
      )
    }

    // Don't execute if already completed
    if (testRun.status !== 'pending' && testRun.status !== 'error') {
      return NextResponse.json(
        { error: 'Test run already executed' },
        { status: 400 }
      )
    }

    // Update status to running
    await prisma.testRun.update({
      where: { id: params.id },
      data: {
        status: 'running',
        started_at: new Date(),
      },
    })

    // Get user settings for API key
    const userSettings = await prisma.userSettings.findUnique({
      where: { user_id: userId },
    })

    const apiKey = userSettings?.anthropic_api_key || process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      await prisma.testRun.update({
        where: { id: params.id },
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

    // Prepare the prompt - replace {input} placeholder with test case input
    const promptTemplate = testRun.prompt_version.template_body
    const finalPrompt = promptTemplate.replace('{input}', testRun.test_case_input)

    // Get model config
    const modelConfig = testRun.prompt_version.model_config as any || {}
    const model = testRun.prompt_version.prompt.model || 'claude-3-haiku-20240307'
    const maxTokens = modelConfig.maxTokens || 1024
    const temperature = modelConfig.temperature ?? 0.7

    const startTime = Date.now()

    // Call Claude API
    const message = await anthropic.messages.create({
      model,
      max_tokens: maxTokens,
      temperature,
      messages: [
        {
          role: 'user',
          content: finalPrompt,
        },
      ],
    })

    const endTime = Date.now()
    const durationMs = endTime - startTime

    // Extract text content from response
    const output = message.content
      .filter((block: any) => block.type === 'text')
      .map((block: any) => block.text)
      .join('\n')

    // Update test run with results
    testRun = await prisma.testRun.update({
      where: { id: params.id },
      data: {
        status: 'success',
        output,
        completed_at: new Date(),
        duration_ms: durationMs,
      },
      include: { prompt_version: { include: { prompt: true } } },
    })

    // Log execution
    await prisma.syncLog.create({
      data: {
        workspace_id: workspace.id,
        action: 'execute',
        entity_type: 'test_run',
        entity_id: params.id,
        data: { status: 'success', duration_ms: durationMs },
      },
    })

    return NextResponse.json(testRun, { status: 200 })
  } catch (error: any) {
    console.error('Execute test run error:', error)

    // Try to update test run with error status
    try {
      await prisma.testRun.update({
        where: { id: params.id },
        data: {
          status: 'error',
          error_message: error.message || 'Unknown error',
          completed_at: new Date(),
        },
      })
    } catch (updateError) {
      console.error('Failed to update test run with error:', updateError)
    }

    return NextResponse.json(
      { error: 'Server error: ' + error.message },
      { status: 500 }
    )
  }
}
