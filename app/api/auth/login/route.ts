import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { verifyPassword, generateToken } from '@/lib/auth'

const prisma = new PrismaClient()

interface LoginRequest {
  email: string
  password: string
}

export async function POST(request: NextRequest) {
  try {
    const body: LoginRequest = await request.json()
    const { email, password } = body

    // Validation
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // Verify password
    const isPasswordValid = await verifyPassword(password, user.password)

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // Get workspace
    const workspace = await prisma.workspace.findUnique({
      where: { userId: user.id },
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
      { status: 200 }
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
    console.error('Login error:', error)
    return NextResponse.json(
      {
        error: 'Failed to login',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}
