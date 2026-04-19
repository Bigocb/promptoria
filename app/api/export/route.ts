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

    // Get query parameter for what to export
    const { searchParams } = new URL(request.url)
    const format = searchParams.get('format') || 'json' // json or csv
    const type = searchParams.get('type') || 'all' // all, prompts, snippets, etc

    // Fetch all relevant data
    const [prompts, snippets, categories, interactionTypes] = await Promise.all([
      type === 'all' || type === 'prompts'
        ? prisma.prompt.findMany({
            where: { workspace_id: workspace.id },
            include: {
              versions: true,
              category: true,
            },
          })
        : [],
      type === 'all' || type === 'snippets'
        ? prisma.snippet.findMany({
            where: { workspace_id: workspace.id },
          })
        : [],
      type === 'all' || type === 'categories'
        ? prisma.promptCategory.findMany({
            where: { workspace_id: workspace.id },
          })
        : [],
      type === 'all' || type === 'interactions'
        ? prisma.agentInteractionType.findMany({
            where: { workspace_id: workspace.id },
            include: { categories: true },
          })
        : [],
    ])

    const exportData = {
      exported_at: new Date().toISOString(),
      workspace: {
        id: workspace.id,
        name: workspace.name,
        slug: workspace.slug,
      },
      data: {
        prompts,
        snippets,
        categories,
        interaction_types: interactionTypes,
      },
    }

    if (format === 'json') {
      return NextResponse.json(exportData, { status: 200 })
    }

    // CSV format - convert to CSV
    let csv = 'Type,ID,Name,Description,Created At\n'

    prompts.forEach((p) => {
      csv += `Prompt,${p.id},"${p.name?.replace(/"/g, '""')}","${p.description?.replace(/"/g, '""') || ''}",${p.created_at}\n`
    })

    snippets.forEach((s) => {
      csv += `Snippet,${s.id},"${s.name?.replace(/"/g, '""')}","${s.description?.replace(/"/g, '""') || ''}",${s.created_at}\n`
    })

    categories.forEach((c) => {
      csv += `Category,${c.id},"${c.name?.replace(/"/g, '""')}","${c.description?.replace(/"/g, '""') || ''}",${c.created_at}\n`
    })

    interactionTypes.forEach((it) => {
      csv += `Interaction,${it.id},"${it.name?.replace(/"/g, '""')}","${it.description?.replace(/"/g, '""') || ''}",${it.created_at}\n`
    })

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="promptoria_export_${workspace.id}_${Date.now()}.csv"`,
      },
    })
  } catch (error: any) {
    console.error('Export error:', error)
    return NextResponse.json(
      { error: 'Server error: ' + error.message },
      { status: 500 }
    )
  }
}
