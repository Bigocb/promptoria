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

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const q = searchParams.get('q') || ''
    const type = searchParams.get('type') || 'all' // all, prompts, snippets, categories

    const query = {
      where: {
        workspace_id: workspace.id,
        name: {
          contains: q,
          mode: 'insensitive' as const,
        },
      },
    }

    const results: any = {}

    if (type === 'all' || type === 'prompts') {
      results.prompts = await prisma.prompt.findMany({
        ...query,
        take: 10,
        orderBy: { updated_at: 'desc' },
        select: {
          id: true,
          name: true,
          description: true,
          created_at: true,
        },
      })
    }

    if (type === 'all' || type === 'snippets') {
      results.snippets = await prisma.snippet.findMany({
        ...query,
        take: 10,
        orderBy: { updated_at: 'desc' },
        select: {
          id: true,
          name: true,
          description: true,
          created_at: true,
        },
      })
    }

    if (type === 'all' || type === 'categories') {
      results.categories = await prisma.promptCategory.findMany({
        ...query,
        take: 10,
        orderBy: { updated_at: 'desc' },
        select: {
          id: true,
          name: true,
          description: true,
          created_at: true,
        },
      })
    }

    return NextResponse.json(
      {
        query: q,
        type,
        results,
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('Search error:', error)
    return NextResponse.json(
      { error: 'Server error: ' + error.message },
      { status: 500 }
    )
  }
}
