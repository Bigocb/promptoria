import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyAccessToken } from '@/lib/jwt'

async function getWorkspaceForUser(userId: string) {
  return prisma.workspace.findFirst({ where: { user_id: userId } })
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Verify prompt exists and belongs to workspace
    const prompt = await prisma.prompt.findUnique({
      where: { id: params.id },
    })

    if (!prompt || prompt.workspace_id !== workspace.id) {
      return NextResponse.json(
        { error: 'Prompt not found or does not belong to your workspace' },
        { status: 404 }
      )
    }

    const { searchParams } = new URL(request.url)
    const v1 = parseInt(searchParams.get('v1') || '') || 1
    const v2 = parseInt(searchParams.get('v2') || '') || 2

    // Get both versions
    const [version1, version2] = await Promise.all([
      prisma.promptVersion.findFirst({
        where: { prompt_id: params.id, version_number: v1 },
      }),
      prisma.promptVersion.findFirst({
        where: { prompt_id: params.id, version_number: v2 },
      }),
    ])

    if (!version1 || !version2) {
      return NextResponse.json(
        { error: 'One or both versions not found' },
        { status: 404 }
      )
    }

    // Calculate differences
    const template1Lines = version1.template_body.split('\n')
    const template2Lines = version2.template_body.split('\n')

    const differences = {
      template_changed:
        version1.template_body !== version2.template_body,
      model_config_changed:
        JSON.stringify(version1.model_config) !==
        JSON.stringify(version2.model_config),
      lines_added: template2Lines.length - template1Lines.length,
      lines_removed: template1Lines.length - template2Lines.length,
      characters_added:
        version2.template_body.length - version1.template_body.length,
    }

    return NextResponse.json(
      {
        prompt_id: params.id,
        comparison: {
          version_1: {
            number: v1,
            created_at: version1.created_at,
            change_log: version1.change_log,
            lines: template1Lines.length,
            characters: version1.template_body.length,
          },
          version_2: {
            number: v2,
            created_at: version2.created_at,
            change_log: version2.change_log,
            lines: template2Lines.length,
            characters: version2.template_body.length,
          },
        },
        differences,
        template_preview_1: version1.template_body.substring(0, 300),
        template_preview_2: version2.template_body.substring(0, 300),
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('Compare versions error:', error)
    return NextResponse.json(
      { error: 'Server error: ' + error.message },
      { status: 500 }
    )
  }
}
