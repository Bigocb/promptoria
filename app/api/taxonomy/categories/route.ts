/**
 * API Route: /api/taxonomy/categories
 *
 * GET - Fetch all prompt categories for a workspace
 * POST - Create a new category
 * Parameters:
 *   - workspaceId (optional): Filter by workspace
 *   - typeId (optional): Filter by interaction type
 */

import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const workspaceId = searchParams.get('workspaceId') || 'workspace_default'
    const typeId = searchParams.get('typeId')

    const categories = await prisma.promptCategory.findMany({
      where: {
        workspaceId,
        ...(typeId && { agentInteractionTypeId: typeId }),
      },
      include: {
        agentInteractionType: true,
        prompts: {
          orderBy: { name: 'asc' },
        },
      },
      orderBy: { name: 'asc' },
    })

    return NextResponse.json({ categories }, { status: 200 })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch categories',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}

interface CreateCategoryRequest {
  name: string
  description?: string
  agentInteractionTypeId: string
  workspaceId?: string
}

export async function POST(request: NextRequest) {
  try {
    const body: CreateCategoryRequest = await request.json()
    const { name, description, agentInteractionTypeId, workspaceId = 'workspace_default' } = body

    if (!name || !agentInteractionTypeId) {
      return NextResponse.json(
        { error: 'Name and interaction type ID are required' },
        { status: 400 }
      )
    }

    // Verify interaction type exists
    const interactionType = await prisma.agentInteractionType.findUnique({
      where: { id: agentInteractionTypeId },
    })

    if (!interactionType) {
      return NextResponse.json(
        { error: 'Interaction type not found' },
        { status: 404 }
      )
    }

    // Check for duplicate
    const existing = await prisma.promptCategory.findFirst({
      where: { workspaceId, name },
    })

    if (existing) {
      return NextResponse.json(
        { error: `Category "${name}" already exists` },
        { status: 409 }
      )
    }

    const category = await prisma.promptCategory.create({
      data: {
        name,
        description,
        agentInteractionTypeId,
        workspaceId,
      },
      include: {
        agentInteractionType: true,
      },
    })

    return NextResponse.json({ category }, { status: 201 })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      {
        error: 'Failed to create category',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}
