import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { verifyToken, extractToken } from '@/lib/auth'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const token = extractToken(request.headers.get('authorization'))

    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user settings
    const settings = await prisma.userSettings.findUnique({
      where: { userId: decoded.userId },
    })

    if (!settings) {
      return NextResponse.json(
        { error: 'Settings not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      theme: settings.theme,
      suggestionsEnabled: settings.suggestionsEnabled,
      defaultModel: settings.defaultModel,
      defaultTemperature: settings.defaultTemperature,
      defaultMaxTokens: settings.defaultMaxTokens,
    })
  } catch (error) {
    console.error('Settings GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = extractToken(request.headers.get('authorization'))

    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const {
      theme,
      suggestionsEnabled,
      defaultModel,
      defaultTemperature,
      defaultMaxTokens,
    } = body

    // Update settings
    const updated = await prisma.userSettings.update({
      where: { userId: decoded.userId },
      data: {
        ...(theme !== undefined && { theme }),
        ...(suggestionsEnabled !== undefined && { suggestionsEnabled }),
        ...(defaultModel !== undefined && { defaultModel }),
        ...(defaultTemperature !== undefined && { defaultTemperature }),
        ...(defaultMaxTokens !== undefined && { defaultMaxTokens }),
      },
    })

    return NextResponse.json({
      theme: updated.theme,
      suggestionsEnabled: updated.suggestionsEnabled,
      defaultModel: updated.defaultModel,
      defaultTemperature: updated.defaultTemperature,
      defaultMaxTokens: updated.defaultMaxTokens,
    })
  } catch (error) {
    console.error('Settings POST error:', error)
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    )
  }
}
