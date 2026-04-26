export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'

const TIER_RANK: Record<string, number> = { free: 1, pro: 2, enterprise: 3, byok: 4 }

const STATIC_MODELS = [
  { id: 'llama3.2', name: 'Llama 3.2', description: 'Fast general-purpose model', family: 'llama', parameter_size: null, contextWindow: '128K', maxTokens: 4096, tier_required: 'free', is_byok: false, cost_estimate: null },
  { id: 'gemma2:2b', name: 'Gemma 2 (2B)', description: 'Google lightweight model', family: 'gemma', parameter_size: null, contextWindow: '8K', maxTokens: 2048, tier_required: 'free', is_byok: false, cost_estimate: null },
  { id: 'qwen2.5:0.5b', name: 'Qwen 2.5 (0.5B)', description: 'Ultra-tiny multilingual', family: 'qwen', parameter_size: null, contextWindow: '32K', maxTokens: 1024, tier_required: 'free', is_byok: false, cost_estimate: null },
  { id: 'phi4-mini', name: 'Phi-4 Mini', description: 'Microsoft small model', family: 'phi', parameter_size: null, contextWindow: '128K', maxTokens: 4096, tier_required: 'free', is_byok: false, cost_estimate: null },
  { id: 'llama3.1:8b', name: 'Llama 3.1 (8B)', description: 'Better quality, longer context', family: 'llama', parameter_size: '8B', contextWindow: '128K', maxTokens: 8192, tier_required: 'pro', is_byok: false, cost_estimate: 'medium' },
  { id: 'mistral-nemo', name: 'Mistral Nemo', description: 'Strong open model, great instructions', family: 'mistral', parameter_size: '12B', contextWindow: '128K', maxTokens: 8192, tier_required: 'pro', is_byok: false, cost_estimate: 'medium' },
  { id: 'llama3.1:70b', name: 'Llama 3.1 (70B)', description: 'Best open-source model, highest quality', family: 'llama', parameter_size: '70B', contextWindow: '128K', maxTokens: 8192, tier_required: 'pro', is_byok: false, cost_estimate: 'expensive' },
  { id: 'deepseek-r1:14b', name: 'DeepSeek-R1 (14B)', description: 'Reasoning specialist, chains of thought', family: 'deepseek', parameter_size: '14B', contextWindow: '128K', maxTokens: 8192, tier_required: 'pro', is_byok: false, cost_estimate: 'medium' },
  { id: 'qwen2.5:14b', name: 'Qwen 2.5 (14B)', description: 'Multilingual, excellent context understanding', family: 'qwen', parameter_size: '14B', contextWindow: '128K', maxTokens: 8192, tier_required: 'pro', is_byok: false, cost_estimate: 'medium' },
]

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization')
    let userTier = 'free'

    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.substring(7)
        // Try to decode token just for tier info — if it fails, stay free
        const base64Payload = token.split('.')[1]
        if (base64Payload) {
          const payload = JSON.parse(Buffer.from(base64Payload, 'base64').toString())
          userTier = payload?.tier || payload?.subscription_tier || 'free'
        }
      } catch { /* stay free */ }
    }

    const userRank = TIER_RANK[userTier] || 1

    const models = STATIC_MODELS.filter((m) => {
      const modelRank = TIER_RANK[m.tier_required] || 1
      return modelRank <= userRank
    })

    return NextResponse.json(
      { models, user_tier: userTier, deployed_at: Date.now() },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
          'Surrogate-Control': 'no-store',
        },
      }
    )
  } catch (error: any) {
    return NextResponse.json(
      { models: [], error: error?.message || String(error), deployed_at: Date.now() },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
          'Surrogate-Control': 'no-store',
        },
      }
    )
  }
}
