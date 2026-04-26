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

    const totalUsers = await prisma.user.count()
    const totalPrompts = await prisma.prompt.count()
    const totalSnippets = await prisma.snippet.count()
    const totalTestRuns = await prisma.testRun.count()
    const totalVersions = await prisma.promptVersion.count()

    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const recentSignups = await prisma.user.findMany({
      orderBy: { created_at: 'desc' },
      take: 50,
      select: {
        id: true,
        email: true,
        created_at: true,
        workspaces: {
          select: {
            id: true,
            _count: { select: { prompts: true, snippets: true } },
          },
        },
      },
    })

    const modelsUsed = await prisma.prompt.groupBy({
      by: ['model'],
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
    })

    const modelPreferences = await prisma.userSettings.findMany({
      select: { default_model: true },
    })
    const modelPrefCounts: Record<string, number> = {}
    for (const s of modelPreferences) {
      const m = s.default_model || 'qwen3.5:2b'
      modelPrefCounts[m] = (modelPrefCounts[m] || 0) + 1
    }

    const testStatusCounts = await prisma.testRun.groupBy({
      by: ['status'],
      _count: { id: true },
    })

    const signupsByDay = await prisma.user.findMany({
      where: { created_at: { gte: thirtyDaysAgo } },
      select: { created_at: true },
      orderBy: { created_at: 'asc' },
    })

    const signupBuckets: Record<string, number> = {}
    for (const u of signupsByDay) {
      const day = u.created_at.toISOString().split('T')[0]
      signupBuckets[day] = (signupBuckets[day] || 0) + 1
    }

    const promptsCreated = await prisma.prompt.findMany({
      where: { created_at: { gte: thirtyDaysAgo } },
      select: { created_at: true },
      orderBy: { created_at: 'asc' },
    })
    const promptBuckets: Record<string, number> = {}
    for (const p of promptsCreated) {
      const day = p.created_at.toISOString().split('T')[0]
      promptBuckets[day] = (promptBuckets[day] || 0) + 1
    }

    return NextResponse.json({
      totals: {
        users: totalUsers,
        prompts: totalPrompts,
        snippets: totalSnippets,
        testRuns: totalTestRuns,
        versions: totalVersions,
      },
      recentSignups: recentSignups.map(u => ({
        id: u.id,
        email: u.email,
        joinedAt: u.created_at.toISOString(),
        promptCount: u.workspaces?._count?.prompts ?? 0,
        snippetCount: u.workspaces?._count?.snippets ?? 0,
      })),
      modelsUsed: modelsUsed.map(m => ({
        model: m.model,
        count: m._count.id,
      })),
      modelPreferences: Object.entries(modelPrefCounts).map(([model, count]) => ({
        model,
        count,
      })),
      testStatusCounts: testStatusCounts.map(s => ({
        status: s.status,
        count: s._count.id,
      })),
      signupsByDay: Object.entries(signupBuckets).map(([date, count]) => ({ date, count })),
      promptsByDay: Object.entries(promptBuckets).map(([date, count]) => ({ date, count })),
    })
  } catch (error: any) {
    console.error('Admin stats error:', error)
    return NextResponse.json({ error: 'Server error: ' + error.message }, { status: 500 })
  }
}