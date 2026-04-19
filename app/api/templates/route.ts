import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyAccessToken } from '@/lib/jwt'

async function getWorkspaceForUser(userId: string) {
  return prisma.workspace.findFirst({ where: { user_id: userId } })
}

// Built-in templates
const BUILTIN_TEMPLATES = [
  {
    id: 'template_qa',
    name: 'Q&A Template',
    description: 'Question and answer prompt template',
    template_body: 'Question: {input}\n\nProvide a clear and concise answer.',
  },
  {
    id: 'template_summary',
    name: 'Summarization Template',
    description: 'Summarize provided content',
    template_body: 'Please summarize the following text in 3-5 bullet points:\n\n{input}',
  },
  {
    id: 'template_creative',
    name: 'Creative Writing Template',
    description: 'Generate creative content based on a prompt',
    template_body:
      'Write a creative piece based on this idea: {input}\n\nMake it engaging and original.',
  },
  {
    id: 'template_analysis',
    name: 'Analysis Template',
    description: 'Analyze and provide insights',
    template_body: 'Analyze the following and provide key insights:\n\n{input}\n\nStructure your response with clear sections.',
  },
  {
    id: 'template_explain',
    name: 'Explain Template',
    description: 'Explain complex concepts',
    template_body:
      'Explain this concept in simple terms that a beginner would understand:\n\n{input}',
  },
]

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

    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')

    let templates = BUILTIN_TEMPLATES
    if (category) {
      templates = templates.filter((t) => t.id.includes(category))
    }

    // Get custom templates from sync logs
    const customTemplateLogs = await prisma.syncLog.findMany({
      where: {
        workspace_id: workspace.id,
        entity_type: 'template',
        action: 'create',
      },
      orderBy: { created_at: 'desc' },
    })

    const customTemplates = customTemplateLogs
      .map((log) => log.data)
      .filter((data): data is Record<string, any> => data !== null)

    return NextResponse.json(
      {
        builtin_templates: templates,
        custom_templates: customTemplates,
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('List templates error:', error)
    return NextResponse.json(
      { error: 'Server error: ' + error.message },
      { status: 500 }
    )
  }
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
    const { name, description, template_body } = body

    if (!name || !template_body) {
      return NextResponse.json(
        { error: 'name and template_body are required' },
        { status: 400 }
      )
    }

    const templateId = `template_${Date.now()}`
    const template = {
      id: templateId,
      name,
      description: description || '',
      template_body,
      created_at: new Date().toISOString(),
    }

    await prisma.syncLog.create({
      data: {
        workspace_id: workspace.id,
        action: 'create',
        entity_type: 'template',
        entity_id: templateId,
        data: template,
      },
    })

    return NextResponse.json(template, { status: 201 })
  } catch (error: any) {
    console.error('Create template error:', error)
    return NextResponse.json(
      { error: 'Server error: ' + error.message },
      { status: 500 }
    )
  }
}
