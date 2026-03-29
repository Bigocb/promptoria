/**
 * API Route: /api/snippets
 * 
 * GET - Fetch all snippets or a specific snippet
 * POST - Create a new snippet
 * Parameters:
 *   - workspaceId (optional): Filter by workspace
 *   - snippetId (optional): Get specific snippet
 */

import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { validateBraces } from '@/lib/compiler'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const snippetId = searchParams.get('snippetId')
    const workspaceId = searchParams.get('workspaceId') || 'workspace_default'

    if (snippetId) {
      const snippet = await prisma.snippet.findUnique({
        where: { id: snippetId },
        include: {
          promptCompositions: {
            include: {
              promptVersion: true,
            },
          },
        },
      })

      if (!snippet) {
        return NextResponse.json(
          { error: 'Snippet not found' },
          { status: 404 }
        )
      }

      return NextResponse.json({ snippet }, { status: 200 })
    }

    // Get all snippets in workspace
    const snippets = await prisma.snippet.findMany({
      where: { workspaceId },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ snippets }, { status: 200 })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch snippets',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}

interface CreateSnippetRequest {
  name: string
  description?: string
  content: string
  workspaceId?: string
  folderId?: string
}

export async function POST(request: NextRequest) {
  try {
    const body: CreateSnippetRequest = await request.json()
    const { name, description, content, workspaceId = 'workspace_default', folderId } = body

    // Validation
    if (!name || !content) {
      return NextResponse.json(
        { error: 'Name and content are required' },
        { status: 400 }
      )
    }

    // Check for unclosed braces
    if (!validateBraces(content)) {
      return NextResponse.json(
        { error: 'Content contains unclosed or malformed curly braces' },
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
    const existing = await prisma.snippet.findFirst({
      where: { workspaceId, name },
    })

    if (existing) {
      return NextResponse.json(
        { error: `Snippet with name "${name}" already exists in this workspace` },
        { status: 409 }
      )
    }

    // Create snippet
    const snippet = await prisma.snippet.create({
      data: {
        name,
        description,
        content,
        workspaceId,
        folderId,
        version: 1,
      },
    })

    return NextResponse.json({ snippet }, { status: 201 })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      {
        error: 'Failed to create snippet',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}
