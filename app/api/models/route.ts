import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  // Return available models
  // Note: This endpoint provides model information for the UI
  // Actual prompt execution uses Anthropic Claude API via test runs

  return NextResponse.json(
    {
      ollama_available: false,
      models: [
        {
          id: 'claude-opus-4-6',
          name: 'Claude Opus 4.6',
          size: null,
          parameter_size: 'Large',
          quantization_level: null,
          family: 'Claude',
          description: 'Powerful model for complex tasks',
        },
        {
          id: 'claude-sonnet-4-6',
          name: 'Claude Sonnet 4.6',
          size: null,
          parameter_size: 'Large',
          quantization_level: null,
          family: 'Claude',
          description: 'Balanced model for general purpose',
        },
        {
          id: 'claude-haiku-4-5-20251001',
          name: 'Claude Haiku 4.5',
          size: null,
          parameter_size: 'Small',
          quantization_level: null,
          family: 'Claude',
          description: 'Fast model for simple tasks',
        },
      ],
      error: null,
    },
    { status: 200 }
  )
}
