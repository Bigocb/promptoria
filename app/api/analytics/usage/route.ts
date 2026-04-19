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

    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get('days') || '30')
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    // Get prompts with their test run statistics
    const prompts = await prisma.prompt.findMany({
      where: { workspace_id: workspace.id },
      select: {
        id: true,
        name: true,
        versions: {
          select: {
            id: true,
            version_number: true,
            test_runs: {
              where: { created_at: { gte: startDate } },
              select: {
                id: true,
                status: true,
                duration_ms: true,
                created_at: true,
              },
            },
          },
          take: 1,
          orderBy: { version_number: 'desc' },
        },
      },
    })

    // Process the data
    const promptAnalytics = prompts.map((prompt) => {
      const latestVersion = prompt.versions[0]
      const testRuns = latestVersion?.test_runs || []

      const successfulRuns = testRuns.filter((t) => t.status === 'success').length
      const failedRuns = testRuns.filter((t) => t.status === 'error').length
      const avgDuration =
        testRuns.length > 0
          ? testRuns.reduce((sum, t) => sum + (t.duration_ms || 0), 0) / testRuns.length
          : 0

      return {
        prompt_id: prompt.id,
        prompt_name: prompt.name,
        test_runs_count: testRuns.length,
        successful_runs: successfulRuns,
        failed_runs: failedRuns,
        success_rate:
          testRuns.length > 0 ? ((successfulRuns / testRuns.length) * 100).toFixed(1) : 0,
        average_duration_ms: Math.round(avgDuration),
        last_run_at: testRuns.length > 0 ? testRuns[testRuns.length - 1].created_at : null,
      }
    })

    // Overall statistics
    const allTestRuns = await prisma.testRun.findMany({
      where: {
        workspace_id: workspace.id,
        created_at: { gte: startDate },
      },
      select: { status: true, duration_ms: true },
    })

    const overallStats = {
      total_test_runs: allTestRuns.length,
      successful_runs: allTestRuns.filter((t) => t.status === 'success').length,
      failed_runs: allTestRuns.filter((t) => t.status === 'error').length,
      overall_success_rate:
        allTestRuns.length > 0
          ? (
              (allTestRuns.filter((t) => t.status === 'success').length / allTestRuns.length) *
              100
            ).toFixed(1)
          : 0,
      average_duration_ms:
        allTestRuns.length > 0
          ? Math.round(
              allTestRuns.reduce((sum, t) => sum + (t.duration_ms || 0), 0) / allTestRuns.length
            )
          : 0,
    }

    return NextResponse.json(
      {
        period_days: days,
        overall_stats: overallStats,
        prompt_analytics: promptAnalytics.sort((a, b) => b.test_runs_count - a.test_runs_count),
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('Usage analytics error:', error)
    return NextResponse.json(
      { error: 'Server error: ' + error.message },
      { status: 500 }
    )
  }
}
