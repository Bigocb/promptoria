import prisma from './prisma'

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'bobby.cloutier@gmail.com'

export async function isAdmin(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, subscription_tier: true },
  })
  if (!user) return false
  return user.subscription_tier === 'admin' || user.email === ADMIN_EMAIL
}
