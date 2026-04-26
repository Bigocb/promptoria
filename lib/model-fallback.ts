import prisma from '@/lib/prisma'

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434'
const OLLAMA_API_KEY = process.env.OLLAMA_API_KEY || ''

/**
 * Known-working models from Ollama Cloud (latest catalog as of Apr 2026).
 * Ordered cheapest → most capable for graceful degradation.
 */
const FALLBACK_CHAIN = [
  'qwen3.5:2b',
  'gemma3:4b',
  'nemotron-3-nano:4b',
  'qwen3.5:0.8b',
]

/**
 * Check whether a model tag exists in Ollama Cloud (lightweight HEAD check).
 */
async function modelExists(tag: string): Promise<boolean> {
  try {
    const headers: Record<string, string> = {}
    if (OLLAMA_API_KEY) headers['Authorization'] = `Bearer ${OLLAMA_API_KEY}`
    const res = await fetch(`${OLLAMA_BASE_URL}/api/tags`, { headers, next: { revalidate: 0 } })
    if (!res.ok) return false
    const data = await res.json()
    const models: string[] = (data.models || []).map((m: any) => (m.name || m.model || m)).filter(Boolean)
    return models.includes(tag)
  } catch {
    return false
  }
}

/**
 * Resolve a model choice through this priority:
 * 1. Requested model (if provided and exists)
 * 2. Prompt's saved model (if exists)
 * 3. User's default_model (if exists)
 * 4. Static fallback chain (first that exists)
 *
 * Returns the best available model tag.
 */
export async function resolveAvailableModel(
  requested?: string | null,
  promptModel?: string | null,
  userDefault?: string | null
): Promise<string> {
  const candidates = [requested, promptModel, userDefault].filter(Boolean) as string[]

  for (const candidate of candidates) {
    const exists = await modelExists(candidate)
    if (exists) return candidate
  }

  for (const fallback of FALLBACK_CHAIN) {
    const exists = await modelExists(fallback)
    if (exists) return fallback
  }

  // Ultimate fallback — we already know 2b works in most cases
  return 'qwen3.5:2b'
}

/**
 * Quick synchronous fallback that uses a local LRU of availability results.
 * Use this in hot paths where you can't await.
 */
const lru = new Map<string, { available: boolean; at: number }>()
const LRU_TTL_MS = 60_000

export function cachedModelAvailable(tag: string): boolean {
  const entry = lru.get(tag)
  if (entry && Date.now() - entry.at < LRU_TTL_MS) {
    return entry.available
  }
  // Default to true for known fallbacks; background check runs later
  return true
}

export function setModelAvailability(tag: string, available: boolean) {
  lru.set(tag, { available, at: Date.now() })
}

/**
 * Helper: run a background check for all fallbacks and cache results.
 */
export async function warmModelCache() {
  for (const tag of FALLBACK_CHAIN) {
    const exists = await modelExists(tag)
    setModelAvailability(tag, exists)
  }
}
