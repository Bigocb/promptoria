import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyRefreshToken, generateAccessToken } from '@/lib/jwt'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { refresh_token } = body

    // Validate input
    if (!refresh_token) {
      return NextResponse.json(
        { error: 'refresh_token is required' },
        { status: 400 }
      )
    }

    // Verify refresh token
    let userId: string
    try {
      const decoded = verifyRefreshToken(refresh_token)
      userId = decoded.userId
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid or expired refresh token' },
        { status: 401 }
      )
    }

    // Get user to verify they still exist
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { user_settings: true },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 401 }
      )
    }

    // Generate new access token
    const accessToken = generateAccessToken(user.id, user.email)

    // Return response matching login endpoint format
    return NextResponse.json(
      {
        access_token: accessToken,
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
    console.error('Refresh token error:', error)
    return NextResponse.json(
      { error: 'Server error: ' + error.message },
      { status: 500 }
    )
  }
}
