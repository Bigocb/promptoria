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

    // Get category
    const category = await prisma.promptCategory.findUnique({
      where: { id: params.id },
      include: { interaction_type: true, prompts: true },
    })

    if (!category) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      )
    }

    // Verify ownership
    if (category.workspace_id !== workspace.id) {
      return NextResponse.json(
        { error: 'Unauthorized - not your category' },
        { status: 403 }
      )
    }

    return NextResponse.json(category, { status: 200 })
  } catch (error: any) {
    console.error('Get category error:', error)
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

    // Get existing category
    const existingCategory = await prisma.promptCategory.findUnique({
      where: { id: params.id },
    })

    if (!existingCategory) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      )
    }

    // Verify ownership
    if (existingCategory.workspace_id !== workspace.id) {
      return NextResponse.json(
        { error: 'Unauthorized - not your category' },
        { status: 403 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { name, description, agent_interaction_type_id } = body

    // Update category
    const updatedCategory = await prisma.promptCategory.update({
      where: { id: params.id },
      data: {
        name: name !== undefined ? name : existingCategory.name,
        description: description !== undefined ? description : existingCategory.description,
        agent_interaction_type_id: agent_interaction_type_id !== undefined ? agent_interaction_type_id : existingCategory.agent_interaction_type_id,
      },
      include: { interaction_type: true, prompts: true },
    })

    // Log change to SyncLog
    await prisma.syncLog.create({
      data: {
        workspace_id: workspace.id,
        action: 'update',
        entity_type: 'category',
        entity_id: params.id,
        data: { name: updatedCategory.name },
      },
    })

    return NextResponse.json(updatedCategory, { status: 200 })
  } catch (error: any) {
    console.error('Update category error:', error)
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

    // Get category
    const category = await prisma.promptCategory.findUnique({
      where: { id: params.id },
    })

    if (!category) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      )
    }

    // Verify ownership
    if (category.workspace_id !== workspace.id) {
      return NextResponse.json(
        { error: 'Unauthorized - not your category' },
        { status: 403 }
      )
    }

    // Delete category (prompts will have their category_id set to null due to SetNull)
    await prisma.promptCategory.delete({
      where: { id: params.id },
    })

    // Log change to SyncLog
    await prisma.syncLog.create({
      data: {
        workspace_id: workspace.id,
        action: 'delete',
        entity_type: 'category',
        entity_id: params.id,
        data: { name: category.name },
      },
    })

    return NextResponse.json(
      { message: 'Category deleted successfully' },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('Delete category error:', error)
    return NextResponse.json(
      { error: 'Server error: ' + error.message },
      { status: 500 }
    )
  }
}
