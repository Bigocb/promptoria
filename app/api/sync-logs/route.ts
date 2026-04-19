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
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 500)
    const offset = parseInt(searchParams.get('offset') || '0')
    const entity_type = searchParams.get('entity_type')
    const action = searchParams.get('action')

    const whereClause: any = { workspace_id: workspace.id }
    if (entity_type) whereClause.entity_type = entity_type
    if (action) whereClause.action = action

    const [logs, total] = await Promise.all([
      prisma.syncLog.findMany({
        where: whereClause,
        orderBy: { changed_at: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.syncLog.count({ where: whereClause }),
    ])

    return NextResponse.json(
      {
        logs,
        pagination: {
          total,
          limit,
          offset,
          pages: Math.ceil(total / limit),
        },
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('Get sync logs error:', error)
    return NextResponse.json(
      { error: 'Server error: ' + error.message },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
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
    const { days_old = 30 } = body

    // Delete logs older than specified days
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - days_old)

    const result = await prisma.syncLog.deleteMany({
      where: {
        workspace_id: workspace.id,
        changed_at: { lt: cutoffDate },
      },
    })

    return NextResponse.json(
      {
        message: 'Sync logs deleted',
        deleted_count: result.count,
        deleted_before: cutoffDate.toISOString(),
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('Delete sync logs error:', error)
    return NextResponse.json(
      { error: 'Server error: ' + error.message },
      { status: 500 }
    )
  }
}
