import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyAccessToken } from '@/lib/jwt'

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434'
const OLLAMA_API_KEY = process.env.OLLAMA_API_KEY || ''

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

    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    if (OLLAMA_API_KEY) {
      headers['Authorization'] = `Bearer ${OLLAMA_API_KEY}`
    }

    const ollamaResponse = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: prompt.model || 'llama3.2',
        prompt: suggestionPrompt,
        stream: false,
      }),
    })

    if (!ollamaResponse.ok) {
      const errorBody = await ollamaResponse.text()
      return NextResponse.json(
        { error: `Model server error (${ollamaResponse.status}): ${errorBody || ollamaResponse.statusText}` },
        { status: 502 }
      )
    }

    const ollamaData = await ollamaResponse.json()
    const responseText: string = ollamaData.response || ''

    let suggestions = []
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        suggestions = parsed.suggestions || []
      }
    } catch (e) {
      suggestions = [
        {
          title: 'Suggestions',
          description: responseText,
          priority: 'medium',
        },
      ]
    }

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