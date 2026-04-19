import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyAccessToken } from '@/lib/jwt'
import { Anthropic } from '@anthropic-ai/sdk'

async function getWorkspaceForUser(userId: string) {
  return prisma.workspace.findFirst({ where: { user_id: userId } })
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Get prompt and latest version
    const prompt = await prisma.prompt.findUnique({
      where: { id: params.id },
      include: {
        versions: {
          orderBy: { version_number: 'desc' },
          take: 1,
        },
      },
    })

    if (!prompt || prompt.workspace_id !== workspace.id) {
      return NextResponse.json(
        { error: 'Prompt not found or does not belong to your workspace' },
        { status: 404 }
      )
    }

    const version = prompt.versions[0]
    if (!version) {
      return NextResponse.json(
        { error: 'No version found for prompt' },
        { status: 404 }
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

    // Get suggestions from Claude
    const suggestionPrompt = `You are a prompt engineering expert. Analyze this prompt and provide 3-5 specific, actionable suggestions for improvement:

Prompt Name: ${prompt.name}
Description: ${prompt.description || 'N/A'}
Template:
${version.template_body}

Provide suggestions in JSON format with this structure:
{
  "suggestions": [
    {
      "title": "Brief title of suggestion",
      "description": "Detailed explanation",
      "example": "Example of the improved text",
      "priority": "high|medium|low"
    }
  ]
}`

    const message = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: suggestionPrompt,
        },
      ],
    })

    const responseText = message.content
      .filter((block: any) => block.type === 'text')
      .map((block: any) => block.text)
      .join('\n')

    // Try to parse JSON from response
    let suggestions = []
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        suggestions = parsed.suggestions || []
      }
    } catch (e) {
      // If JSON parsing fails, return raw text as a single suggestion
      suggestions = [
        {
          title: 'Suggestions',
          description: responseText,
          priority: 'medium',
        },
      ]
    }

    // Log suggestion request
    await prisma.syncLog.create({
      data: {
        workspace_id: workspace.id,
        action: 'suggest',
        entity_type: 'prompt',
        entity_id: params.id,
        data: { suggestion_count: suggestions.length },
      },
    })

    return NextResponse.json(
      {
        prompt_id: params.id,
        prompt_name: prompt.name,
        suggestions,
        generated_at: new Date().toISOString(),
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('Get suggestions error:', error)
    return NextResponse.json(
      { error: 'Server error: ' + error.message },
      { status: 500 }
    )
  }
}
