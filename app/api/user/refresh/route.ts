import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyAccessToken, generateAccessToken } from '@/lib/jwt'

export async function GET(request: NextRequest) {
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

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, subscription_tier: true },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const newAccessToken = generateAccessToken(user.id, user.email, user.subscription_tier)

    return NextResponse.json({
      user: { id: user.id, email: user.email, tier: user.subscription_tier },
      access_token: newAccessToken,
    })
  } catch (error) {
    console.error('[User Refresh] Error:', error)
    return NextResponse.json({ error: 'Failed to refresh user' }, { status: 500 })
  }
}