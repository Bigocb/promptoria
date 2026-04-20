import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyAccessToken } from '@/lib/jwt'

async function getWorkspaceForUser(userId: string) {
  return prisma.workspace.findFirst({ where: { user_id: userId } })
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

    // Get counts for various resources
    const [
      promptCount,
      promptVersionCount,
      snippetCount,
      interactionTypeCount,
      categoryCount,
      testRunCount,
      successfulTestRuns,
      failedTestRuns,
    ] = await Promise.all([
      prisma.prompt.count({
        where: { workspace_id: workspace.id },
      }),
      prisma.promptVersion.count({
        where: { prompt: { workspace_id: workspace.id } },
      }),
      prisma.snippet.count({
        where: { workspace_id: workspace.id },
      }),
      prisma.agentInteractionType.count({
        where: { workspace_id: workspace.id },
      }),
      prisma.promptCategory.count({
        where: { workspace_id: workspace.id },
      }),
      prisma.testRun.count({
        where: { workspace_id: workspace.id },
      }),
      prisma.testRun.count({
        where: { workspace_id: workspace.id, status: 'success' },
      }),
      prisma.testRun.count({
        where: { workspace_id: workspace.id, status: 'error' },
      }),
    ])

    // Get recent test runs
    const recentTestRuns = await prisma.testRun.findMany({
      where: { workspace_id: workspace.id },
      orderBy: { created_at: 'desc' },
      take: 5,
      select: {
        id: true,
        status: true,
        created_at: true,
        duration_ms: true,
      },
    })

    // Get recent prompts
    const recentPrompts = await prisma.prompt.findMany({
      where: { workspace_id: workspace.id },
      orderBy: { updated_at: 'desc' },
      take: 5,
      select: {
        id: true,
        name: true,
        created_at: true,
        updated_at: true,
      },
    })

    // Get recent snippets
    const recentSnippets = await prisma.snippet.findMany({
      where: { workspace_id: workspace.id },
      orderBy: { created_at: 'desc' },
      take: 5,
      select: {
        id: true,
        name: true,
        created_at: true,
      },
    })

    // Get average test run duration
    const avgDurationResult = await prisma.testRun.aggregate({
      where: {
        workspace_id: workspace.id,
        status: 'success',
        duration_ms: { not: null },
      },
      _avg: { duration_ms: true },
    })

    const stats = {
      workspace: {
        id: workspace.id,
        name: workspace.name,
      },
      resources: {
        prompts: promptCount,
        prompt_versions: promptVersionCount,
        snippets: snippetCount,
        interaction_types: interactionTypeCount,
        categories: categoryCount,
      },
      recent: {
        prompts: recentPrompts,
        snippets: recentSnippets,
      },
      testing: {
        total_test_runs: testRunCount,
        successful_runs: successfulTestRuns,
        failed_runs: failedTestRuns,
        success_rate:
          testRunCount > 0 ? ((successfulTestRuns / testRunCount) * 100).toFixed(1) : 0,
        average_duration_ms: avgDurationResult._avg.duration_ms || 0,
        recent_runs: recentTestRuns,
      },
    }

    return NextResponse.json(stats, { status: 200 })
  } catch (error: any) {
    console.error('Get dashboard stats error:', error)
    return NextResponse.json(
      { error: 'Server error: ' + error.message },
      { status: 500 }
    )
  }
}
