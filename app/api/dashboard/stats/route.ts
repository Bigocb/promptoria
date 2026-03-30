import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { verifyToken, extractToken } from '@/lib/auth'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const token = extractToken(request.headers.get('authorization'))

    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user stats
    const [promptCount, snippetCount, workspace] = await Promise.all([
      prisma.prompt.count({
        where: { workspaceId: decoded.userId },
      }),
      prisma.snippet.count({
        where: { workspaceId: decoded.userId },
      }),
      prisma.workspace.findUnique({
        where: { userId: decoded.userId },
      }),
    ])

    // Get recent prompts
    const recentPrompts = await prisma.prompt.findMany({
      where: { workspaceId: decoded.userId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        name: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    // Get recent snippets
    const recentSnippets = await prisma.snippet.findMany({
      where: { workspaceId: decoded.userId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        name: true,
        createdAt: true,
      },
    })

    return NextResponse.json({
      stats: {
        totalPrompts: promptCount,
        totalSnippets: snippetCount,
        workspaceName: workspace?.name || 'My Workspace',
      },
      recent: {
        prompts: recentPrompts,
        snippets: recentSnippets,
      },
    })
  } catch (error) {
    console.error('Dashboard stats error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard stats' },
      { status: 500 }
    )
  }
}
