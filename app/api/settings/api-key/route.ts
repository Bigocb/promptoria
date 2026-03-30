import { verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const settings = await prisma.userSettings.findUnique({
      where: { userId: payload.userId },
    })

    if (!settings) {
      return NextResponse.json({ apiKey: '' })
    }

    // Return the API key (masked in the response for security, but we'll send it for the input field)
    return NextResponse.json({
      apiKey: settings.anthropicApiKey || '',
    })
  } catch (error) {
    console.error('Failed to get API key:', error)
    return NextResponse.json({ error: 'Failed to get API key' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const { apiKey } = await request.json()

    // Update or create user settings with the API key
    const settings = await prisma.userSettings.upsert({
      where: { userId: payload.userId },
      update: { anthropicApiKey: apiKey || null },
      create: {
        userId: payload.userId,
        anthropicApiKey: apiKey || null,
      },
    })

    return NextResponse.json({
      apiKey: settings.anthropicApiKey || '',
    })
  } catch (error) {
    console.error('Failed to save API key:', error)
    return NextResponse.json({ error: 'Failed to save API key' }, { status: 500 })
  }
}
