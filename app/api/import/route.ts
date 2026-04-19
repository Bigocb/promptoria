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
    const { data } = body

    if (!data || typeof data !== 'object') {
      return NextResponse.json(
        { error: 'Invalid import data format' },
        { status: 400 }
      )
    }

    const results = {
      imported: {
        prompts: 0,
        snippets: 0,
        categories: 0,
        interaction_types: 0,
      },
      errors: [] as string[],
    }

    // Import prompts
    if (Array.isArray(data.prompts)) {
      for (const prompt of data.prompts) {
        try {
          const created = await prisma.prompt.create({
            data: {
              name: prompt.name,
              description: prompt.description,
              workspace_id: workspace.id,
              tags: prompt.tags || null,
              model: prompt.model || 'claude-3-haiku-20240307',
            },
          })

          // Create initial version if template provided
          if (prompt.versions && Array.isArray(prompt.versions) && prompt.versions.length > 0) {
            const version = prompt.versions[0]
            await prisma.promptVersion.create({
              data: {
                prompt_id: created.id,
                version_number: version.version_number || 1,
                template_body: version.template_body,
                model_config: version.model_config || null,
                change_log: version.change_log || 'Imported',
              },
            })
          }

          results.imported.prompts++
        } catch (err: any) {
          results.errors.push(`Failed to import prompt "${prompt.name}": ${err.message}`)
        }
      }
    }

    // Import snippets
    if (Array.isArray(data.snippets)) {
      for (const snippet of data.snippets) {
        try {
          await prisma.snippet.create({
            data: {
              name: snippet.name,
              description: snippet.description,
              content: snippet.content,
              workspace_id: workspace.id,
            },
          })
          results.imported.snippets++
        } catch (err: any) {
          results.errors.push(`Failed to import snippet "${snippet.name}": ${err.message}`)
        }
      }
    }

    // Import interaction types
    if (Array.isArray(data.interaction_types)) {
      for (const it of data.interaction_types) {
        try {
          await prisma.agentInteractionType.create({
            data: {
              name: it.name,
              description: it.description,
              emoji: it.emoji,
              workspace_id: workspace.id,
            },
          })
          results.imported.interaction_types++
        } catch (err: any) {
          results.errors.push(`Failed to import interaction type "${it.name}": ${err.message}`)
        }
      }
    }

    // Import categories (after interaction types)
    if (Array.isArray(data.categories)) {
      for (const cat of data.categories) {
        try {
          const interactionType = await prisma.agentInteractionType.findFirst({
            where: { workspace_id: workspace.id, name: cat.interaction_type?.name },
          })

          if (!interactionType) {
            throw new Error('Referenced interaction type not found')
          }

          await prisma.promptCategory.create({
            data: {
              name: cat.name,
              description: cat.description,
              workspace_id: workspace.id,
              agent_interaction_type_id: interactionType.id,
            },
          })
          results.imported.categories++
        } catch (err: any) {
          results.errors.push(`Failed to import category "${cat.name}": ${err.message}`)
        }
      }
    }

    // Log import action
    await prisma.syncLog.create({
      data: {
        workspace_id: workspace.id,
        action: 'import',
        entity_type: 'workspace_data',
        entity_id: workspace.id,
        data: results.imported,
      },
    })

    return NextResponse.json(results, { status: 200 })
  } catch (error: any) {
    console.error('Import error:', error)
    return NextResponse.json(
      { error: 'Server error: ' + error.message },
      { status: 500 }
    )
  }
}
