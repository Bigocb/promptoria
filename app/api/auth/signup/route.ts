import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import {
  hashPassword,
  generateToken,
  isValidEmail,
  isStrongPassword,
} from '@/lib/auth'

const prisma = new PrismaClient()

interface SignupRequest {
  email: string
  password: string
  confirmPassword: string
}

export async function POST(request: NextRequest) {
  try {
    const body: SignupRequest = await request.json()
    const { email, password, confirmPassword } = body

    // Validation
    if (!email || !password || !confirmPassword) {
      return NextResponse.json(
        { error: 'Email, password, and confirm password are required' },
        { status: 400 }
      )
    }

    if (!isValidEmail(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    if (!isStrongPassword(password)) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters with uppercase, lowercase, and number' },
        { status: 400 }
      )
    }

    if (password !== confirmPassword) {
      return NextResponse.json(
        { error: 'Passwords do not match' },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      )
    }

    // Hash password
    const hashedPassword = await hashPassword(password)

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
      },
    })

    // Create default workspace
    const workspace = await prisma.workspace.create({
      data: {
        name: `${email}'s Workspace`,
        slug: `workspace-${user.id.slice(0, 8)}`,
        userId: user.id,
      },
    })

    // Create default settings
    await prisma.userSettings.create({
      data: {
        userId: user.id,
      },
    })

    // Generate token
    const token = generateToken(user.id, user.email)

    const response = NextResponse.json(
      {
        token,
        user: {
          id: user.id,
          email: user.email,
        },
        workspace,
      },
      { status: 201 }
    )

    // Set httpOnly cookie for middleware
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
    })

    return response
  } catch (error) {
    console.error('Signup error:', error)
    return NextResponse.json(
      {
        error: 'Failed to create account',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}
