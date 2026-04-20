import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // Return list of available Claude models with pricing
    // Pricing is per 1M input/output tokens (as of April 2026)
    const models = [
      {
        id: 'claude-opus-4-6',
        name: 'Claude Opus 4.6',
        description: 'Most capable model, best for complex reasoning',
        inputPrice: 15,      // $15 per 1M input tokens
        outputPrice: 45,     // $45 per 1M output tokens
        maxTokens: 200000,
        contextWindow: '200K',
      },
      {
        id: 'claude-sonnet-4-6',
        name: 'Claude Sonnet 4.6',
        description: 'Balanced performance and speed',
        inputPrice: 3,       // $3 per 1M input tokens
        outputPrice: 15,     // $15 per 1M output tokens
        maxTokens: 200000,
        contextWindow: '200K',
      },
      {
        id: 'claude-haiku-4-5-20251001',
        name: 'Claude Haiku',
        description: 'Fast and compact for simple tasks',
        inputPrice: 0.25,    // $0.25 per 1M input tokens
        outputPrice: 1.25,   // $1.25 per 1M output tokens
        maxTokens: 200000,
        contextWindow: '200K',
      },
    ]

    return NextResponse.json({
      models,
      updated_at: new Date().toISOString(),
      note: 'Prices subject to change. See Anthropic pricing page for latest.'
    }, { status: 200 })
  } catch (error: any) {
    console.error('Get models error:', error)
    return NextResponse.json(
      { error: 'Server error: ' + error.message },
      { status: 500 }
    )
  }
}
