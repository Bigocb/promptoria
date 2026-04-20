import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyAccessToken } from '@/lib/jwt'

export async function POST(request: NextRequest) {
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
    const workspace = await prisma.workspace.findFirst({
      where: { user_id: userId },
    })

    if (!workspace) {
      return NextResponse.json(
        { error: 'Workspace not found' },
        { status: 404 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { name, description, content } = body

    // Validate required fields
    if (!name || !content) {
      return NextResponse.json(
        { error: 'name and content are required' },
        { status: 400 }
      )
    }

    // Create snippet
    const snippet = await prisma.snippet.create({
      data: {
        name,
        description: description || null,
        content,
        workspace_id: workspace.id,
      },
    })

    // Log change to SyncLog
    await prisma.syncLog.create({
      data: {
        workspace_id: workspace.id,
        action: 'create',
        entity_type: 'snippet',
        entity_id: snippet.id,
        data: { name },
      },
    })

    return NextResponse.json(snippet, { status: 201 })
  } catch (error: any) {
    console.error('Create snippet error:', error)
    return NextResponse.json(
      { error: 'Server error: ' + error.message },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
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
    const workspace = await prisma.workspace.findFirst({
      where: { user_id: userId },
    })

    if (!workspace) {
      return NextResponse.json(
        { error: 'Workspace not found' },
        { status: 404 }
      )
    }

    // Parse pagination parameters
    const skipParam = request.nextUrl.searchParams.get('skip')
    const takeParam = request.nextUrl.searchParams.get('take')

    let skip = 0
    let take = 20

    if (skipParam) {
      const parsedSkip = parseInt(skipParam)
      if (!isNaN(parsedSkip) && parsedSkip >= 0) {
        skip = parsedSkip
      }
    }

    if (takeParam) {
      const parsedTake = parseInt(takeParam)
      if (!isNaN(parsedTake) && parsedTake > 0 && parsedTake <= 100) {
        take = parsedTake
      }
    }

    // Get total count for pagination
    const total = await prisma.snippet.count({
      where: { workspace_id: workspace.id },
    })

    // Get paginated snippets in workspace
    const snippets = await prisma.snippet.findMany({
      where: { workspace_id: workspace.id },
      orderBy: { updated_at: 'desc' },
      skip,
      take,
    })

    return NextResponse.json(
      {
        snippets,
        pagination: {
          skip,
          take,
          total,
        },
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('List snippets error:', error)
    return NextResponse.json(
      { error: 'Server error: ' + error.message },
      { status: 500 }
    )
  }
}
