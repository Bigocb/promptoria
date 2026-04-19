import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyAccessToken } from '@/lib/jwt'

async function getWorkspaceForUser(userId: string) {
  return prisma.workspace.findFirst({ where: { user_id: userId } })
}

interface BatchOperation {
  id: string
  action: 'delete' | 'update'
  entity_type: 'prompt' | 'snippet' | 'category' | 'interaction'
  entity_id: string
  data?: Record<string, any>
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
    const { operations } = body

    if (!Array.isArray(operations)) {
      return NextResponse.json(
        { error: 'Operations must be an array' },
        { status: 400 }
      )
    }

    const results = {
      total: operations.length,
      successful: 0,
      failed: 0,
      operations: [] as any[],
    }

    for (const op of operations as BatchOperation[]) {
      const result = {
        id: op.id,
        action: op.action,
        entity_type: op.entity_type,
        status: 'pending' as string,
        error: null as string | null,
      }

      try {
        // Verify ownership first
        let ownedByWorkspace = false

        if (op.entity_type === 'prompt') {
          const prompt = await prisma.prompt.findFirst({
            where: { id: op.entity_id, workspace_id: workspace.id },
          })
          ownedByWorkspace = !!prompt
        } else if (op.entity_type === 'snippet') {
          const snippet = await prisma.snippet.findFirst({
            where: { id: op.entity_id, workspace_id: workspace.id },
          })
          ownedByWorkspace = !!snippet
        } else if (op.entity_type === 'category') {
          const category = await prisma.promptCategory.findFirst({
            where: { id: op.entity_id, workspace_id: workspace.id },
          })
          ownedByWorkspace = !!category
        } else if (op.entity_type === 'interaction') {
          const interaction = await prisma.agentInteractionType.findFirst({
            where: { id: op.entity_id, workspace_id: workspace.id },
          })
          ownedByWorkspace = !!interaction
        }

        if (!ownedByWorkspace) {
          throw new Error('Unauthorized - resource not found or does not belong to workspace')
        }

        if (op.action === 'delete') {
          // Delete operations
          if (op.entity_type === 'prompt') {
            await prisma.prompt.delete({ where: { id: op.entity_id } })
          } else if (op.entity_type === 'snippet') {
            await prisma.snippet.delete({ where: { id: op.entity_id } })
          } else if (op.entity_type === 'category') {
            await prisma.promptCategory.delete({ where: { id: op.entity_id } })
          } else if (op.entity_type === 'interaction') {
            await prisma.agentInteractionType.delete({ where: { id: op.entity_id } })
          }

          // Log delete
          await prisma.syncLog.create({
            data: {
              workspace_id: workspace.id,
              action: 'delete',
              entity_type: op.entity_type,
              entity_id: op.entity_id,
              data: { batch_operation: true },
            },
          })

          result.status = 'success'
          results.successful++
        } else if (op.action === 'update') {
          // Update operations
          if (op.entity_type === 'prompt' && op.data) {
            await prisma.prompt.update({
              where: { id: op.entity_id },
              data: {
                name: op.data.name,
                description: op.data.description,
                model: op.data.model,
              },
            })
          } else if (op.entity_type === 'snippet' && op.data) {
            await prisma.snippet.update({
              where: { id: op.entity_id },
              data: {
                name: op.data.name,
                description: op.data.description,
                content: op.data.content,
              },
            })
          } else if (op.entity_type === 'category' && op.data) {
            await prisma.promptCategory.update({
              where: { id: op.entity_id },
              data: {
                name: op.data.name,
                description: op.data.description,
              },
            })
          } else if (op.entity_type === 'interaction' && op.data) {
            await prisma.agentInteractionType.update({
              where: { id: op.entity_id },
              data: {
                name: op.data.name,
                description: op.data.description,
                emoji: op.data.emoji,
              },
            })
          }

          // Log update
          await prisma.syncLog.create({
            data: {
              workspace_id: workspace.id,
              action: 'update',
              entity_type: op.entity_type,
              entity_id: op.entity_id,
              data: { batch_operation: true, ...op.data },
            },
          })

          result.status = 'success'
          results.successful++
        }
      } catch (err: any) {
        result.status = 'failed'
        result.error = err.message
        results.failed++
      }

      results.operations.push(result)
    }

    return NextResponse.json(results, { status: 200 })
  } catch (error: any) {
    console.error('Batch operations error:', error)
    return NextResponse.json(
      { error: 'Server error: ' + error.message },
      { status: 500 }
    )
  }
}
