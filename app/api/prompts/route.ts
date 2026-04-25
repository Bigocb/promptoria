import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyAccessToken } from '@/lib/jwt'

export async function POST(request: NextRequest) {
  try {
    // Verify JWT token
    const authHeader = request.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized - missing or invalid token' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)
    let userId: string
    try {
      const decoded = verifyAccessToken(token)
      userId = decoded.userId
    } catch (error) {
      return NextResponse.json(
        { error: 'Unauthorized - invalid or expired token' },
        { status: 401 }
      )
    }

    // Get user's workspace
    const workspace = await prisma.workspace.findFirst({
      where: { user_id: userId },
    })

    if (!workspace) {
      return NextResponse.json(
        { error: 'Workspace not found' },
        { status: 404 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { name, description, template_body, tags, model, model_config, change_log, category_id } = body

    // Validate required fields
    if (!name || !template_body) {
      return NextResponse.json(
        { error: 'name and template_body are required' },
        { status: 400 }
      )
    }

    // Create prompt with initial version in transaction
    const prompt = await prisma.prompt.create({
      data: {
        name,
        description: description || null,
        workspace_id: workspace.id,
        tags: tags || [],
        model: model || 'claude-3-haiku',
        ...(category_id && { category_id }),
        versions: {
          create: {
            version_number: 1,
            template_body,
            model_config: model_config || { temperature: 0.7, maxTokens: 500 },
            change_log: change_log || 'Initial version',
            is_active: true,
          },
        },
      },
      include: {
        versions: true,
      },
    })

    // Log change to SyncLog
    await prisma.syncLog.create({
      data: {
        workspace_id: workspace.id,
        action: 'create',
        entity_type: 'prompt',
        entity_id: prompt.id,
        data: { name, model },
      },
    })

    return NextResponse.json(
      {
        id: prompt.id,
        name: prompt.name,
        description: prompt.description,
        tags: prompt.tags,
        model: prompt.model,
        category_id: prompt.category_id,
        latest_version: prompt.versions[0],
        versions: prompt.versions,
        created_at: prompt.created_at,
        updated_at: prompt.updated_at,
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('Create prompt error:', error)
    return NextResponse.json(
      { error: 'Server error: ' + error.message },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    // Verify JWT token
    const authHeader = request.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized - missing or invalid token' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)
    let userId: string
    try {
      const decoded = verifyAccessToken(token)
      userId = decoded.userId
    } catch (error) {
      return NextResponse.json(
        { error: 'Unauthorized - invalid or expired token' },
        { status: 401 }
      )
    }

    // Get user's workspace
    const workspace = await prisma.workspace.findFirst({
      where: { user_id: userId },
    })

    if (!workspace) {
      return NextResponse.json(
        { error: 'Workspace not found' },
        { status: 404 }
      )
    }

    // Parse pagination parameters
    const skipParam = request.nextUrl.searchParams.get('skip')
    const takeParam = request.nextUrl.searchParams.get('take')
    const includeAllVersions = request.nextUrl.searchParams.get('all_versions') === 'true'

    let skip = 0
    let take = 20

    if (skipParam) {
      const parsedSkip = parseInt(skipParam)
      if (!isNaN(parsedSkip) && parsedSkip >= 0) {
        skip = parsedSkip
      }
    }

    if (takeParam) {
      const parsedTake = parseInt(takeParam)
      if (!isNaN(parsedTake) && parsedTake > 0 && parsedTake <= 100) {
        take = parsedTake
      }
    }

    // Get total count for pagination
    const total = await prisma.prompt.count({
      where: { workspace_id: workspace.id },
    })

    // Get paginated prompts in workspace
    const prompts = await prisma.prompt.findMany({
      where: { workspace_id: workspace.id },
      include: {
        versions: {
          where: includeAllVersions ? undefined : { is_active: true },
          take: includeAllVersions ? undefined : 1,
          orderBy: { version_number: includeAllVersions ? 'asc' : 'desc' },
        },
      },
      orderBy: { updated_at: 'desc' },
      skip,
      take,
    })

    return NextResponse.json(
      {
        prompts: prompts.map(p => {
          const base: any = {
            id: p.id,
            name: p.name,
            description: p.description,
            tags: p.tags,
            model: p.model,
            created_at: p.created_at,
            updated_at: p.updated_at,
          }
          if (includeAllVersions) {
            base.versions = p.versions
          } else {
            base.version = p.versions[0] || null
          }
          return base
        }),
        pagination: {
          skip,
          take,
          total,
        },
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('List prompts error:', error)
    return NextResponse.json(
      { error: 'Server error: ' + error.message },
      { status: 500 }
    )
  }
}
