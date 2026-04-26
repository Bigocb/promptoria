import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyAccessToken } from '@/lib/jwt'

const DEFAULT_MODEL = 'llama3.2:3b'

function toCamelCase(settings: any) {
  return {
    theme: settings.theme,
    suggestionsEnabled: settings.suggestions_enabled,
    defaultModel: settings.default_model || DEFAULT_MODEL,
    defaultTemperature: settings.default_temperature ?? 0.7,
    defaultMaxTokens: settings.default_max_tokens ?? 500,
  }
}

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
      return NextResponse.json(
        toCamelCase({
          user_id: userId,
          theme: 'light',
          suggestions_enabled: true,
          default_model: DEFAULT_MODEL,
          default_temperature: 0.7,
          default_max_tokens: 500,
        }),
        { status: 200 }
      )
    }

    return NextResponse.json(toCamelCase(settings), { status: 200 })
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
    // Accept both camelCase (from client) and snake_case (legacy)
    const theme = body.theme
    const suggestions_enabled = body.suggestions_enabled ?? body.suggestionsEnabled
    const default_model = body.default_model ?? body.defaultModel
    const default_temperature = body.default_temperature ?? body.defaultTemperature
    const default_max_tokens = body.default_max_tokens ?? body.defaultMaxTokens

    let settings = await prisma.userSettings.findUnique({
      where: { user_id: userId },
    })

    if (!settings) {
      settings = await prisma.userSettings.create({
        data: { user_id: userId },
      })
    }

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
      },
    })

    return NextResponse.json(toCamelCase(updatedSettings), { status: 200 })
  } catch (error: any) {
    console.error('Update user settings error:', error)
    return NextResponse.json(
      { error: 'Server error: ' + error.message },
      { status: 500 }
    )
  }
}
