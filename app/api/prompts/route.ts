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
