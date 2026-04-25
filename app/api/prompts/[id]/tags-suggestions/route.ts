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

    const tagPrompt = `You are a prompt classification expert. Analyze this prompt and suggest 5-10 relevant tags that would categorize it well.

Prompt Name: ${prompt.name}
Description: ${prompt.description || 'N/A'}
Template:
${version.template_body}

Provide tags in JSON format:
{
  "tags": ["tag1", "tag2", "tag3", ...]
}

Make tags concise (1-2 words), lowercase, and descriptive of the prompt's purpose or domain (e.g., "content-generation", "data-analysis", "code-review", "summarization", etc.)`

    const userSettings = await prisma.userSettings.findUnique({
      where: { user_id: userId },
    })
    const model = userSettings?.default_model || 'llama3.2'

    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    if (OLLAMA_API_KEY) {
      headers['Authorization'] = `Bearer ${OLLAMA_API_KEY}`
    }

    const ollamaResponse = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model,
        prompt: tagPrompt,
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

    let tags: string[] = []
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        tags = parsed.tags || []
      }
    } catch (e) {
      const tagMatches = responseText.match(/"([^"]+)"/g)
      if (tagMatches) {
        tags = tagMatches.map(t => t.replace(/"/g, ''))
      }
    }

    await prisma.syncLog.create({
      data: {
        workspace_id: workspace.id,
        action: 'suggest',
        entity_type: 'prompt_tags',
        entity_id: params.id,
        data: { tag_count: tags.length },
      },
    })

    return NextResponse.json(
      {
        prompt_id: params.id,
        prompt_name: prompt.name,
        tags,
        generated_at: new Date().toISOString(),
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('Get tag suggestions error:', error)
    return NextResponse.json(
      { error: 'Server error: ' + error.message },
      { status: 500 }
    )
  }
}