import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { hashPassword } from '@/lib/auth'
import { generateAccessToken } from '@/lib/jwt'

// Simple email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

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

    // Validate email format
    if (!EMAIL_REGEX.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Validate password length (min 8 chars)
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 409 }
      )
    }

    // Hash password
    const hashedPassword = await hashPassword(password)

    // Create user with settings and workspace (atomic transaction)
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        settings: {
          create: {
            theme: 'gruvbox-dark',
            suggestionsEnabled: true,
            defaultModel: 'claude-3-haiku',
            defaultTemperature: 0.7,
            defaultMaxTokens: 500,
          },
        },
        workspace: {
          create: {
            name: 'Default Workspace',
            slug: 'default',
          },
        },
      },
      include: {
        settings: true,
      },
    })

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
          settings: {
            id: user.settings.id,
            user_id: user.settings.userId,
            theme: user.settings.theme,
            suggestions_enabled: user.settings.suggestionsEnabled,
            default_model: user.settings.defaultModel,
            default_temperature: user.settings.defaultTemperature,
            default_max_tokens: user.settings.defaultMaxTokens,
            created_at: user.settings.createdAt,
            updated_at: user.settings.updatedAt,
          },
        },
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('Signup error:', error)
    return NextResponse.json(
      { error: 'Server error: ' + error.message },
      { status: 500 }
    )
  }
}
