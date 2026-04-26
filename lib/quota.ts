import prisma from './prisma'

/**
 * Check if a user can consume tokens. If allowed, increments their counter.
 * Handles daily reset at UTC midnight automatically.
 */
export async function consumeTokens(
  userId: string,
  tokensToConsume: number
): Promise<{ allowed: boolean; remaining: number; limit: number }> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      daily_tokens_used: true,
      daily_tokens_limit: true,
      last_token_reset_at: true,
    },
  })

  if (!user) {
    return { allowed: false, remaining: 0, limit: 0 }
  }

  // Determine if we need to reset (UTC midnight has passed since last reset)
  const now = new Date()
  const todayUtcMidnight = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  )

  const needsReset = !user.last_token_reset_at || new Date(user.last_token_reset_at) < todayUtcMidnight

  if (needsReset) {
    await prisma.user.update({
      where: { id: userId },
      data: {
        daily_tokens_used: 0,
        last_token_reset_at: now,
      },
    })
  }

  const currentUsed = needsReset ? 0 : user.daily_tokens_used
  const limit = user.daily_tokens_limit

  if (currentUsed + tokensToConsume > limit) {
    return { allowed: false, remaining: limit - currentUsed, limit }
  }

  const newUsed = currentUsed + tokensToConsume

  await prisma.user.update({
    where: { id: userId },
    data: { daily_tokens_used: newUsed },
  })

  return { allowed: true, remaining: limit - newUsed, limit }
}

/**
 * Get current quota status without consuming. Also handles auto-reset.
 */
export async function getQuotaStatus(userId: string): Promise<{ used: number; limit: number; remaining: number }> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      daily_tokens_used: true,
      daily_tokens_limit: true,
      last_token_reset_at: true,
    },
  })

  if (!user) {
    return { used: 0, limit: 0, remaining: 0 }
  }

  const now = new Date()
  const todayUtcMidnight = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  )

  const needsReset = !user.last_token_reset_at || new Date(user.last_token_reset_at) < todayUtcMidnight

  if (needsReset) {
    await prisma.user.update({
      where: { id: userId },
      data: {
        daily_tokens_used: 0,
        last_token_reset_at: now,
      },
    })
    return { used: 0, limit: user.daily_tokens_limit, remaining: user.daily_tokens_limit }
  }

  return {
    used: user.daily_tokens_used,
    limit: user.daily_tokens_limit,
    remaining: user.daily_tokens_limit - user.daily_tokens_used,
  }
}