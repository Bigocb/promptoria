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
    const {
      delete_old_test_runs_days = 90,
      delete_old_sync_logs_days = 60,
      delete_failed_test_runs = false,
    } = body

    const results = {
      test_runs_deleted: 0,
      sync_logs_deleted: 0,
      failed_runs_deleted: 0,
    }

    // Delete old test runs
    const testRunCutoff = new Date()
    testRunCutoff.setDate(testRunCutoff.getDate() - delete_old_test_runs_days)

    const successfulDeleted = await prisma.testRun.deleteMany({
      where: {
        workspace_id: workspace.id,
        status: 'success',
        completed_at: { lt: testRunCutoff },
      },
    })
    results.test_runs_deleted += successfulDeleted.count

    // Delete failed test runs if requested
    if (delete_failed_test_runs) {
      const failedDeleted = await prisma.testRun.deleteMany({
        where: {
          workspace_id: workspace.id,
          status: 'error',
          completed_at: { lt: testRunCutoff },
        },
      })
      results.failed_runs_deleted = failedDeleted.count
    }

    // Delete old sync logs
    const syncLogCutoff = new Date()
    syncLogCutoff.setDate(syncLogCutoff.getDate() - delete_old_sync_logs_days)

    const logsDeleted = await prisma.syncLog.deleteMany({
      where: {
        workspace_id: workspace.id,
        changed_at: { lt: syncLogCutoff },
      },
    })
    results.sync_logs_deleted = logsDeleted.count

    // Log the cleanup operation
    await prisma.syncLog.create({
      data: {
        workspace_id: workspace.id,
        action: 'maintenance',
        entity_type: 'workspace',
        entity_id: workspace.id,
        data: {
          operation: 'cleanup',
          ...results,
        },
      },
    })

    return NextResponse.json(
      {
        message: 'Cleanup completed',
        results,
        summary: `Deleted ${results.test_runs_deleted} old test runs and ${results.sync_logs_deleted} old logs`,
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('Cleanup error:', error)
    return NextResponse.json(
      { error: 'Server error: ' + error.message },
      { status: 500 }
    )
  }
}
