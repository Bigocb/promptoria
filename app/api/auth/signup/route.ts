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

    // Create user first
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
      },
    })

    // Create settings
    const settings = await prisma.userSettings.create({
      data: {
        user_id: user.id,
        theme: 'gruvbox-dark',
        suggestions_enabled: true,
        default_model: 'claude-3-haiku',
        default_temperature: 0.7,
        default_max_tokens: 500,
      },
    })

    // Create workspace
    const workspace = await prisma.workspace.create({
      data: {
        name: 'Default Workspace',
        slug: 'default',
        user_id: user.id,
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
          created_at: user.created_at,
          updated_at: user.updated_at,
          settings: {
            id: settings.id,
            user_id: settings.user_id,
            theme: settings.theme,
            suggestions_enabled: settings.suggestions_enabled,
            default_model: settings.default_model,
            default_temperature: settings.default_temperature,
            default_max_tokens: settings.default_max_tokens,
            created_at: settings.created_at,
            updated_at: settings.updated_at,
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
