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
    const limit = Math.min(parseInt(searchParams.get('limit') || '100'), 500)
    const offset = parseInt(searchParams.get('offset') || '0')
    const action = searchParams.get('action')
    const entity_type = searchParams.get('entity_type')
    const days = parseInt(searchParams.get('days') || '30')

    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const whereClause: any = {
      workspace_id: workspace.id,
      created_at: { gte: startDate },
    }

    if (action) whereClause.action = action
    if (entity_type) whereClause.entity_type = entity_type

    const [logs, total] = await Promise.all([
      prisma.syncLog.findMany({
        where: whereClause,
        orderBy: { created_at: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.syncLog.count({ where: whereClause }),
    ])

    // Group by action and entity_type for summary
    const summary = await prisma.syncLog.groupBy({
      by: ['action', 'entity_type'],
      where: whereClause,
      _count: true,
    })

    const activityMap = new Map<string, Record<string, number>>()
    summary.forEach((group: any) => {
      const key = group.action
      if (!activityMap.has(key)) {
        activityMap.set(key, {})
      }
      activityMap.get(key)![group.entity_type] = group._count
    })

    const activitySummary = Array.from(activityMap.entries()).map(([action, types]) => ({
      action,
      types,
      total: Object.values(types).reduce((a: number, b: number) => a + b, 0),
    }))

    return NextResponse.json(
      {
        summary: activitySummary,
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
    console.error('Get activity error:', error)
    return NextResponse.json(
      { error: 'Server error: ' + error.message },
      { status: 500 }
    )
  }
}
