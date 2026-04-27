export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { inferModelMetadata } from '@/lib/model-enrichment'
import { verifyAccessToken } from '@/lib/jwt'
import Anthropic from '@anthropic-ai/sdk'

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434'
const OLLAMA_API_KEY = process.env.OLLAMA_API_KEY || ''

const TIER_RANK: Record<string, number> = {
  free: 1,
  pro: 2,
  enterprise: 3,
  byok: 4,
  admin: 99,
}

const CLAUDE_MODELS_FALLBACK = [
  { id: 'claude-3-5-haiku-20241022', name: 'Claude 3.5 Haiku', description: 'Fastest Claude model, great for quick tasks', family: 'claude', parameter_size: null, contextWindow: '200K', maxTokens: 8192, tier_required: 'byok', is_byok: true, cost_estimate: 'bring-your-own' },
  { id: 'claude-sonnet-4-20250514', name: 'Claude Sonnet 4', description: 'Balanced performance and intelligence', family: 'claude', parameter_size: null, contextWindow: '200K', maxTokens: 8192, tier_required: 'byok', is_byok: true, cost_estimate: 'bring-your-own' },
  { id: 'claude-opus-4-20250514', name: 'Claude Opus 4', description: 'Most capable Claude model for complex tasks', family: 'claude', parameter_size: null, contextWindow: '200K', maxTokens: 8192, tier_required: 'byok', is_byok: true, cost_estimate: 'bring-your-own' },
]

const CLAUDE_MODEL_META: Record<string, { name: string; description: string; contextWindow: string; maxTokens: number }> = {
  'claude-3-5-haiku': { name: 'Claude 3.5 Haiku', description: 'Fastest Claude model, great for quick tasks', contextWindow: '200K', maxTokens: 8192 },
  'claude-3-5-sonnet': { name: 'Claude 3.5 Sonnet', description: 'Balanced predecessor model', contextWindow: '200K', maxTokens: 8192 },
  'claude-sonnet-4': { name: 'Claude Sonnet 4', description: 'Balanced performance and intelligence', contextWindow: '200K', maxTokens: 8192 },
  'claude-opus-4': { name: 'Claude Opus 4', description: 'Most capable Claude model for complex tasks', contextWindow: '200K', maxTokens: 8192 },
  'claude-3-opus': { name: 'Claude 3 Opus', description: 'Powerful legacy model', contextWindow: '200K', maxTokens: 4096 },
  'claude-3-haiku': { name: 'Claude 3 Haiku', description: 'Legacy fast model', contextWindow: '200K', maxTokens: 4096 },
}

async function fetchAnthropicModels(apiKey: string): Promise<typeof CLAUDE_MODELS_FALLBACK> {
  try {
    const client = new Anthropic({ apiKey })
    const page = await client.models.list()
    const models: typeof CLAUDE_MODELS_FALLBACK = []
    for (const model of page.data) {
      const baseId = model.id.replace(/-\d{8}$/, '')
      const meta = CLAUDE_MODEL_META[baseId] || {
        name: model.display_name || model.id,
        description: 'Anthropic model',
        contextWindow: '200K',
        maxTokens: 8192,
      }
      models.push({
        id: model.id,
        name: meta.name,
        description: meta.description,
        family: 'claude',
        parameter_size: null,
        contextWindow: meta.contextWindow,
        maxTokens: meta.maxTokens,
        tier_required: 'byok',
        is_byok: true,
        cost_estimate: 'bring-your-own',
      })
    }
    return models.length > 0 ? models : CLAUDE_MODELS_FALLBACK
  } catch {
    return CLAUDE_MODELS_FALLBACK
  }
}

const FALLBACK_MODELS = [
  { id: 'gemma3:4b', name: 'Gemma 3 (4B)', description: 'Google latest single-GPU model', family: 'gemma', parameter_size: '4B', contextWindow: '128K', maxTokens: 4096, tier_required: 'free', is_byok: false, cost_estimate: null },
  { id: 'nemotron-3-nano:4b', name: 'Nemotron 3 Nano (4B)', description: 'Efficient agentic model', family: 'nemotron', parameter_size: '4B', contextWindow: '128K', maxTokens: 4096, tier_required: 'free', is_byok: false, cost_estimate: null },
  { id: 'qwen3.5:0.8b', name: 'Qwen 3.5 (0.8B)', description: 'Ultra-tiny edge model', family: 'qwen', parameter_size: '0.8B', contextWindow: '32K', maxTokens: 2048, tier_required: 'free', is_byok: false, cost_estimate: null },
  { id: 'deepseek-v4-flash', name: 'DeepSeek-V4 Flash', description: 'Efficient reasoning with 1M context', family: 'deepseek', parameter_size: '13B', contextWindow: '1M', maxTokens: 8192, tier_required: 'pro', is_byok: false, cost_estimate: 'medium' },
  { id: 'ministral-3:14b', name: 'Ministral 3 (14B)', description: 'Strong edge deployment model', family: 'mistral', parameter_size: '14B', contextWindow: '128K', maxTokens: 8192, tier_required: 'pro', is_byok: false, cost_estimate: 'medium' },
  { id: 'gemma4:26b', name: 'Gemma 4 (26B)', description: 'Frontier-level performance', family: 'gemma', parameter_size: '26B', contextWindow: '128K', maxTokens: 8192, tier_required: 'pro', is_byok: false, cost_estimate: 'medium' },
  { id: 'devstral-small-2:24b', name: 'Devstral Small 2 (24B)', description: 'Coding and codebase exploration', family: 'devstral', parameter_size: '24B', contextWindow: '128K', maxTokens: 8192, tier_required: 'pro', is_byok: false, cost_estimate: 'medium' },
  { id: 'qwen3.5:27b', name: 'Qwen 3.5 (27B)', description: 'Strong multilingual performance', family: 'qwen', parameter_size: '27B', contextWindow: '128K', maxTokens: 8192, tier_required: 'pro', is_byok: false, cost_estimate: 'medium' },
  { id: 'nemotron-3-super:120b', name: 'Nemotron 3 Super (120B)', description: 'Maximum efficiency MoE', family: 'nemotron', parameter_size: '120B', contextWindow: '128K', maxTokens: 8192, tier_required: 'enterprise', is_byok: false, cost_estimate: 'expensive' },
]

