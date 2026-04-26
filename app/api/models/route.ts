import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyAccessToken } from '@/lib/jwt'

// Tier ranking — higher = more access
const TIER_RANK: Record<string, number> = {
  free: 1,
  pro: 2,
  enterprise: 3,
  byok: 4,
}

export async function GET(request: NextRequest) {
  try {
    // Auth is optional for public model listing (defaults to free)
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
      } catch {
        // silently fall back to free
      }
    }

    const userRank = TIER_RANK[userTier] || 1

    const presets = await prisma.modelPreset.findMany({
      where: { is_active: true },
      orderBy: [{ sort_order: 'asc' }, { display_name: 'asc' }],
    })

    const models = presets
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

    return NextResponse.json({ models, user_tier: userTier }, { status: 200 })
  } catch (error: any) {
    console.error('Get models error:', error)
    return NextResponse.json({ models: [], error: 'Server error' }, { status: 200 })
  }
}