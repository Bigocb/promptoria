import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyAccessToken } from '@/lib/jwt'

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
    } catch {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const workspace = await prisma.workspace.findFirst({ where: { user_id: userId } })
    if (!workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })
    }

    const prompt = await prisma.prompt.findUnique({ where: { id: params.id } })
    if (!prompt || prompt.workspace_id !== workspace.id) {
      return NextResponse.json({ error: 'Prompt not found' }, { status: 404 })
    }

    const favorite = await prisma.favorite.upsert({
      where: { user_id_prompt_id: { user_id: userId, prompt_id: params.id } },
      update: {},
      create: { user_id: userId, prompt_id: params.id },
    })

    return NextResponse.json({ message: 'Prompt added to favorites', id: favorite.id, prompt_id: params.id })
  } catch (error: any) {
    console.error('Add favorite error:', error)
    return NextResponse.json({ error: 'Server error: ' + error.message }, { status: 500 })
  }
}

export async function DELETE(
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
    } catch {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const workspace = await prisma.workspace.findFirst({ where: { user_id: userId } })
    if (!workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })
    }

    const prompt = await prisma.prompt.findUnique({ where: { id: params.id } })
    if (!prompt || prompt.workspace_id !== workspace.id) {
      return NextResponse.json({ error: 'Prompt not found' }, { status: 404 })
    }

    await prisma.favorite.deleteMany({
      where: { user_id: userId, prompt_id: params.id },
    })

    return NextResponse.json({ message: 'Prompt removed from favorites', prompt_id: params.id })
  } catch (error: any) {
    console.error('Remove favorite error:', error)
    return NextResponse.json({ error: 'Server error: ' + error.message }, { status: 500 })
  }
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
    } catch {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const favorite = await prisma.favorite.findUnique({
      where: { user_id_prompt_id: { user_id: userId, prompt_id: params.id } },
    })

    return NextResponse.json({ is_favorite: !!favorite })
  } catch (error: any) {
    console.error('Check favorite error:', error)
    return NextResponse.json({ error: 'Server error: ' + error.message }, { status: 500 })
  }
}