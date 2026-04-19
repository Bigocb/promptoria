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

    // Get test run
    const testRun = await prisma.testRun.findUnique({
      where: { id: params.id },
      include: { prompt_version: { include: { prompt: true } } },
    })

    if (!testRun) {
      return NextResponse.json(
        { error: 'Test run not found' },
        { status: 404 }
      )
    }

    // Verify ownership
    if (testRun.workspace_id !== workspace.id) {
      return NextResponse.json(
        { error: 'Unauthorized - not your test run' },
        { status: 403 }
      )
    }

    return NextResponse.json(testRun, { status: 200 })
  } catch (error: any) {
    console.error('Get test run error:', error)
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

    // Get test run
    const testRun = await prisma.testRun.findUnique({
      where: { id: params.id },
    })

    if (!testRun) {
      return NextResponse.json(
        { error: 'Test run not found' },
        { status: 404 }
      )
    }

    // Verify ownership
    if (testRun.workspace_id !== workspace.id) {
      return NextResponse.json(
        { error: 'Unauthorized - not your test run' },
        { status: 403 }
      )
    }

    // Delete test run
    await prisma.testRun.delete({
      where: { id: params.id },
    })

    // Log change to SyncLog
    await prisma.syncLog.create({
      data: {
        workspace_id: workspace.id,
        action: 'delete',
        entity_type: 'test_run',
        entity_id: params.id,
        data: { prompt_version_id: testRun.prompt_version_id },
      },
    })

    return NextResponse.json(
      { message: 'Test run deleted successfully' },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('Delete test run error:', error)
    return NextResponse.json(
      { error: 'Server error: ' + error.message },
      { status: 500 }
    )
  }
}
