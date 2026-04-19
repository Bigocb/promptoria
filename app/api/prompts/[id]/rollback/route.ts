import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyAccessToken } from '@/lib/jwt'

async function getWorkspaceForUser(userId: string) {
  return prisma.workspace.findFirst({ where: { user_id: userId } })
}

export async function POST(
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

    const body = await request.json()
    const { target_version_number } = body

    if (!target_version_number) {
      return NextResponse.json(
        { error: 'target_version_number is required' },
        { status: 400 }
      )
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

    // Get the target version
    const targetVersion = await prisma.promptVersion.findFirst({
      where: {
        prompt_id: params.id,
        version_number: target_version_number,
      },
    })

    if (!targetVersion) {
      return NextResponse.json(
        { error: 'Target version not found' },
        { status: 404 }
      )
    }

    // Get the current highest version number
    const latestVersion = await prisma.promptVersion.findFirst({
      where: { prompt_id: params.id },
      orderBy: { version_number: 'desc' },
    })

    if (!latestVersion) {
      return NextResponse.json(
        { error: 'No versions found for prompt' },
        { status: 404 }
      )
    }

    // Create a new version based on the target version
    const newVersion = await prisma.promptVersion.create({
      data: {
        prompt_id: params.id,
        version_number: latestVersion.version_number + 1,
        template_body: targetVersion.template_body,
        model_config: targetVersion.model_config,
        change_log: `Rolled back to version ${target_version_number}`,
        created_by: userId,
      },
    })

    // Log the rollback
    await prisma.syncLog.create({
      data: {
        workspace_id: workspace.id,
        action: 'rollback',
        entity_type: 'prompt_version',
        entity_id: newVersion.id,
        data: {
          from_version: latestVersion.version_number,
          to_version: target_version_number,
        },
      },
    })

    return NextResponse.json(
      {
        message: `Rolled back to version ${target_version_number}`,
        new_version: newVersion,
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('Rollback version error:', error)
    return NextResponse.json(
      { error: 'Server error: ' + error.message },
      { status: 500 }
    )
  }
}
