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

const prisma = new PrismaClient()

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
  workspaceId?: string
  folderId?: string
}

export async function POST(request: NextRequest) {
  try {
    const body: CreatePromptRequest = await request.json()
    const { name, description, content, variables = [], workspaceId = 'workspace_default', folderId } = body

    // Validation
    if (!name || !content) {
      return NextResponse.json(
        { error: 'Name and content are required' },
        { status: 400 }
      )
    }

    // Ensure workspace exists
    let workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
    })

    if (!workspace) {
      workspace = await prisma.workspace.create({
        data: {
          id: workspaceId,
          name: workspaceId,
          slug: workspaceId.toLowerCase().replace(/_/g, '-'),
          ownerId: 'default-owner',
        },
      })
    }

    // Check for duplicate name in workspace
    const existing = await prisma.prompt.findFirst({
      where: { workspaceId, name },
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
        workspaceId,
        folderId,
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
        createdBy: 'default-user',
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
