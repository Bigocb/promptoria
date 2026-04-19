import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyAccessToken } from '@/lib/jwt'

async function getWorkspaceForUser(userId: string) {
  return prisma.workspace.findFirst({ where: { user_id: userId } })
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
    const { entity_type, entity_id, content, title } = body

    if (!entity_type || !entity_id || !content) {
      return NextResponse.json(
        { error: 'entity_type, entity_id, and content are required' },
        { status: 400 }
      )
    }

    // Verify ownership of the entity
    if (entity_type === 'prompt') {
      const prompt = await prisma.prompt.findFirst({
        where: { id: entity_id, workspace_id: workspace.id },
      })
      if (!prompt)
        return NextResponse.json(
          { error: 'Prompt not found or does not belong to workspace' },
          { status: 404 }
        )
    } else if (entity_type === 'snippet') {
      const snippet = await prisma.snippet.findFirst({
        where: { id: entity_id, workspace_id: workspace.id },
      })
      if (!snippet)
        return NextResponse.json(
          { error: 'Snippet not found or does not belong to workspace' },
          { status: 404 }
        )
    }

    const noteId = `note_${Date.now()}`
    const note = {
      id: noteId,
      entity_type,
      entity_id,
      title: title || 'Note',
      content,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    await prisma.syncLog.create({
      data: {
        workspace_id: workspace.id,
        action: 'create',
        entity_type: 'note',
        entity_id: noteId,
        data: note,
      },
    })

    return NextResponse.json(note, { status: 201 })
  } catch (error: any) {
    console.error('Create note error:', error)
    return NextResponse.json(
      { error: 'Server error: ' + error.message },
      { status: 500 }
    )
  }
}

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
    const entity_type = searchParams.get('entity_type')
    const entity_id = searchParams.get('entity_id')

    const noteLogs = await prisma.syncLog.findMany({
      where: {
        workspace_id: workspace.id,
        entity_type: 'note',
        ...(entity_type ? { data: { path: ['entity_type'] } } : {}),
      },
      orderBy: { created_at: 'desc' },
    })

    let notes = noteLogs
      .map((log) => log.data)
      .filter((note): note is Record<string, any> => note !== null)

    if (entity_type) {
      notes = notes.filter((n) => n.entity_type === entity_type)
    }
    if (entity_id) {
      notes = notes.filter((n) => n.entity_id === entity_id)
    }

    return NextResponse.json({ notes }, { status: 200 })
  } catch (error: any) {
    console.error('Get notes error:', error)
    return NextResponse.json(
      { error: 'Server error: ' + error.message },
      { status: 500 }
    )
  }
}
