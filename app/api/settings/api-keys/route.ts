import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyAccessToken } from '@/lib/jwt'
import crypto from 'crypto'

function hashApiKey(key: string): string {
  return crypto.createHash('sha256').update(key).digest('hex')
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

    const userSettings = await prisma.userSettings.findUnique({
      where: { user_id: userId },
      select: {
        anthropic_api_key: true,
      },
    })

    // Don't return the actual key, just confirm if one is set
    const hasApiKey = !!userSettings?.anthropic_api_key

    return NextResponse.json(
      {
        has_api_key: hasApiKey,
        message: hasApiKey ? 'API key is configured' : 'No API key configured',
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('Get API key status error:', error)
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
    const { api_key } = body

    if (!api_key) {
      return NextResponse.json({ error: 'api_key is required' }, { status: 400 })
    }

    if (typeof api_key !== 'string' || api_key.length < 10) {
      return NextResponse.json(
        { error: 'Invalid API key format' },
        { status: 400 }
      )
    }

    // Update or create settings
    const settings = await prisma.userSettings.upsert({
      where: { user_id: userId },
      create: {
        user_id: userId,
        anthropic_api_key: api_key,
      },
      update: {
        anthropic_api_key: api_key,
      },
    })

    return NextResponse.json(
      {
        message: 'API key updated successfully',
        key_hash: hashApiKey(api_key).substring(0, 16),
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('Update API key error:', error)
    return NextResponse.json(
      { error: 'Server error: ' + error.message },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
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

    // Clear the API key
    await prisma.userSettings.updateMany({
      where: { user_id: userId },
      data: { anthropic_api_key: null },
    })

    return NextResponse.json(
      {
        message: 'API key deleted successfully',
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('Delete API key error:', error)
    return NextResponse.json(
      { error: 'Server error: ' + error.message },
      { status: 500 }
    )
  }
}
