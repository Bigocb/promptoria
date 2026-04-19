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

    // Get interaction type
    const interaction = await prisma.agentInteractionType.findUnique({
      where: { id: params.id },
      include: { categories: true },
    })

    if (!interaction) {
      return NextResponse.json(
        { error: 'Interaction type not found' },
        { status: 404 }
      )
    }

    // Verify ownership
    if (interaction.workspace_id !== workspace.id) {
      return NextResponse.json(
        { error: 'Unauthorized - not your interaction type' },
        { status: 403 }
      )
    }

    return NextResponse.json(interaction, { status: 200 })
  } catch (error: any) {
    console.error('Get interaction error:', error)
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

    // Get existing interaction
    const existingInteraction = await prisma.agentInteractionType.findUnique({
      where: { id: params.id },
    })

    if (!existingInteraction) {
      return NextResponse.json(
        { error: 'Interaction type not found' },
        { status: 404 }
      )
    }

    // Verify ownership
    if (existingInteraction.workspace_id !== workspace.id) {
      return NextResponse.json(
        { error: 'Unauthorized - not your interaction type' },
        { status: 403 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { name, description, emoji } = body

    // Update interaction
    const updatedInteraction = await prisma.agentInteractionType.update({
      where: { id: params.id },
      data: {
        name: name !== undefined ? name : existingInteraction.name,
        description: description !== undefined ? description : existingInteraction.description,
        emoji: emoji !== undefined ? emoji : existingInteraction.emoji,
      },
      include: { categories: true },
    })

    // Log change to SyncLog
    await prisma.syncLog.create({
      data: {
        workspace_id: workspace.id,
        action: 'update',
        entity_type: 'interaction_type',
        entity_id: params.id,
        data: { name: updatedInteraction.name },
      },
    })

    return NextResponse.json(updatedInteraction, { status: 200 })
  } catch (error: any) {
    console.error('Update interaction error:', error)
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

    // Get interaction
    const interaction = await prisma.agentInteractionType.findUnique({
      where: { id: params.id },
    })

    if (!interaction) {
      return NextResponse.json(
        { error: 'Interaction type not found' },
        { status: 404 }
      )
    }

    // Verify ownership
    if (interaction.workspace_id !== workspace.id) {
      return NextResponse.json(
        { error: 'Unauthorized - not your interaction type' },
        { status: 403 }
      )
    }

    // Delete interaction (categories cascade delete)
    await prisma.agentInteractionType.delete({
      where: { id: params.id },
    })

    // Log change to SyncLog
    await prisma.syncLog.create({
      data: {
        workspace_id: workspace.id,
        action: 'delete',
        entity_type: 'interaction_type',
        entity_id: params.id,
        data: { name: interaction.name },
      },
    })

    return NextResponse.json(
      { message: 'Interaction type deleted successfully' },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('Delete interaction error:', error)
    return NextResponse.json(
      { error: 'Server error: ' + error.message },
      { status: 500 }
    )
  }
}
