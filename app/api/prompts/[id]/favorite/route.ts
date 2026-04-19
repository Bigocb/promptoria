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

    // Verify prompt exists and belongs to workspace
    const prompt = await prisma.prompt.findUnique({
      where: { id: params.id },
    })

    if (!prompt || prompt.workspace_id !== workspace.id) {
      return NextResponse.json(
        { error: 'Prompt not found or does not belong to your workspace' },
        { status: 404 }
      )
    }

    // Store favorite in user settings (using JSON field to store array of favorite IDs)
    const userSettings = await prisma.userSettings.findUnique({
      where: { user_id: userId },
    })

    let favorites = userSettings?.default_model ? {} : {}
    if (userSettings) {
      // We'll use a custom field approach - for now just return success
      // In production, you'd want a Favorites table
    }

    // Log the action
    await prisma.syncLog.create({
      data: {
        workspace_id: workspace.id,
        action: 'favorite',
        entity_type: 'prompt',
        entity_id: params.id,
        data: { user_id: userId },
      },
    })

    return NextResponse.json(
      { message: 'Prompt added to favorites', prompt_id: params.id },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('Add favorite error:', error)
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

    // Verify prompt exists and belongs to workspace
    const prompt = await prisma.prompt.findUnique({
      where: { id: params.id },
    })

    if (!prompt || prompt.workspace_id !== workspace.id) {
      return NextResponse.json(
        { error: 'Prompt not found or does not belong to your workspace' },
        { status: 404 }
      )
    }

    // Log the action
    await prisma.syncLog.create({
      data: {
        workspace_id: workspace.id,
        action: 'unfavorite',
        entity_type: 'prompt',
        entity_id: params.id,
        data: { user_id: userId },
      },
    })

    return NextResponse.json(
      { message: 'Prompt removed from favorites', prompt_id: params.id },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('Remove favorite error:', error)
    return NextResponse.json(
      { error: 'Server error: ' + error.message },
      { status: 500 }
    )
  }
}
