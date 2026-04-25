import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { rateLimit } from '@/lib/rate-limit'

const RESET_BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://promptoria.me'

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    const { allowed, retryAfterMs } = rateLimit(`forgot:${ip}`)
    if (!allowed) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil(retryAfterMs / 1000)) } }
      )
    }
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({ where: { email } })

    // Always return success to avoid email enumeration
    if (!user || !user.password) {
      return NextResponse.json({ message: 'If an account exists with that email, a reset link has been sent.' })
    }

    // Dynamic import to avoid circular deps at module level
    const { generateResetToken } = await import('@/lib/jwt')
    const token = generateResetToken(user.id)

    const resetUrl = `${RESET_BASE_URL}/auth/reset-password?token=${token}`

    // For now, log the reset link. In production, send via email.
    // TODO: Integrate with an email service (SendGrid, Resend, etc.)
    console.log(`Password reset requested for ${email}. Reset URL: ${resetUrl}`)

    return NextResponse.json({ message: 'If an account exists with that email, a reset link has been sent.', resetUrl: process.env.NODE_ENV === 'development' ? resetUrl : undefined })
  } catch (error: any) {
    console.error('Forgot password error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}