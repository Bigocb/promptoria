import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyAccessToken } from '@/lib/jwt'

export async function GET(request: NextRequest) {
  try {
    // Extract and verify JWT token from Authorization header
    const authHeader = request.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized - missing or invalid token' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)  // Remove 'Bearer ' prefix
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

    // Get lastSync parameter from query string
    const lastSyncParam = request.nextUrl.searchParams.get('lastSync')
    if (!lastSyncParam) {
      return NextResponse.json(
        { error: 'Missing lastSync parameter' },
        { status: 400 }
      )
    }

    let lastSyncTime: Date
    try {
      lastSyncTime = new Date(lastSyncParam)
      if (isNaN(lastSyncTime.getTime())) {
        return NextResponse.json(
          { error: 'Invalid lastSync timestamp format' },
          { status: 400 }
        )
      }
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid lastSync parameter' },
        { status: 400 }
      )
    }

    // Get user's workspace to filter changes
    const userWorkspace = await prisma.workspace.findFirst({
      where: { user_id: userId },
    })

    if (!userWorkspace) {
      return NextResponse.json(
        { error: 'User workspace not found' },
        { status: 404 }
      )
    }

    // Query changes from SyncLog since lastSync
    // Order by changed_at, limit to 100 per request
    const changes = await prisma.syncLog.findMany({
      where: {
        workspace_id: userWorkspace.id,
        changed_at: {
          gt: lastSyncTime,
        },
      },
      orderBy: {
        changed_at: 'asc',
      },
      take: 100,  // Pagination: max 100 changes per request
    })

    // Build response
    const now = new Date()
    return NextResponse.json(
      {
        synced_at: now.toISOString(),
        changes: changes.map(change => ({
          action: change.action,  // "create", "update", "delete"
          entity_type: change.entity_type,  // "prompt", "snippet", etc.
          entity_id: change.entity_id,
          data: change.data,  // Snapshot of changes
        })),
        conflicts: [],  // Future: detect conflicts here
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('Sync error:', error)
    return NextResponse.json(
      { error: 'Server error: ' + error.message },
      { status: 500 }
    )
  }
}
