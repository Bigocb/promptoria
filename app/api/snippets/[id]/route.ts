import { PrismaClient } from '@prisma/client'
import { NextRequest, NextResponse } from 'next/server'

const prisma = new PrismaClient()

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const snippet = await prisma.snippet.findUnique({
      where: { id: params.id },
    })

    if (!snippet) {
      return NextResponse.json({ error: 'Snippet not found' }, { status: 404 })
    }

    return NextResponse.json(snippet)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch snippet' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { name, description, content } = body

    const snippet = await prisma.snippet.update({
      where: { id: params.id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(content && { content }),
      },
    })

    return NextResponse.json(snippet)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update snippet' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.snippet.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete snippet' }, { status: 500 })
  }
}
