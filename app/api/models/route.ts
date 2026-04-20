import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // Return list of available models from configured AI provider
    // Default: Ollama (local, free) + option for Claude (paid)
    const models = [
      // Ollama models (default, free, local)
      {
        id: 'llama2',
        name: 'Llama 2',
        description: 'Open source, fast, good for most tasks',
        inputPrice: 0,       // FREE - running locally
        outputPrice: 0,
        maxTokens: 4096,
        contextWindow: '4K',
        provider: 'ollama',
      },
      {
        id: 'mistral',
        name: 'Mistral 7B',
        description: 'Efficient, excellent quality-to-speed ratio',
        inputPrice: 0,       // FREE - running locally
        outputPrice: 0,
        maxTokens: 8000,
        contextWindow: '8K',
        provider: 'ollama',
      },
      {
        id: 'neural-chat',
        name: 'Neural Chat',
        description: 'Specialized for conversation and chat',
        inputPrice: 0,       // FREE - running locally
        outputPrice: 0,
        maxTokens: 4096,
        contextWindow: '4K',
        provider: 'ollama',
      },
      // Claude models (optional, requires API key)
      {
        id: 'claude-opus-4-6',
        name: 'Claude Opus 4.6',
        description: 'Most capable model, best for complex reasoning',
        inputPrice: 15,      // $15 per 1M input tokens
        outputPrice: 45,     // $45 per 1M output tokens
        maxTokens: 200000,
        contextWindow: '200K',
        provider: 'anthropic',
      },
      {
        id: 'claude-sonnet-4-6',
        name: 'Claude Sonnet 4.6',
        description: 'Balanced performance and speed',
        inputPrice: 3,       // $3 per 1M input tokens
        outputPrice: 15,     // $15 per 1M output tokens
        maxTokens: 200000,
        contextWindow: '200K',
        provider: 'anthropic',
      },
      {
        id: 'claude-haiku-4-5-20251001',
        name: 'Claude Haiku',
        description: 'Fast and compact for simple tasks',
        inputPrice: 0.25,    // $0.25 per 1M input tokens
        outputPrice: 1.25,   // $1.25 per 1M output tokens
        maxTokens: 200000,
        contextWindow: '200K',
        provider: 'anthropic',
      },
    ]

    return NextResponse.json({
      models,
      updated_at: new Date().toISOString(),
      note: 'Default: Ollama (local, free). Optionally configure Claude via Settings.',
      providers: {
        ollama: 'Local Ollama Cloud (default, requires installation)',
        anthropic: 'Claude API (requires API key)',
      }
    }, { status: 200 })
  } catch (error: any) {
    console.error('Get models error:', error)
    return NextResponse.json(
      { error: 'Server error: ' + error.message },
      { status: 500 }
    )
  }
}
