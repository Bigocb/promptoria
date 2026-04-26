import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyAccessToken } from '@/lib/jwt'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
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
    } catch {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const promptId = params.id

    const workspace = await prisma.workspace.findFirst({
      where: { user_id: userId },
      select: { id: true },
    })
    if (!workspace) return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })

    const testRuns = await prisma.testRun.findMany({
      where: {
        workspace_id: workspace.id,
        prompt_id: promptId,
        status: 'success',
      },
      orderBy: { created_at: 'desc' },
      take: 50,
      include: {
        prompt_version: {
          select: {
            id: true,
            version_number: true,
            template_body: true,
          },
        },
      },
    })

    return NextResponse.json(
      {
        test_runs: testRuns.map((tr) => ({
          id: tr.id,
          prompt_version_id: tr.prompt_version_id,
          version_number: tr.prompt_version.version_number,
          model: tr.model,
          temperature: tr.temperature,
          max_tokens: tr.max_tokens,
          test_case_input: tr.test_case_input,
          output: tr.output,
          total_tokens: tr.total_tokens,
          duration_ms: tr.duration_ms,
          completed_at: tr.completed_at,
          created_at: tr.created_at,
        })),
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('Get test history error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
