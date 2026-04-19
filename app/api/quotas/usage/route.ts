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
    const period = searchParams.get('period') || 'month' // day, week, month

    // Calculate period start date
    const now = new Date()
    let startDate = new Date(now)

    if (period === 'day') {
      startDate.setHours(0, 0, 0, 0)
    } else if (period === 'week') {
      startDate.setDate(startDate.getDate() - 7)
    } else {
      // month
      startDate.setDate(1)
    }

    // Get test run count and token usage estimate
    const testRuns = await prisma.testRun.findMany({
      where: {
        workspace_id: workspace.id,
        created_at: { gte: startDate },
      },
      select: {
        status: true,
        duration_ms: true,
        prompt_version: {
          select: {
            template_body: true,
          },
        },
      },
    })

    // Estimate token usage (rough: ~4 chars per token)
    let estimatedInputTokens = 0
    let estimatedOutputTokens = 0

    testRuns.forEach((run) => {
      const inputChars = (run.prompt_version?.template_body || '').length
      estimatedInputTokens += Math.ceil(inputChars / 4)
      // Assume ~500 output tokens per run on average
      if (run.status === 'success') {
        estimatedOutputTokens += 500
      }
    })

    const totalDurationHours = testRuns.reduce((sum, run) => sum + (run.duration_ms || 0), 0) / (1000 * 60 * 60)

    // Define quotas (these would come from a subscription tier in production)
    const quotas = {
      period,
      start_date: startDate.toISOString(),
      end_date: now.toISOString(),
      limits: {
        api_calls_per_day: 1000,
        test_runs_per_day: 100,
        storage_gb: 10,
        models_allowed: 'all',
      },
      usage: {
        api_calls: testRuns.length,
        test_runs_successful: testRuns.filter((r) => r.status === 'success').length,
        test_runs_failed: testRuns.filter((r) => r.status === 'error').length,
        estimated_input_tokens: estimatedInputTokens,
        estimated_output_tokens: estimatedOutputTokens,
        total_duration_hours: Math.round(totalDurationHours * 100) / 100,
      },
      health: {
        api_calls_remaining:
          1000 - testRuns.length > 0 ? 1000 - testRuns.length : 0,
        test_runs_remaining:
          100 - testRuns.filter((r) => r.status === 'success').length > 0
            ? 100 - testRuns.filter((r) => r.status === 'success').length
            : 0,
        usage_percentage: Math.round((testRuns.length / 1000) * 100),
      },
      recommendations:
        testRuns.length > 800
          ? ['You are approaching your API call limit. Consider upgrading your plan.']
          : [],
    }

    return NextResponse.json(quotas, { status: 200 })
  } catch (error: any) {
    console.error('Get usage quotas error:', error)
    return NextResponse.json(
      { error: 'Server error: ' + error.message },
      { status: 500 }
    )
  }
}
