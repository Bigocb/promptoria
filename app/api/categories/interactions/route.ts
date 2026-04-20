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
    const { name, description, emoji } = body

    if (!name) {
      return NextResponse.json({ error: 'name is required' }, { status: 400 })
    }

    const interaction = await prisma.agentInteractionType.create({
      data: {
        name,
        description: description || null,
        emoji: emoji || null,
        workspace_id: workspace.id,
      },
    })

    await prisma.syncLog.create({
      data: {
        workspace_id: workspace.id,
        action: 'create',
        entity_type: 'interaction_type',
        entity_id: interaction.id,
        data: { name },
      },
    })

    return NextResponse.json(interaction, { status: 201 })
  } catch (error: any) {
    console.error('Create interaction error:', error)
    return NextResponse.json(
      { error: 'Server error: ' + error.message },
      { status: 500 }
    )
  }
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

    const interactions = await prisma.agentInteractionType.findMany({
      where: { workspace_id: workspace.id },
      include: {
        categories: {
          include: {
            prompts: {
              select: {
                id: true,
                name: true,
                description: true,
              },
              orderBy: { updated_at: 'desc' },
            }
          },
          orderBy: { updated_at: 'desc' },
        }
      },
      orderBy: { updated_at: 'desc' },
    })

    // Fetch uncategorized prompts separately and add as a special category
    const uncategorizedPrompts = await prisma.prompt.findMany({
      where: {
        workspace_id: workspace.id,
        category_id: null,
      },
      select: {
        id: true,
        name: true,
        description: true,
      },
      orderBy: { updated_at: 'desc' },
    })

    // If there are uncategorized prompts, prepend an "Uncategorized" interaction type
    if (uncategorizedPrompts.length > 0) {
      const uncategorizedType = {
        id: 'uncategorized-type',
        name: '📋 Uncategorized',
        description: 'Prompts without a category',
        emoji: '📋',
        workspace_id: workspace.id,
        created_at: new Date(),
        updated_at: new Date(),
        categories: [
          {
            id: 'uncategorized-category',
            name: 'All Uncategorized',
            description: 'Prompts that need to be organized',
            workspace_id: workspace.id,
            agent_interaction_type_id: 'uncategorized-type',
            created_at: new Date(),
            updated_at: new Date(),
            prompts: uncategorizedPrompts,
          }
        ]
      }
      interactions.unshift(uncategorizedType as any)
    }

    return NextResponse.json({ interactions }, { status: 200 })
  } catch (error: any) {
    console.error('List interactions error:', error)
    return NextResponse.json(
      { error: 'Server error: ' + error.message },
      { status: 500 }
    )
  }
}
