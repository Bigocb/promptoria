import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyAccessToken } from '@/lib/jwt'

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

    const workspace = await prisma.workspace.findFirst({
      where: { user_id: userId },
      include: {
        prompts: { select: { id: true } },
        snippets: { select: { id: true } },
        interaction_types: { select: { id: true } },
      },
    })

    if (!workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })
    }

    return NextResponse.json(
      {
        ...workspace,
        resource_counts: {
          prompts: workspace.prompts.length,
          snippets: workspace.snippets.length,
          interaction_types: workspace.interaction_types.length,
        },
        prompts: undefined,
        snippets: undefined,
        interaction_types: undefined,
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('Get workspace error:', error)
    return NextResponse.json(
      { error: 'Server error: ' + error.message },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
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

    const workspace = await prisma.workspace.findFirst({
      where: { user_id: userId },
    })

    if (!workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })
    }

    const body = await request.json()
    const { name, slug } = body

    const updatedWorkspace = await prisma.workspace.update({
      where: { id: workspace.id },
      data: {
        name: name !== undefined ? name : workspace.name,
        slug: slug !== undefined ? slug : workspace.slug,
      },
    })

    return NextResponse.json(updatedWorkspace, { status: 200 })
  } catch (error: any) {
    console.error('Update workspace error:', error)
    return NextResponse.json(
      { error: 'Server error: ' + error.message },
      { status: 500 }
    )
  }
}
