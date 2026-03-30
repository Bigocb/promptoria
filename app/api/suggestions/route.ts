import { verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

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

    const { promptContent, focusAreas } = await request.json()

    if (!promptContent || !promptContent.trim()) {
      return NextResponse.json({ error: 'Prompt content is required' }, { status: 400 })
    }

    // Get user's API key from settings
    const settings = await prisma.userSettings.findUnique({
      where: { userId: payload.userId },
    })

    const apiKey = settings?.anthropicApiKey
    if (!apiKey) {
      return NextResponse.json(
        { error: 'No API key configured. Please add your Anthropic API key in Settings.' },
        { status: 400 }
      )
    }

    // Create Anthropic client with user's API key
    const client = new Anthropic({ apiKey })

    // Call Claude for suggestions
    const message = await client.messages.create({
      model: 'claude-3-5-haiku-20241022',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: `You are an expert prompt engineer. Analyze the following prompt and provide 5 specific, actionable suggestions to improve it. Focus on: ${focusAreas || 'effectiveness, clarity, and specificity'}.

Prompt to analyze:
"""
${promptContent}
"""

Provide suggestions in a clear, numbered format. Be specific and practical.`,
        },
      ],
    })

    const suggestions =
      message.content[0].type === 'text'
        ? message.content[0].text
        : 'Unable to generate suggestions'

    return NextResponse.json({ suggestions })
  } catch (error) {
    console.error('Suggestions API error:', error)

    if (error instanceof Error && error.message.includes('401')) {
      return NextResponse.json(
        { error: 'Invalid API key. Please check your Anthropic API key in Settings.' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get suggestions' },
      { status: 500 }
    )
  }
}
