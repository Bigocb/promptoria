import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { authenticateUser } from '@/lib/auth'
import { generateAccessToken } from '@/lib/jwt'

export async function POST(request: NextRequest) {
  try {
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

    // Generate JWT token
    const accessToken = generateAccessToken(user.id, user.email)

    // Return response (match Python backend format)
    return NextResponse.json(
      {
        access_token: accessToken,
        token_type: 'bearer',
        user: {
          id: user.id,
          email: user.email,
          created_at: user.createdAt,
          updated_at: user.updatedAt,
          settings: user.settings ? {
            id: user.settings.id,
            user_id: user.settings.userId,
            theme: user.settings.theme,
            suggestions_enabled: user.settings.suggestionsEnabled,
            default_model: user.settings.defaultModel,
            default_temperature: user.settings.defaultTemperature,
            default_max_tokens: user.settings.defaultMaxTokens,
            created_at: user.settings.createdAt,
            updated_at: user.settings.updatedAt,
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
