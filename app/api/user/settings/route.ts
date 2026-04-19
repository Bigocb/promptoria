import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyAccessToken } from '@/lib/jwt'

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    let userId: string
    try {
      const decoded = verifyAccessToken(token)
      userId = decoded.userId
    } catch (error) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const settings = await prisma.userSettings.findUnique({
      where: { user_id: userId },
    })

    if (!settings) {
      // Return default settings if none exist
      return NextResponse.json(
        {
          user_id: userId,
          theme: 'light',
          suggestions_enabled: true,
          default_model: 'claude-3-haiku-20240307',
          default_temperature: 0.7,
          default_max_tokens: 1024,
        },
        { status: 200 }
      )
    }

    return NextResponse.json(settings, { status: 200 })
  } catch (error: any) {
    console.error('Get user settings error:', error)
    return NextResponse.json(
      { error: 'Server error: ' + error.message },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    let userId: string
    try {
      const decoded = verifyAccessToken(token)
      userId = decoded.userId
    } catch (error) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      theme,
      suggestions_enabled,
      default_model,
      default_temperature,
      default_max_tokens,
      anthropic_api_key,
    } = body

    // Get or create settings
    let settings = await prisma.userSettings.findUnique({
      where: { user_id: userId },
    })

    if (!settings) {
      settings = await prisma.userSettings.create({
        data: { user_id: userId },
      })
    }

    // Update settings with provided values
    const updatedSettings = await prisma.userSettings.update({
      where: { user_id: userId },
      data: {
        theme: theme !== undefined ? theme : settings.theme,
        suggestions_enabled:
          suggestions_enabled !== undefined ? suggestions_enabled : settings.suggestions_enabled,
        default_model: default_model !== undefined ? default_model : settings.default_model,
        default_temperature:
          default_temperature !== undefined ? default_temperature : settings.default_temperature,
        default_max_tokens:
          default_max_tokens !== undefined ? default_max_tokens : settings.default_max_tokens,
        anthropic_api_key:
          anthropic_api_key !== undefined ? anthropic_api_key : settings.anthropic_api_key,
      },
    })

    // Don't return the API key in the response for security
    const { anthropic_api_key: _, ...safeSettings } = updatedSettings
    return NextResponse.json(safeSettings, { status: 200 })
  } catch (error: any) {
    console.error('Update user settings error:', error)
    return NextResponse.json(
      { error: 'Server error: ' + error.message },
      { status: 500 }
    )
  }
}
