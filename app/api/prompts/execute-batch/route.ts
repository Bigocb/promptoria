import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyAccessToken } from '@/lib/jwt'
import { Anthropic } from '@anthropic-ai/sdk'

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
    const { executions } = body // Array of {prompt_id, input}

    if (!Array.isArray(executions)) {
      return NextResponse.json(
        { error: 'executions must be an array' },
        { status: 400 }
      )
    }

    // Get user settings for API key
    const userSettings = await prisma.userSettings.findUnique({
      where: { user_id: userId },
    })

    const apiKey = userSettings?.anthropic_api_key || process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: 'No Anthropic API key configured' },
        { status: 400 }
      )
    }

    const anthropic = new Anthropic({ apiKey })
    const results = []

    for (const execution of executions) {
      const { prompt_id, input } = execution

      try {
        // Get the prompt and its latest version
        const prompt = await prisma.prompt.findUnique({
          where: { id: prompt_id },
          include: {
            versions: {
              orderBy: { version_number: 'desc' },
              take: 1,
            },
          },
        })

        if (!prompt || prompt.workspace_id !== workspace.id) {
          results.push({
            prompt_id,
            status: 'error',
            error: 'Prompt not found or does not belong to workspace',
          })
          continue
        }

        const version = prompt.versions[0]
        if (!version) {
          results.push({
            prompt_id,
            status: 'error',
            error: 'No version found for prompt',
          })
          continue
        }

        // Prepare the prompt
        const finalPrompt = version.template_body.replace('{input}', input)
        const modelConfig = version.model_config as any || {}
        const model = prompt.model || 'claude-3-haiku-20240307'
        const maxTokens = modelConfig.maxTokens || 1024
        const temperature = modelConfig.temperature ?? 0.7

        const startTime = Date.now()

        // Call Claude API
        const message = await anthropic.messages.create({
          model,
          max_tokens: maxTokens,
          temperature,
          messages: [{ role: 'user', content: finalPrompt }],
        })

        const endTime = Date.now()
        const durationMs = endTime - startTime

        const output = message.content
          .filter((block: any) => block.type === 'text')
          .map((block: any) => block.text)
          .join('\n')

        results.push({
          prompt_id,
          prompt_name: prompt.name,
          status: 'success',
          output,
          duration_ms: durationMs,
        })
      } catch (err: any) {
        results.push({
          prompt_id,
          status: 'error',
          error: err.message,
        })
      }
    }

    // Log batch execution
    await prisma.syncLog.create({
      data: {
        workspace_id: workspace.id,
        action: 'batch_execute',
        entity_type: 'prompts',
        entity_id: workspace.id,
        data: { count: executions.length },
      },
    })

    return NextResponse.json(
      {
        total: executions.length,
        successful: results.filter((r) => r.status === 'success').length,
        failed: results.filter((r) => r.status === 'error').length,
        results,
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('Batch execution error:', error)
    return NextResponse.json(
      { error: 'Server error: ' + error.message },
      { status: 500 }
    )
  }
}
