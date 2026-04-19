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

    // Get snippet
    const snippet = await prisma.snippet.findUnique({
      where: { id: params.id },
    })

    if (!snippet) {
      return NextResponse.json(
        { error: 'Snippet not found' },
        { status: 404 }
      )
    }

    // Verify ownership
    if (snippet.workspace_id !== workspace.id) {
      return NextResponse.json(
        { error: 'Unauthorized - not your snippet' },
        { status: 403 }
      )
    }

    return NextResponse.json(snippet, { status: 200 })
  } catch (error: any) {
    console.error('Get snippet error:', error)
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

    // Get existing snippet
    const existingSnippet = await prisma.snippet.findUnique({
      where: { id: params.id },
    })

    if (!existingSnippet) {
      return NextResponse.json(
        { error: 'Snippet not found' },
        { status: 404 }
      )
    }

    // Verify ownership
    if (existingSnippet.workspace_id !== workspace.id) {
      return NextResponse.json(
        { error: 'Unauthorized - not your snippet' },
        { status: 403 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { name, description, content } = body

    // Update snippet
    const updatedSnippet = await prisma.snippet.update({
      where: { id: params.id },
      data: {
        name: name !== undefined ? name : existingSnippet.name,
        description: description !== undefined ? description : existingSnippet.description,
        content: content !== undefined ? content : existingSnippet.content,
      },
    })

    // Log change to SyncLog
    await prisma.syncLog.create({
      data: {
        workspace_id: workspace.id,
        action: 'update',
        entity_type: 'snippet',
        entity_id: params.id,
        data: { name: updatedSnippet.name },
      },
    })

    return NextResponse.json(updatedSnippet, { status: 200 })
  } catch (error: any) {
    console.error('Update snippet error:', error)
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

    // Get snippet
    const snippet = await prisma.snippet.findUnique({
      where: { id: params.id },
    })

    if (!snippet) {
      return NextResponse.json(
        { error: 'Snippet not found' },
        { status: 404 }
      )
    }

    // Verify ownership
    if (snippet.workspace_id !== workspace.id) {
      return NextResponse.json(
        { error: 'Unauthorized - not your snippet' },
        { status: 403 }
      )
    }

    // Delete snippet (compositions cascade delete)
    await prisma.snippet.delete({
      where: { id: params.id },
    })

    // Log change to SyncLog
    await prisma.syncLog.create({
      data: {
        workspace_id: workspace.id,
        action: 'delete',
        entity_type: 'snippet',
        entity_id: params.id,
        data: { name: snippet.name },
      },
    })

    return NextResponse.json(
      { message: 'Snippet deleted successfully' },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('Delete snippet error:', error)
    return NextResponse.json(
      { error: 'Server error: ' + error.message },
      { status: 500 }
    )
  }
}
