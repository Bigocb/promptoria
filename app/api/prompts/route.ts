/**
 * API Route: /api/prompts
 * 
 * GET - Fetch all prompts or a specific prompt with versions
 * Parameters:
 *   - promptId (optional): If provided, returns that prompt with all versions
 *   - workspaceId (optional): Filter by workspace
 */

import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const promptId = searchParams.get('promptId')
    const workspaceId = searchParams.get('workspaceId') || 'workspace_default'

    if (promptId) {
      // Get specific prompt with all versions
      const prompt = await prisma.prompt.findUnique({
        where: { id: promptId },
        include: {
          versions: {
            include: {
              snippets: {
                include: {
                  snippet: true,
                },
                orderBy: { rank: 'asc' },
              },
            },
            orderBy: { versionNumber: 'desc' },
          },
          testRuns: {
            orderBy: { createdAt: 'desc' },
            take: 5,
          },
        },
      })

      if (!prompt) {
        return NextResponse.json(
          { error: 'Prompt not found' },
          { status: 404 }
        )
      }

      return NextResponse.json({ prompt }, { status: 200 })
    }

    // Get all prompts in workspace
    const prompts = await prisma.prompt.findMany({
      where: { workspaceId },
      include: {
        versions: {
          where: { isActive: true },
          take: 1,
        },
        testRuns: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ prompts }, { status: 200 })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch prompts',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}

interface CreatePromptRequest {
  name: string
  description?: string
  content: string
  variables?: string[]
  tags?: string[]
  workspaceId?: string
  folderId?: string
  categoryId?: string
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

    const body: CreatePromptRequest = await request.json()
    const { name, description, content, variables = [], tags = [], workspaceId, folderId, categoryId } = body

    // Validation
    if (!name || !content) {
      return NextResponse.json(
        { error: 'Name and content are required' },
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

    // Verify category exists if provided
    if (categoryId) {
      const category = await prisma.promptCategory.findUnique({
        where: { id: categoryId },
      })

      if (!category) {
        return NextResponse.json(
          { error: 'Category not found' },
          { status: 404 }
        )
      }
    }

    // Check for duplicate name in workspace
    const existing = await prisma.prompt.findFirst({
      where: { workspaceId: workspace.id, name },
    })

    if (existing) {
      return NextResponse.json(
        { error: `Prompt with name "${name}" already exists in this workspace` },
        { status: 409 }
      )
    }

    // Create prompt
    const prompt = await prisma.prompt.create({
      data: {
        name,
        description,
        workspaceId: workspace.id,
        folderId,
        categoryId,
        tags,
      },
    })

    // Create first version
    const version = await prisma.promptVersion.create({
      data: {
        promptId: prompt.id,
        versionNumber: 1,
        template_body: content,
        model_config: { temperature: 0.7, maxTokens: 500 },
        changeLog: 'Initial version',
        createdBy: userId,
        isActive: true,
      },
    })

    return NextResponse.json({ prompt, version }, { status: 201 })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      {
        error: 'Failed to create prompt',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}
