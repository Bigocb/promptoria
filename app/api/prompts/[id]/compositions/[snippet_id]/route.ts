import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyAccessToken } from '@/lib/jwt'

// Helper to verify ownership
async function getWorkspaceForUser(userId: string) {
  return prisma.workspace.findFirst({
    where: { user_id: userId },
  })
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; snippet_id: string } }
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

    // Find and delete composition
    const composition = await prisma.promptComposition.findUnique({
      where: {
        prompt_version_id_snippet_id: {
          prompt_version_id: latestVersion.id,
          snippet_id: params.snippet_id,
        },
      },
    })

    if (!composition) {
      return NextResponse.json(
        { error: 'Composition not found' },
        { status: 404 }
      )
    }

    await prisma.promptComposition.delete({
      where: { id: composition.id },
    })

    return NextResponse.json(
      { message: 'Snippet removed from composition' },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('Remove composition error:', error)
    return NextResponse.json(
      { error: 'Server error: ' + error.message },
      { status: 500 }
    )
  }
}
