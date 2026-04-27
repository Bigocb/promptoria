import prisma from './prisma'

const OLLAMA_GPU_RATE_PER_SECOND = parseFloat(process.env.OLLAMA_GPU_RATE_PER_SECOND || '0.001')
const OLLAMA_GPU_BILLING_MODEL = process.env.OLLAMA_GPU_BILLING_MODEL || 'gpu_time'

interface CostResult {
  cost_cents: number
  gpu_seconds: number | null
}

export async function computeTestRunCost(
  modelId: string,
  totalTokens: number,
  durationMs: number,
  isOllama: boolean
): Promise<CostResult> {
  const preset = await prisma.modelPreset.findUnique({
    where: { ollama_id: modelId },
    select: { cost_per_1k_input: true, cost_per_1k_output: true, is_byok: true },
  })

  if (preset?.is_byok) {
    return { cost_cents: 0, gpu_seconds: null }
  }

  if (isOllama) {
    const gpuSeconds = durationMs / 1000

    if (preset?.cost_per_1k_input || preset?.cost_per_1k_output) {
      const inputTokens = Math.ceil(totalTokens * 0.75)
      const outputTokens = Math.ceil(totalTokens * 0.25)
      const inputCost = (inputTokens / 1000) * (preset.cost_per_1k_input || 0)
      const outputCost = (outputTokens / 1000) * (preset.cost_per_1k_output || 0)
      return {
        cost_cents: Math.round((inputCost + outputCost) * 100),
        gpu_seconds: gpuSeconds,
      }
    }

    return {
      cost_cents: Math.round(gpuSeconds * OLLAMA_GPU_RATE_PER_SECOND * 100),
      gpu_seconds: gpuSeconds,
    }
  }

  if (preset?.cost_per_1k_input || preset?.cost_per_1k_output) {
    const inputTokens = Math.ceil(totalTokens * 0.75)
    const outputTokens = Math.ceil(totalTokens * 0.25)
    const inputCost = (inputTokens / 1000) * (preset.cost_per_1k_input || 0)
    const outputCost = (outputTokens / 1000) * (preset.cost_per_1k_output || 0)
    return {
      cost_cents: Math.round((inputCost + outputCost) * 100),
      gpu_seconds: null,
    }
  }

  return { cost_cents: 0, gpu_seconds: null }
}

const TIER_RANK: Record<string, number> = {
  free: 1,
  pro: 2,
  enterprise: 3,
  byok: 4,
  admin: 99,
}

export async function canUserAccessModel(userId: string, modelId: string): Promise<{ allowed: boolean; reason?: string }> {
  if (modelId.startsWith('claude-')) {
    return { allowed: true }
  }

  const preset = await prisma.modelPreset.findUnique({
    where: { ollama_id: modelId },
    select: { tier_required: true, is_active: true, is_byok: true },
  })

  if (!preset) {
    return { allowed: true }
  }

  if (!preset.is_active) {
    return { allowed: false, reason: `Model ${modelId} is currently inactive` }
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { subscription_tier: true },
  })

  const userRank = TIER_RANK[user?.subscription_tier || 'free'] || 1
  const modelRank = TIER_RANK[preset.tier_required] || 1

  if (modelRank > userRank) {
    return { allowed: false, reason: `Model ${modelId} requires ${preset.tier_required} tier` }
  }

  return { allowed: true }
}