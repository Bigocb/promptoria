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
    const { snippet_ids } = body

    if (!Array.isArray(snippet_ids) || snippet_ids.length < 2) {
      return NextResponse.json(
        { error: 'At least 2 snippet_ids are required for comparison' },
        { status: 400 }
      )
    }

    // Fetch snippets
    const snippets = await prisma.snippet.findMany({
      where: {
        id: { in: snippet_ids },
        workspace_id: workspace.id,
      },
    })

    if (snippets.length < 2) {
      return NextResponse.json(
        { error: 'Could not find all requested snippets' },
        { status: 404 }
      )
    }

    // Simple diff calculation - count differences
    const comparison = snippets.map((snippet) => ({
      id: snippet.id,
      name: snippet.name,
      length: snippet.content.length,
      lines: snippet.content.split('\n').length,
      preview: snippet.content.substring(0, 200),
    }))

    // Highlight differences
    let differences = 0
    for (let i = 0; i < snippets.length - 1; i++) {
      if (snippets[i].content !== snippets[i + 1].content) {
        differences++
      }
    }

    return NextResponse.json(
      {
        snippets: comparison,
        total_snippets: snippets.length,
        differences_found: differences > 0,
        similarity_percentage:
          differences === 0 ? 100 : Math.max(0, 100 - differences * 20),
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('Compare snippets error:', error)
    return NextResponse.json(
      { error: 'Server error: ' + error.message },
      { status: 500 }
    )
  }
}
