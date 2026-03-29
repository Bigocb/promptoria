/**
 * API Route: /api/testruns
 * 
 * GET - Fetch test runs with filtering
 * Parameters:
 *   - promptVersionId (optional): Filter by prompt version
 *   - promptId (optional): Filter by prompt
 *   - status (optional): Filter by status (success, error, pending)
 *   - limit (optional): Number of results (default: 20)
 */

import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const promptVersionId = searchParams.get('promptVersionId')
    const promptId = searchParams.get('promptId')
    const status = searchParams.get('status')
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100)

    // Build where clause
    const where: any = {}
    if (promptVersionId) where.promptVersionId = promptVersionId
    if (promptId) where.promptId = promptId
    if (status) where.status = status

    const testRuns = await prisma.testRun.findMany({
      where,
      include: {
        prompt: true,
        promptVersion: true,
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })

    // Calculate statistics
    const stats = {
      total: testRuns.length,
      successful: testRuns.filter((t) => t.status === 'success').length,
      failed: testRuns.filter((t) => t.status === 'error').length,
      avgCost: testRuns
        .filter((t) => t.costUsd)
        .reduce((sum, t) => sum + (t.costUsd || 0), 0) / (testRuns.length || 1),
      avgLatency: testRuns
        .filter((t) => t.latencyMs)
        .reduce((sum, t) => sum + (t.latencyMs || 0), 0) / (testRuns.length || 1),
    }

    return NextResponse.json({ testRuns, stats }, { status: 200 })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch test runs',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}
