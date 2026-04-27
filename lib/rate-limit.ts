const WINDOW_MS = 60_000
const MAX_REQUESTS = 10

interface RateEntry {
  timestamps: number[]
}

const store = new Map<string, RateEntry>()

function cleanup() {
  const cutoff = Date.now() - WINDOW_MS * 2
  for (const [key, entry] of store) {
    entry.timestamps = entry.timestamps.filter(t => t > cutoff)
    if (entry.timestamps.length === 0) store.delete(key)
  }
}

setInterval(cleanup, WINDOW_MS)

const AUTH_WINDOW_MS = 60_000
const AUTH_MAX_REQUESTS = 5
const authStore = new Map<string, number[]>()

export function rateLimit(key: string): { allowed: boolean; retryAfterMs: number } {
  const now = Date.now()
  let timestamps = authStore.get(key) || []
  timestamps = timestamps.filter(t => t > now - AUTH_WINDOW_MS)
  if (timestamps.length >= AUTH_MAX_REQUESTS) {
    const retryAfterMs = timestamps[0] + AUTH_WINDOW_MS - now
    authStore.set(key, timestamps)
    return { allowed: false, retryAfterMs }
  }
  timestamps.push(now)
  authStore.set(key, timestamps)
  return { allowed: true, retryAfterMs: 0 }
}

export function checkRateLimit(userId: string): { allowed: boolean; remaining: number; resetInMs: number } {
  const now = Date.now()
  let entry = store.get(userId)

  if (!entry) {
    entry = { timestamps: [] }
    store.set(userId, entry)
  }

  entry.timestamps = entry.timestamps.filter(t => t > now - WINDOW_MS)

  if (entry.timestamps.length >= MAX_REQUESTS) {
    const oldestInWindow = entry.timestamps[0]
    const resetInMs = oldestInWindow + WINDOW_MS - now
    return { allowed: false, remaining: 0, resetInMs }
  }

  entry.timestamps.push(now)
  return { allowed: true, remaining: MAX_REQUESTS - entry.timestamps.length, resetInMs: 0 }
}