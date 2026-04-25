import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyAccessToken } from '@/lib/jwt'

// Helper to verify ownership
async function getWorkspaceForUser(userId: string) {
  return prisma.workspace.findFirst({
    where: { user_id: userId },
  })
}

export async function GET(
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

    // Get prompt with all versions
    const prompt = await prisma.prompt.findUnique({
      where: { id: params.id },
      include: {
        versions: {
          orderBy: { version_number: 'desc' },
        },
        category: {
          include: {
            interaction_type: true,
          },
        },
      },
    })

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt not found' },
        { status: 404 }
      )
    }

    // Verify ownership
    if (prompt.workspace_id !== workspace.id) {
      return NextResponse.json(
        { error: 'Unauthorized - not your prompt' },
        { status: 403 }
      )
    }

    return NextResponse.json(
      {
        id: prompt.id,
        name: prompt.name,
        description: prompt.description,
        tags: prompt.tags,
        model: prompt.model,
        category_id: prompt.category_id,
        agent_interaction_type_id: prompt.category?.agent_interaction_type_id || null,
        versions: prompt.versions,
        created_at: prompt.created_at,
        updated_at: prompt.updated_at,
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('Get prompt error:', error)
    return NextResponse.json(
      { error: 'Server error: ' + error.message },
      { status: 500 }
    )
  }
}

export async function PUT(
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

    // Get existing prompt
    const existingPrompt = await prisma.prompt.findUnique({
      where: { id: params.id },
      include: { versions: true },
    })

    if (!existingPrompt) {
      return NextResponse.json(
        { error: 'Prompt not found' },
        { status: 404 }
      )
    }

    // Verify ownership
    if (existingPrompt.workspace_id !== workspace.id) {
      return NextResponse.json(
        { error: 'Unauthorized - not your prompt' },
        { status: 403 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { name, description, template_body, tags, model, model_config, change_log, category_id } = body

    // Get latest version number
    const latestVersion = existingPrompt.versions.reduce((max, v) =>
      v.version_number > max ? v.version_number : max, 0
    )

    // Update prompt and create new version (if template changed)
    const updatedPrompt = await prisma.prompt.update({
      where: { id: params.id },
      data: {
        name: name !== undefined ? name : existingPrompt.name,
        description: description !== undefined ? description : existingPrompt.description,
        tags: tags !== undefined ? tags : existingPrompt.tags,
        model: model !== undefined ? model : existingPrompt.model,
        ...(category_id !== undefined && { category_id: category_id || null }),
        ...(template_body && {
          versions: {
            create: {
              version_number: latestVersion + 1,
              template_body,
              model_config: model_config || { temperature: 0.7, maxTokens: 500 },
              change_log: change_log || 'Updated',
              is_active: true,
            },
          },
        }),
      },
      include: {
        versions: {
          orderBy: { version_number: 'desc' },
        },
      },
    })

    // Log change to SyncLog
    await prisma.syncLog.create({
      data: {
        workspace_id: workspace.id,
        action: 'update',
        entity_type: 'prompt',
        entity_id: params.id,
        data: { name: updatedPrompt.name, model: updatedPrompt.model },
      },
    })

    return NextResponse.json(
      {
        id: updatedPrompt.id,
        name: updatedPrompt.name,
        description: updatedPrompt.description,
        tags: updatedPrompt.tags,
        model: updatedPrompt.model,
        category_id: updatedPrompt.category_id,
        versions: updatedPrompt.versions,
        created_at: updatedPrompt.created_at,
        updated_at: updatedPrompt.updated_at,
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('Update prompt error:', error)
    return NextResponse.json(
      { error: 'Server error: ' + error.message },
      { status: 500 }
    )
  }
}

export async function DELETE(
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

    // Get prompt
    const prompt = await prisma.prompt.findUnique({
      where: { id: params.id },
    })

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt not found' },
        { status: 404 }
      )
    }

    // Verify ownership
    if (prompt.workspace_id !== workspace.id) {
      return NextResponse.json(
        { error: 'Unauthorized - not your prompt' },
        { status: 403 }
      )
    }

    // Delete prompt (versions cascade delete)
    await prisma.prompt.delete({
      where: { id: params.id },
    })

    // Log change to SyncLog
    await prisma.syncLog.create({
      data: {
        workspace_id: workspace.id,
        action: 'delete',
        entity_type: 'prompt',
        entity_id: params.id,
        data: { name: prompt.name },
      },
    })

    return NextResponse.json(
      { message: 'Prompt deleted successfully' },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('Delete prompt error:', error)
    return NextResponse.json(
      { error: 'Server error: ' + error.message },
      { status: 500 }
    )
  }
}
