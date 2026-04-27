import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyAccessToken } from '@/lib/jwt'
import { isAdmin } from '@/lib/is-admin'

const VALID_TIERS = ['free', 'pro', 'enterprise', 'admin']

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authHeader = request.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    let decoded: { userId: string; email: string; tier?: string }
    try {
      decoded = verifyAccessToken(token)
    } catch {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userIsAdmin = await isAdmin(decoded.userId)
    if (!userIsAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = params
    const body = await request.json()
    const { subscription_tier } = body

    if (!subscription_tier || !VALID_TIERS.includes(subscription_tier)) {
      return NextResponse.json({ error: `Invalid tier. Must be one of: ${VALID_TIERS.join(', ')}` }, { status: 400 })
    }

    if (id === decoded.userId && subscription_tier !== 'admin') {
      return NextResponse.json({ error: 'Cannot remove your own admin tier' }, { status: 400 })
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { subscription_tier },
      select: {
        id: true,
        email: true,
        name: true,
        subscription_tier: true,
        updated_at: true,
      },
    })

    return NextResponse.json({ user: updated })
  } catch (error) {
    console.error('[Admin Users Update] Error:', error)
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 })
  }
}