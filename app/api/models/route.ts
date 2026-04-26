export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyAccessToken } from '@/lib/jwt'

const TIER_RANK: Record<string, number> = { free: 1, pro: 2, enterprise: 3, byok: 4 }

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization')
    let userTier = 'free'

    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.substring(7)
        const decoded = verifyAccessToken(token)
        const user = await prisma.user.findUnique({
          where: { id: decoded.userId },
          select: { subscription_tier: true },
        })
        if (user?.subscription_tier) userTier = user.subscription_tier
      } catch { /* silently fall back */ }
    }

    const userRank = TIER_RANK[userTier] || 1

    let presets: any[] = []
    try {
      presets = await prisma.modelPreset.findMany({
        where: { is_active: true },
        orderBy: [{ sort_order: 'asc' }, { display_name: 'asc' }],
      })
    } catch {
      /* DB error handled below */ 
    }

    if (presets.length === 0) {
      presets = [
        { ollama_id: 'llama3.2', display_name: 'Llama 3.2', family: 'llama', description: 'Fast general-purpose model', context_window: '128K', max_tokens: 4096, tier_required: 'free', is_byok: false },
        { ollama_id: 'gemma2:2b', display_name: 'Gemma 2 (2B)', family: 'gemma', description: 'Google lightweight model', context_window: '8K', max_tokens: 2048, tier_required: 'free', is_byok: false },
        { ollama_id: 'qwen2.5:0.5b', display_name: 'Qwen 2.5 (0.5B)', family: 'qwen', description: 'Ultra-tiny multilingual', context_window: '32K', max_tokens: 1024, tier_required: 'free', is_byok: false },
        { ollama_id: 'phi4-mini', display_name: 'Phi-4 Mini', family: 'phi', description: 'Microsoft small model', context_window: '128K', max_tokens: 4096, tier_required: 'free', is_byok: false },
      ]
    }

    let models = presets
      .filter((p) => {
        const modelRank = TIER_RANK[p.tier_required] || 1
        return modelRank <= userRank
      })
      .map((p) => ({
        id: p.ollama_id,
        name: p.display_name,
        description: p.description || '',
        family: p.family,
        parameter_size: p.parameter_size,
        contextWindow: p.context_window,
        maxTokens: p.max_tokens,
        tier_required: p.tier_required,
        is_byok: p.is_byok,
        cost_estimate: p.cost_estimate,
      }))

    if (models.length === 0) {
      models = [
        { id: 'llama3.2', name: 'Llama 3.2', description: 'Fast general-purpose model', family: 'llama', parameter_size: null, contextWindow: '128K', maxTokens: 4096, tier_required: 'free', is_byok: false, cost_estimate: null },
        { id: 'gemma2:2b', name: 'Gemma 2 (2B)', description: 'Google lightweight model', family: 'gemma', parameter_size: null, contextWindow: '8K', maxTokens: 2048, tier_required: 'free', is_byok: false, cost_estimate: null },
        { id: 'qwen2.5:0.5b', name: 'Qwen 2.5 (0.5B)', description: 'Ultra-tiny multilingual', family: 'qwen', parameter_size: null, contextWindow: '32K', maxTokens: 1024, tier_required: 'free', is_byok: false, cost_estimate: null },
        { id: 'phi4-mini', name: 'Phi-4 Mini', description: 'Microsoft small model', family: 'phi', parameter_size: null, contextWindow: '128K', maxTokens: 4096, tier_required: 'free', is_byok: false, cost_estimate: null },
      ]
    }

    return NextResponse.json(
      { models, user_tier: userTier },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      }
    )
  } catch (error: any) {
    return NextResponse.json(
      { models: [], error: error?.message || String(error) },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      }
    )
  }
}
