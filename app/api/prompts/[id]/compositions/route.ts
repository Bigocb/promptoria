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

    // Get latest version's compositions
    const latestVersion = await prisma.promptVersion.findFirst({
      where: { prompt_id: params.id },
      orderBy: { version_number: 'desc' },
      include: {
        compositions: {
          include: { snippet: true },
          orderBy: { rank: 'asc' },
        },
      },
    })

    if (!latestVersion) {
      return NextResponse.json(
        { error: 'No versions found' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      {
        prompt_id: params.id,
        version_id: latestVersion.id,
        version_number: latestVersion.version_number,
        compositions: latestVersion.compositions.map(c => ({
          id: c.id,
          snippet_id: c.snippet_id,
          rank: c.rank,
          snippet: c.snippet,
        })),
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('Get compositions error:', error)
    return NextResponse.json(
      { error: 'Server error: ' + error.message },
      { status: 500 }
    )
  }
}

export async function POST(
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

    // Parse request body
    const body = await request.json()
    const { snippet_id, rank } = body

    // Validate required fields
    if (!snippet_id) {
      return NextResponse.json(
        { error: 'snippet_id is required' },
        { status: 400 }
      )
    }

    // Verify snippet exists and belongs to workspace
    const snippet = await prisma.snippet.findUnique({
      where: { id: snippet_id },
    })

    if (!snippet || snippet.workspace_id !== workspace.id) {
      return NextResponse.json(
        { error: 'Snippet not found or does not belong to your workspace' },
        { status: 404 }
      )
    }

    // Get latest version
    const latestVersion = await prisma.promptVersion.findFirst({
      where: { prompt_id: params.id },
      orderBy: { version_number: 'desc' },
    })

    if (!latestVersion) {
      return NextResponse.json(
        { error: 'No versions found for prompt' },
        { status: 404 }
      )
    }

    // Add composition
    const composition = await prisma.promptComposition.create({
      data: {
        prompt_version_id: latestVersion.id,
        snippet_id,
        rank: rank !== undefined ? rank : 0,
      },
      include: { snippet: true },
    })

    return NextResponse.json(composition, { status: 201 })
  } catch (error: any) {
    console.error('Add composition error:', error)
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

    // Parse request body - array of {snippet_id, rank}
    const body = await request.json()
    const compositions = Array.isArray(body) ? body : body.compositions

    if (!Array.isArray(compositions)) {
      return NextResponse.json(
        { error: 'compositions must be an array' },
        { status: 400 }
      )
    }

    // Get latest version
    const latestVersion = await prisma.promptVersion.findFirst({
      where: { prompt_id: params.id },
      orderBy: { version_number: 'desc' },
    })

    if (!latestVersion) {
      return NextResponse.json(
        { error: 'No versions found for prompt' },
        { status: 404 }
      )
    }

    // Update all compositions' ranks
    await Promise.all(
      compositions.map((comp: any) =>
        prisma.promptComposition.updateMany({
          where: {
            prompt_version_id: latestVersion.id,
            snippet_id: comp.snippet_id,
          },
          data: { rank: comp.rank },
        })
      )
    )

    // Return updated compositions
    const updated = await prisma.promptComposition.findMany({
      where: { prompt_version_id: latestVersion.id },
      include: { snippet: true },
      orderBy: { rank: 'asc' },
    })

    return NextResponse.json(updated, { status: 200 })
  } catch (error: any) {
    console.error('Reorder compositions error:', error)
    return NextResponse.json(
      { error: 'Server error: ' + error.message },
      { status: 500 }
    )
  }
}
