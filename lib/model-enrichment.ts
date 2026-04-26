/**
 * Infer model metadata from Ollama-style model identifiers like "llama3.2:3b".
 * Rules are heuristic and best-effort. Override in admin UI when wrong.
 */

export interface InferredMetadata {
  family: string
  parameter_size: string | null
  description: string | null
  context_window: string | null
  max_tokens: number | null
  cost_estimate: 'cheap' | 'medium' | 'expensive' | null
}

export function inferModelMetadata(ollamaId: string): InferredMetadata {
  const lower = ollamaId.toLowerCase()

  // ── Family ──────────────────────────────────────
  let family = 'unknown'
  if (lower.startsWith('llama')) family = 'llama'
  else if (lower.startsWith('qwen')) family = 'qwen'
  else if (lower.startsWith('mistral')) family = 'mistral'
  else if (lower.startsWith('gemma')) family = 'gemma'
  else if (lower.startsWith('phi')) family = 'phi'
  else if (lower.startsWith('deepseek')) family = 'deepseek'
  else if (lower.startsWith('falcon')) family = 'falcon'
  else if (lower.startsWith('command')) family = 'cohere'
  else if (lower.startsWith('yi')) family = 'yi'
  else if (lower.startsWith('orca')) family = 'orca'
  else if (lower.startsWith('stable') && lower.includes('lm')) family = 'stablelm'

  // ── Parameter size ──────────────────────────────
  const sizeMatch = lower.match(/:(\d+(?:\.?\d)?[km]?b)$/)
  let parameter_size: string | null = null
  if (sizeMatch) {
    parameter_size = sizeMatch[1].toUpperCase()
  } else {
    // Try infix patterns like "phi4-mini" → 4B-ish
    const infixMatch = lower.match(/(\d+\.?\d*)(b|m)?(?:-|$)/)
    if (infixMatch) {
      parameter_size = infixMatch[2] === 'm' ? `${infixMatch[1]}M` : `${infixMatch[1]}B`
    }
  }

  const paramNum = parameter_size
    ? parseFloat(parameter_size.replace(/[a-z]/gi, '')) * (parameter_size.endsWith('M') ? 0.001 : 1)
    : null

  // ── Description ─────────────────────────────────
  const descriptions: Record<string, string> = {
    llama: 'Meta Llama model — strong general-purpose performance',
    qwen: 'Alibaba Qwen model — excellent multilingual capabilities',
    mistral: 'Mistral AI model — efficient and high-quality reasoning',
    gemma: 'Google Gemma model — lightweight, safety-tuned',
    phi: 'Microsoft Phi model — strong reasoning for size',
    deepseek: 'DeepSeek model — reasoning specialist with CoT',
    falcon: 'TII Falcon model — open-source, transparent training',
    cohere: 'Cohere Command model — enterprise-grade generation',
    yi: '01.AI Yi model — bilingual (EN/CN) excellence',
    orca: 'Microsoft Orca — instruction-tuned for chat',
    stablelm: 'Stability AI StableLM — open assistant model',
  }
  const description = descriptions[family] || null

  // ── Defaults based on parameter size ─────────────
  let context_window: string | null = '128K'
  let max_tokens: number | null = 4096
  let cost_estimate: 'cheap' | 'medium' | 'expensive' | null = 'medium'

  if (paramNum !== null) {
    if (paramNum <= 3) {
      context_window = '128K'
      max_tokens = 2048
      cost_estimate = 'cheap'
    } else if (paramNum <= 8) {
      context_window = '128K'
      max_tokens = 4096
      cost_estimate = 'medium'
    } else if (paramNum <= 14) {
      context_window = '128K'
      max_tokens = 8192
      cost_estimate = 'medium'
    } else {
      context_window = '128K'
      max_tokens = 8192
      cost_estimate = 'expensive'
    }
  }

  // Overrides for known small/tiny exceptions
  if (lower.includes('mini')) {
    max_tokens = 2048
    cost_estimate = 'cheap'
  }

  return {
    family,
    parameter_size,
    description,
    context_window,
    max_tokens,
    cost_estimate,
  }
}

/**
 * Score how complete a model preset row is.
 * Returns an array of missing field names.
 */
export function checkCompleteness(preset: Record<string, any>): string[] {
  const missing: string[] = []
  if (!preset.description) missing.push('description')
  if (!preset.context_window) missing.push('context_window')
  if (!preset.max_tokens) missing.push('max_tokens')
  if (!preset.parameter_size) missing.push('parameter_size')
  if (!preset.cost_estimate) missing.push('cost_estimate')
  return missing
}
