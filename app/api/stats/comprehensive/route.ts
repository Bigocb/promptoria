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

    // Get all counts
    const [
      promptCount,
      snippetCount,
      categoryCount,
      interactionCount,
      versionCount,
      testRunCount,
      syncLogCount,
    ] = await Promise.all([
      prisma.prompt.count({ where: { workspace_id: workspace.id } }),
      prisma.snippet.count({ where: { workspace_id: workspace.id } }),
      prisma.promptCategory.count({ where: { workspace_id: workspace.id } }),
      prisma.agentInteractionType.count({ where: { workspace_id: workspace.id } }),
      prisma.promptVersion.count({
        where: { prompt: { workspace_id: workspace.id } },
      }),
      prisma.testRun.count({ where: { workspace_id: workspace.id } }),
      prisma.syncLog.count({ where: { workspace_id: workspace.id } }),
    ])

    // Get test run statistics
    const testRunStats = await prisma.testRun.aggregate({
      where: { workspace_id: workspace.id },
      _count: true,
      _avg: { duration_ms: true },
    })

    // Get most used models
    const modelUsage = await prisma.prompt.groupBy({
      by: ['model'],
      where: { workspace_id: workspace.id },
      _count: true,
    })

    // Get most tested prompts
    const testedPrompts = await prisma.testRun.groupBy({
      by: ['prompt_version_id'],
      where: { workspace_id: workspace.id },
      _count: true,
      orderBy: { _count: { prompt_version_id: 'desc' } },
      take: 5,
    })

    // Get activity trend (last 7 days)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const activityTrend = await prisma.syncLog.groupBy({
      by: ['action'],
      where: {
        workspace_id: workspace.id,
        created_at: { gte: sevenDaysAgo },
      },
      _count: true,
    })

    // Get workspace age
    const workspaceAgeDays = Math.floor(
      (Date.now() - workspace.created_at.getTime()) / (1000 * 60 * 60 * 24)
    )

    // Calculate health score (0-100)
    let healthScore = 50
    if (promptCount > 0) healthScore += 10
    if (snippetCount > 0) healthScore += 10
    if (testRunCount > 0) healthScore += 15
    if (versionCount > promptCount) healthScore += 10
    if (syncLogCount > 100) healthScore += 5

    const stats = {
      workspace: {
        id: workspace.id,
        name: workspace.name,
        created_at: workspace.created_at,
        age_days: workspaceAgeDays,
        health_score: Math.min(healthScore, 100),
      },
      resources: {
        prompts: promptCount,
        snippets: snippetCount,
        categories: categoryCount,
        interaction_types: interactionCount,
        prompt_versions: versionCount,
        avg_versions_per_prompt:
          promptCount > 0 ? (versionCount / promptCount).toFixed(2) : 0,
      },
      testing: {
        total_test_runs: testRunCount,
        avg_duration_ms: Math.round(testRunStats._avg.duration_ms || 0),
        prompts_with_tests: testedPrompts.length,
      },
      models: {
        used_models: modelUsage,
        most_used:
          modelUsage.length > 0
            ? modelUsage.reduce((a, b) => (a._count > b._count ? a : b)).model
            : null,
      },
      activity: {
        total_logs: syncLogCount,
        recent_trend: activityTrend,
      },
      recommendations:
        healthScore < 50
          ? [
              'Create more prompts to improve workspace coverage',
              'Run tests on your prompts to validate quality',
            ]
          : healthScore < 80
            ? ['Consider creating reusable snippets for common patterns']
            : ['Your workspace is well-maintained!'],
    }

    return NextResponse.json(stats, { status: 200 })
  } catch (error: any) {
    console.error('Get comprehensive stats error:', error)
    return NextResponse.json(
      { error: 'Server error: ' + error.message },
      { status: 500 }
    )
  }
}
