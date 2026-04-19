import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyAccessToken } from '@/lib/jwt'

async function getWorkspaceForUser(userId: string) {
  return prisma.workspace.findFirst({ where: { user_id: userId } })
}

export async function POST(
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

    // Get the prompt to clone
    const originalPrompt = await prisma.prompt.findUnique({
      where: { id: params.id },
      include: {
        versions: {
          orderBy: { version_number: 'desc' },
          take: 1,
        },
      },
    })

    if (!originalPrompt) {
      return NextResponse.json({ error: 'Prompt not found' }, { status: 404 })
    }

    if (originalPrompt.workspace_id !== workspace.id) {
      return NextResponse.json(
        { error: 'Unauthorized - not your prompt' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { name } = body

    if (!name) {
      return NextResponse.json({ error: 'name is required' }, { status: 400 })
    }

    // Create the cloned prompt
    const clonedPrompt = await prisma.prompt.create({
      data: {
        name,
        description: `Clone of ${originalPrompt.name}`,
        workspace_id: workspace.id,
        tags: originalPrompt.tags,
        model: originalPrompt.model,
        category_id: originalPrompt.category_id,
      },
    })

    // Clone the latest version if it exists
    if (originalPrompt.versions.length > 0) {
      const latestVersion = originalPrompt.versions[0]
      await prisma.promptVersion.create({
        data: {
          prompt_id: clonedPrompt.id,
          version_number: 1,
          template_body: latestVersion.template_body,
          model_config: latestVersion.model_config,
          change_log: `Cloned from ${originalPrompt.name}`,
          created_by: userId,
        },
      })
    }

    // Log the clone action
    await prisma.syncLog.create({
      data: {
        workspace_id: workspace.id,
        action: 'create',
        entity_type: 'prompt',
        entity_id: clonedPrompt.id,
        data: { cloned_from: params.id },
      },
    })

    const result = await prisma.prompt.findUnique({
      where: { id: clonedPrompt.id },
      include: { versions: true },
    })

    return NextResponse.json(result, { status: 201 })
  } catch (error: any) {
    console.error('Clone prompt error:', error)
    return NextResponse.json(
      { error: 'Server error: ' + error.message },
      { status: 500 }
    )
  }
}
