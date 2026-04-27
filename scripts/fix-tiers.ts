import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const MANUAL_FIXES: Record<string, { tier: string; param_size?: string; is_active?: boolean }> = {
  'ministral-3:3b': { tier: 'free', param_size: '3B' },
  'glm-5.1': { tier: 'enterprise', param_size: null },
  'kimi-k2.6': { tier: 'enterprise', param_size: null },
  'glm-5': { tier: 'pro', param_size: null },
  'glm-4.7': { tier: 'pro', param_size: null },
  'glm-4.6': { tier: 'pro', param_size: null },
  'kimi-k2:1t': { tier: 'enterprise', param_size: '1T' },
  'kimi-k2.5': { tier: 'pro' },
  'kimi-k2-thinking': { tier: 'pro' },
  'nemotron-3-super': { tier: 'enterprise', param_size: null },
  'gpt-4o': { tier: 'byok' },
  'gpt-4o-mini': { tier: 'byok' },
  'deepseek-v3.2': { tier: 'enterprise', param_size: null },
  'qwen3-coder-next': { tier: 'pro' },
  'gemini-3-flash-preview': { tier: 'enterprise', param_size: null },
  'deepseek-v4-flash': { tier: 'pro' },
  'qwen3-vl:235b-instruct': { tier: 'enterprise', param_size: '235B' },
  'qwen3-vl': { tier: 'enterprise' },
  'gpt-oss:20b': { tier: 'pro', param_size: '20B' },
  'gpt-oss:120b': { tier: 'enterprise', param_size: '120B' },
}

function inferTierFromParamSize(paramSize: string | null): string {
  if (!paramSize || paramSize === 'unknown' || paramSize === 'null') return 'pro'
  const num = parseFloat(paramSize.replace(/[a-z]/gi, '')) * (paramSize.toLowerCase().endsWith('m') ? 0.001 : 1)
  if (isNaN(num) || num === 0) return 'pro'
  if (num <= 8) return 'free'
  if (num <= 30) return 'pro'
  return 'enterprise'
}

async function main() {
  console.log('Fixing model tiers (pass 2)...\n')

  const presets = await prisma.modelPreset.findMany()
  let fixed = 0

  for (const p of presets) {
    const manual = MANUAL_FIXES[p.ollama_id]
    let correctTier: string
    let updates: Record<string, any> = {}

    if (p.is_byok) continue

    if (manual) {
      correctTier = manual.tier
      if (manual.param_size !== undefined) updates.parameter_size = manual.param_size
    } else {
      let effectiveParam = p.parameter_size
      if (effectiveParam === 'unknown' || effectiveParam === 'null') effectiveParam = null
      correctTier = inferTierFromParamSize(effectiveParam)
    }

    if (p.tier_required !== correctTier) {
      updates.tier_required = correctTier
    }

    if (Object.keys(updates).length > 0) {
      await prisma.modelPreset.update({ where: { id: p.id }, data: updates })
      console.log(`  ${p.ollama_id}: ${Object.entries(updates).map(([k,v]) => `${k}=${v}`).join(', ')}`)
      fixed++
    }
  }

  console.log(`\nDone. Fixed ${fixed} presets.`)
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(async () => { await prisma.$disconnect() })