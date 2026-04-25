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
    } catch {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const skip = parseInt(searchParams.get('skip') || '0')
    const take = Math.min(parseInt(searchParams.get('take') || '50'), 100)

    const [favorites, total] = await Promise.all([
      prisma.favorite.findMany({
        where: { user_id: userId },
        include: {
          prompt: {
            select: {
              id: true,
              name: true,
              description: true,
              tags: true,
              model: true,
              created_at: true,
              updated_at: true,
              category_id: true,
            },
          },
        },
        orderBy: { created_at: 'desc' },
        skip,
        take,
      }),
      prisma.favorite.count({ where: { user_id: userId } }),
    ])

    const prompts = favorites.map((f) => ({
      ...f.prompt,
      favorited_at: f.created_at,
    }))

    return NextResponse.json({
      favorites: prompts,
      pagination: { skip, take, total },
    })
  } catch (error: any) {
    console.error('List favorites error:', error)
    return NextResponse.json({ error: 'Server error: ' + error.message }, { status: 500 })
  }
}