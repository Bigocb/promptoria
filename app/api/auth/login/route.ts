import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { authenticateUser } from '@/lib/auth'
import { generateAccessToken, generateRefreshToken } from '@/lib/jwt'
import { rateLimit } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    const { allowed, retryAfterMs } = rateLimit(`login:${ip}`)
    if (!allowed) {
      return NextResponse.json(
        { error: 'Too many login attempts. Please try again later.' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil(retryAfterMs / 1000)) } }
      )
    }

    const body = await request.json()
    const { email, password } = body

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Authenticate user
    const user = await authenticateUser(prisma, email, password)
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // Generate JWT tokens (access + refresh)
    const accessToken = generateAccessToken(user.id, user.email, user.subscription_tier)
    const refreshToken = generateRefreshToken(user.id)

    // Return response (match Python backend format)
    return NextResponse.json(
      {
        access_token: accessToken,
        refresh_token: refreshToken,
        token_type: 'bearer',
        user: {
          id: user.id,
          email: user.email,
          created_at: user.created_at,
          updated_at: user.updated_at,
          settings: user.user_settings ? {
            id: user.user_settings.id,
            user_id: user.user_settings.user_id,
            theme: user.user_settings.theme,
            suggestions_enabled: user.user_settings.suggestions_enabled,
            default_model: user.user_settings.default_model,
            default_temperature: user.user_settings.default_temperature,
            default_max_tokens: user.user_settings.default_max_tokens,
            created_at: user.user_settings.created_at,
            updated_at: user.user_settings.updated_at,
          } : null,
        },
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Server error: ' + error.message },
      { status: 500 }
    )
  }
}