async function fetchOllamaTags(): Promise<string[]> {
  try {
    const headers: Record<string, string> = {}
    if (OLLAMA_API_KEY) headers['Authorization'] = `Bearer ${OLLAMA_API_KEY}`
    const res = await fetch(`${OLLAMA_BASE_URL}/api/tags`, { headers, next: { revalidate: 0 } })
    if (!res.ok) return []
    const data = await res.json()
    return (data.models || []).map((m: any) => m.name || m.model || m).filter(Boolean)
  } catch {
    return []
  }
}

function inferTier(paramSize: string | null): string {
  if (!paramSize) return 'pro'
  const num = parseFloat(paramSize.replace(/[a-z]/gi, '')) * (paramSize.toLowerCase().endsWith('m') ? 0.001 : 1)
  if (num <= 8) return 'free'
  if (num <= 30) return 'pro'
  return 'enterprise'
}

function inferDisplayName(tag: string, family: string, paramSize: string | null): string {
  const base = tag.includes(':') ? tag.split(':')[0] : tag
  if (paramSize) return `${base} (${paramSize})`
  return base
}

async function syncPresetsFromOllama(ollamaTags: string[]) {
  if (ollamaTags.length === 0) return

  const existingPresets = await prisma.modelPreset.findMany()
  const existingMap = new Map(existingPresets.map(p => [p.ollama_id, p]))

  const ollamaSet = new Set(ollamaTags)

  for (const preset of existingPresets) {
    if (preset.is_byok || preset.admin_overridden) continue
    if (!ollamaSet.has(preset.ollama_id) && preset.is_active) {
      await prisma.modelPreset.update({
        where: { id: preset.id },
        data: { is_active: false },
      })
    } else if (ollamaSet.has(preset.ollama_id) && !preset.is_active) {
      await prisma.modelPreset.update({
        where: { id: preset.id },
        data: { is_active: true },
      })
    }
  }

  const nextSort = (existingPresets.reduce((max, p) => Math.max(max, p.sort_order), 0) || 0) + 10

  for (let i = 0; i < ollamaTags.length; i++) {
    const tag = ollamaTags[i]
    if (existingMap.has(tag)) continue
    const meta = inferModelMetadata(tag)
    const tier = inferTier(meta.parameter_size)
    await prisma.modelPreset.create({
      data: {
        ollama_id: tag,
        display_name: inferDisplayName(tag, meta.family, meta.parameter_size),
        family: meta.family,
        parameter_size: meta.parameter_size,
        description: meta.description,
        context_window: meta.context_window,
        max_tokens: meta.max_tokens,
        is_active: true,
        tier_required: tier,
        cost_estimate: meta.cost_estimate,
        is_byok: false,
        sort_order: nextSort + i,
      },
    }).catch(() => {})
  }
}

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization')
    let userTier = 'free'

    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.substring(7)
        const base64Payload = token.split('.')[1]
        if (base64Payload) {
          const payload = JSON.parse(Buffer.from(base64Payload, 'base64').toString())
          userTier = payload?.tier || 'free'
        }
      } catch { /* stay free */ }
    }

    const userRank = TIER_RANK[userTier] || 1

    let userId: string | null = null
    let anthropicApiKey: string | null = null
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.substring(7)
        const decoded = verifyAccessToken(token)
        userId = decoded.userId
      } catch { /* no valid token */ }
    }

    if (userId) {
      try {
        const userSettings = await prisma.userSettings.findUnique({ where: { user_id: userId } })
        anthropicApiKey = userSettings?.anthropic_api_key || null
      } catch { /* silent */ }
    }

    let ollamaTags: string[] = []
    try {
      ollamaTags = await fetchOllamaTags()
    } catch { /* proceed without live data */ }

    try {
      if (ollamaTags.length > 0) {
        await syncPresetsFromOllama(ollamaTags)
      }
    } catch (syncErr: any) {
      console.error('Model sync error:', syncErr?.message || syncErr)
    }

    let presets: any[] = []
    try {
      presets = await prisma.modelPreset.findMany({
        where: { is_active: true },
        orderBy: [{ sort_order: 'asc' }, { display_name: 'asc' }],
      })
    } catch (err) {
      console.error('ModelPreset DB error:', err)
    }

    const ollamaSet = new Set(ollamaTags)
    let models: any[] = []
    if (presets.length > 0) {
      models = presets
        .filter((p) => {
          if (p.is_byok) return true
          if (ollamaTags.length > 0 && !ollamaSet.has(p.ollama_id)) return false
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
    }

    if (models.length === 0) {
      models = FALLBACK_MODELS.filter((m) => {
        const modelRank = TIER_RANK[m.tier_required] || 1
        return modelRank <= userRank
      })
    }

    if (anthropicApiKey) {
      const claudeModels = await fetchAnthropicModels(anthropicApiKey)
      models = [...claudeModels, ...models]
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
    console.error('Get models error:', error)
    return NextResponse.json(
      { models: FALLBACK_MODELS, error: error?.message || String(error) },
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