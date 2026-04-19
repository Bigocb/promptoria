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
    const { prompt_version_id, test_case_input } = body

    if (!prompt_version_id) {
      return NextResponse.json(
        { error: 'prompt_version_id is required' },
        { status: 400 }
      )
    }

    if (!test_case_input) {
      return NextResponse.json(
        { error: 'test_case_input is required' },
        { status: 400 }
      )
    }

    // Verify prompt version exists and belongs to workspace
    const promptVersion = await prisma.promptVersion.findUnique({
      where: { id: prompt_version_id },
      include: { prompt: true },
    })

    if (!promptVersion || promptVersion.prompt.workspace_id !== workspace.id) {
      return NextResponse.json(
        { error: 'Prompt version not found or does not belong to your workspace' },
        { status: 404 }
      )
    }

    const testRun = await prisma.testRun.create({
      data: {
        workspace_id: workspace.id,
        prompt_version_id,
        test_case_input,
        status: 'pending',
      },
    })

    await prisma.syncLog.create({
      data: {
        workspace_id: workspace.id,
        action: 'create',
        entity_type: 'test_run',
        entity_id: testRun.id,
        data: { prompt_version_id },
      },
    })

    return NextResponse.json(testRun, { status: 201 })
  } catch (error: any) {
    console.error('Create test run error:', error)
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

    const testRuns = await prisma.testRun.findMany({
      where: { workspace_id: workspace.id },
      include: { prompt_version: { include: { prompt: true } } },
      orderBy: { created_at: 'desc' },
    })

    return NextResponse.json({ test_runs: testRuns }, { status: 200 })
  } catch (error: any) {
    console.error('List test runs error:', error)
    return NextResponse.json(
      { error: 'Server error: ' + error.message },
      { status: 500 }
    )
  }
}
