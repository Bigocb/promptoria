import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyAccessToken } from '@/lib/jwt'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
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
    } catch {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const workspace = await prisma.workspace.findFirst({
      where: { user_id: userId },
      select: { id: true },
    })
    if (!workspace) return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })

    const { searchParams } = new URL(request.url)
    const format = searchParams.get('format') || 'json'

    const promptId = params.id

    const prompt = await prisma.prompt.findFirst({
      where: { id: promptId, workspace_id: workspace.id },
      include: {
        versions: { orderBy: { created_at: 'desc' } },
        category: true,
      },
    })

    if (!prompt) return NextResponse.json({ error: 'Prompt not found' }, { status: 404 })

    const latestVersion = prompt.versions[0]

    if (format === 'markdown') {
      const tags = Array.isArray(prompt.tags) ? (prompt.tags as string[]).join(', ') : ''
      const md = `# ${prompt.name}

${prompt.description || ''}

## Metadata

| Field | Value |
|-------|-------|
| **Model** | ${prompt.model || 'default'} |
| **Category** | ${prompt.category?.name || '—'} |
| **Tags** | ${tags || '—'} |
| **Created** | ${prompt.created_at.toISOString()} |
| **Versions** | ${prompt.versions.length} |

## Prompt Template

\`\`\`
${latestVersion?.template_body || ''}
\`\`\`

## Variables

${(latestVersion?.template_body || '').match(/\{([^}]+)\}/g)
  ? [...new Set((latestVersion?.template_body || '').match(/\{([^}]+)\}/g)!)].map(v => `- \`${v}\``).join('\n')
  : '_No variables detected._'}

## Version History

| Version | Created |
|---------|---------|
${prompt.versions.map(v => `| v${v.version_number} | ${v.created_at.toISOString()} |`).join('\n')}

---
*Exported from Promptoria*
`
      return new NextResponse(md, {
        status: 200,
        headers: {
          'Content-Type': 'text/markdown; charset=utf-8',
          'Content-Disposition': `attachment; filename="${prompt.name.replace(/[^a-z0-9_-]/gi, '_').toLowerCase()}.md"`,
          'Cache-Control': 'no-store',
        },
      })
    }

    // JSON format
    const payload = {
      name: prompt.name,
      description: prompt.description,
      model: prompt.model,
      tags: prompt.tags,
      category: prompt.category?.name || null,
      created_at: prompt.created_at,
      versions: prompt.versions.map((v) => ({
        version_number: v.version_number,
        template_body: v.template_body,
        model_config: v.model_config,
        change_log: v.change_log,
        created_at: v.created_at,
      })),
      variables: [...new Set((latestVersion?.template_body || '').match(/\{([^}]+)\}/g) || [])].map((v) => v.slice(1, -1)),
    }

    return new NextResponse(JSON.stringify(payload, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${prompt.name.replace(/[^a-z0-9_-]/gi, '_').toLowerCase()}.json"`,
        'Cache-Control': 'no-store',
      },
    })
  } catch (error: any) {
    console.error('Export prompt error:', error)
    return NextResponse.json({ error: 'Server error: ' + error.message }, { status: 500 })
  }
}
