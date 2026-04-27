import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyAccessToken } from '@/lib/jwt'
import { isAdmin } from '@/lib/is-admin'

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    let decoded: { userId: string; email: string; tier?: string }
    try {
      decoded = verifyAccessToken(token)
    } catch {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userIsAdmin = await isAdmin(decoded.userId)
    if (!userIsAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const url = new URL(request.url)
    const search = url.searchParams.get('search') || ''
    const tierFilter = url.searchParams.get('tier') || ''

    const where: Record<string, unknown> = {}
    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
      ]
    }
    if (tierFilter) {
      where.subscription_tier = tierFilter
    }

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        name: true,
        subscription_tier: true,
        daily_tokens_used: true,
        daily_tokens_limit: true,
        created_at: true,
      },
      orderBy: { created_at: 'desc' },
    })

    const userSettings = await prisma.userSettings.findMany({
      where: { user_id: { in: users.map(u => u.id) } },
      select: { user_id: true, default_model: true },
    })
    const settingsMap = new Map(userSettings.map(s => [s.user_id, s.default_model]))

    const promptCounts = await prisma.prompt.groupBy({ by: ['workspace_id'], _count: true })
    const workspaceIds = await prisma.workspace.findMany({
      where: { user_id: { in: users.map(u => u.id) } },
      select: { id: true, user_id: true },
    })
    const wsToUser = new Map(workspaceIds.map(w => [w.id, w.user_id]))
    const promptCountByUser = new Map<string, number>()
    for (const p of promptCounts) {
      const uid = wsToUser.get(p.workspace_id)
      if (uid) promptCountByUser.set(uid, (promptCountByUser.get(uid) || 0) + p._count)
    }

    const result = users.map(u => ({
      id: u.id,
      email: u.email,
      name: u.name,
      tier: u.subscription_tier,
      daily_tokens_used: u.daily_tokens_used,
      daily_tokens_limit: u.daily_tokens_limit,
      default_model: settingsMap.get(u.id) || null,
      prompt_count: promptCountByUser.get(u.id) || 0,
      created_at: u.created_at.toISOString(),
    }))

    return NextResponse.json({ users: result })
  } catch (error) {
    console.error('[Admin Users] Error:', error)
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
  }
}