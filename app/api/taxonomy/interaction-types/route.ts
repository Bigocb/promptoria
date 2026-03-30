/**
 * API Route: /api/taxonomy/interaction-types
 *
 * GET - Fetch all agent interaction types for a workspace
 * POST - Create a new interaction type
 * Parameters:
 *   - workspaceId (optional): Filter by workspace
 */

import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const workspaceId = searchParams.get('workspaceId') || 'workspace_default'

    const types = await prisma.agentInteractionType.findMany({
      where: { workspaceId },
      include: {
        categories: {
          orderBy: { name: 'asc' },
        },
      },
      orderBy: { name: 'asc' },
    })

    return NextResponse.json({ types }, { status: 200 })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch interaction types',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}

interface CreateInteractionTypeRequest {
  name: string
  description?: string
  emoji?: string
  workspaceId?: string
}

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')

    let userId = 'default-user'
    if (token) {
      const payload = verifyToken(token)
      if (payload) {
        userId = payload.userId
      }
    }

    const body: CreateInteractionTypeRequest = await request.json()
    const { name, description, emoji } = body

    if (!name) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      )
    }

    // Get or create workspace for this user
    let workspace = await prisma.workspace.findFirst({
      where: { userId },
    })

    if (!workspace) {
      workspace = await prisma.workspace.create({
        data: {
          name: 'My Workspace',
          slug: `workspace-${userId.substring(0, 8)}`,
          userId: userId,
        },
      })
    }

    // Check for duplicate
    const existing = await prisma.agentInteractionType.findFirst({
      where: { workspaceId: workspace.id, name },
    })

    if (existing) {
      return NextResponse.json(
        { error: `Interaction type "${name}" already exists` },
        { status: 409 }
      )
    }

    const type = await prisma.agentInteractionType.create({
      data: {
        name,
        description,
        emoji,
        workspaceId: workspace.id,
      },
    })

    return NextResponse.json({ type }, { status: 201 })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      {
        error: 'Failed to create interaction type',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}
