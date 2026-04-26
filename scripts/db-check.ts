const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const user = await prisma.user.findUnique({
    where: { email: 'bobby.cloutier@gmail.com' },
    select: { id: true, email: true, subscription_tier: true },
  })
  console.log('DB user:', JSON.stringify(user, null, 2))
}

main().catch(console.error).finally(() => prisma.$disconnect())
