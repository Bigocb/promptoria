import { PrismaClient } from '@prisma/client'
const db = new PrismaClient()
async function main() {
  const results = await db.modelPreset.findMany({
    select: { ollama_id: true, parameter_size: true, tier_required: true },
    orderBy: { ollama_id: 'asc' },
  })
  for (const r of results) {
    console.log(`${r.tier_required.padEnd(12)} ${r.parameter_size || 'null'.padEnd(6)} ${r.ollama_id}`)
  }
}
main().then(() => db.$disconnect()).catch(e => { console.error(e); process.exit(1) })