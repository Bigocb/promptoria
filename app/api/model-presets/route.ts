import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyAccessToken } from '@/lib/jwt'

async function getWorkspaceForUser(userId: string) {
  return prisma.workspace.findFirst({ where: { user_id: userId } })
}

export async function POST(request: NextRequest) {
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
    const { name, description, model, temperature, max_tokens, top_p } = body

    if (!name || !model) {
      return NextResponse.json(
        { error: 'name and model are required' },
        { status: 400 }
      )
    }

    // Store in user settings as a JSON field - for now just track in sync log
    // In production, you'd want a ModelPreset table
    const preset = {
      id: `preset_${Date.now()}`,
      name,
      description,
      model,
      temperature: temperature ?? 0.7,
      max_tokens: max_tokens ?? 1024,
      top_p: top_p ?? 1,
      created_at: new Date().toISOString(),
    }

    await prisma.syncLog.create({
      data: {
        workspace_id: workspace.id,
        action: 'create',
        entity_type: 'model_preset',
        entity_id: preset.id,
        data: preset,
      },
    })

    return NextResponse.json(preset, { status: 201 })
  } catch (error: any) {
    console.error('Create model preset error:', error)
    return NextResponse.json(
      { error: 'Server error: ' + error.message },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
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

    // Get preset logs
    const presetLogs = await prisma.syncLog.findMany({
      where: {
        workspace_id: workspace.id,
        entity_type: 'model_preset',
      },
      orderBy: { created_at: 'desc' },
    })

    const presets = presetLogs
      .filter((log) => log.action === 'create')
      .map((log) => log.data)
      .filter((preset): preset is Record<string, any> => preset !== null)

    return NextResponse.json({ presets }, { status: 200 })
  } catch (error: any) {
    console.error('List model presets error:', error)
    return NextResponse.json(
      { error: 'Server error: ' + error.message },
      { status: 500 }
    )
  }
}
