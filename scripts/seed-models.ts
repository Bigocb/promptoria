import prisma from '../lib/prisma'

const seedModels: any[] = [
  // ─── TIER 1: FREE (tiny/cheap Ollama models) ───────────────────────
  {
    ollama_id: 'llama3.2:3b',
    display_name: 'Llama 3.2 (3B)',
    family: 'llama',
    parameter_size: '3B',
    description: 'Fast general-purpose model, good for most tasks',
    context_window: '128K',
    max_tokens: 4096,
    tier_required: 'free',
    cost_estimate: 'cheap',
    sort_order: 10,
  },
  {
    ollama_id: 'gemma2:2b',
    display_name: 'Gemma 2 (2B)',
    family: 'gemma',
    parameter_size: '2B',
    description: 'Google lightweight model, safety-tuned',
    context_window: '8K',
    max_tokens: 2048,
    tier_required: 'free',
    cost_estimate: 'cheap',
    sort_order: 20,
  },
  {
    ollama_id: 'qwen2.5:0.5b',
    display_name: 'Qwen 2.5 (0.5B)',
    family: 'qwen',
    parameter_size: '0.5B',
    description: 'Ultra-tiny, multilingual, very fast',
    context_window: '32K',
    max_tokens: 1024,
    tier_required: 'free',
    cost_estimate: 'cheap',
    sort_order: 30,
  },
  {
    ollama_id: 'phi4-mini',
    display_name: 'Phi-4 Mini',
    family: 'phi',
    parameter_size: '3.8B',
    description: 'Microsoft small model, strong reasoning for size',
    context_window: '128K',
    max_tokens: 4096,
    tier_required: 'free',
    cost_estimate: 'cheap',
    sort_order: 40,
  },

  // ─── TIER 2: PRO (larger Ollama models) ────────────────────────────
  {
    ollama_id: 'llama3.1:8b',
    display_name: 'Llama 3.1 (8B)',
    family: 'llama',
    parameter_size: '8B',
    description: 'Better quality, longer context, more capable',
    context_window: '128K',
    max_tokens: 8192,
    tier_required: 'pro',
    cost_estimate: 'medium',
    sort_order: 100,
  },
  {
    ollama_id: 'mistral-nemo',
    display_name: 'Mistral Nemo',
    family: 'mistral',
    parameter_size: '12B',
    description: 'Strong open model, great instructions',
    context_window: '128K',
    max_tokens: 8192,
    tier_required: 'pro',
    cost_estimate: 'medium',
    sort_order: 110,
  },
  {
    ollama_id: 'llama3.1:70b',
    display_name: 'Llama 3.1 (70B)',
    family: 'llama',
    parameter_size: '70B',
    description: 'Best open-source model, highest quality',
    context_window: '128K',
    max_tokens: 8192,
    tier_required: 'pro',
    cost_estimate: 'expensive',
    sort_order: 120,
  },
  {
    ollama_id: 'deepseek-r1:14b',
    display_name: 'DeepSeek-R1 (14B)',
    family: 'deepseek',
    parameter_size: '14B',
    description: 'Reasoning specialist, chains of thought',
    context_window: '128K',
    max_tokens: 8192,
    tier_required: 'pro',
    cost_estimate: 'medium',
    sort_order: 130,
  },
  {
    ollama_id: 'qwen2.5:14b',
    display_name: 'Qwen 2.5 (14B)',
    family: 'qwen',
    parameter_size: '14B',
    description: 'Multilingual, excellent context understanding',
    context_window: '128K',
    max_tokens: 8192,
    tier_required: 'pro',
    cost_estimate: 'medium',
    sort_order: 140,
  },

  // ─── TIER 3: BYOK (bring your own key — no Ollama hosting by us) ──
  {
    ollama_id: 'claude-sonnet-4',
    display_name: 'Claude Sonnet 4',
    family: 'anthropic',
    description: 'Anthropic mid-tier model. Requires BYOK.',
    context_window: '200K',
    max_tokens: 8192,
    tier_required: 'byok',
    cost_estimate: 'bring-your-own',
    is_byok: true,
    sort_order: 200,
  },
  {
    ollama_id: 'gpt-4o',
    display_name: 'GPT-4o',
    family: 'openai',
    description: 'OpenAI flagship. Requires BYOK.',
    context_window: '128K',
    max_tokens: 16384,
    tier_required: 'byok',
    cost_estimate: 'bring-your-own',
    is_byok: true,
    sort_order: 210,
  },
  {
    ollama_id: 'gpt-4o-mini',
    display_name: 'GPT-4o Mini',
    family: 'openai',
    description: 'Fast and cheap OpenAI model. Requires BYOK.',
    context_window: '128K',
    max_tokens: 16384,
    tier_required: 'byok',
    cost_estimate: 'bring-your-own',
    is_byok: true,
    sort_order: 220,
  },
]

async function main() {
  console.log('Seeding ModelPresets...')
  let created = 0
  for (const m of seedModels) {
    const upserted = await prisma.modelPreset.upsert({
      where: { ollama_id: m.ollama_id },
      update: {
        display_name: m.display_name,
        family: m.family,
        parameter_size: m.parameter_size ?? null,
        description: m.description ?? null,
        context_window: m.context_window ?? null,
        max_tokens: m.max_tokens ?? null,
        tier_required: m.tier_required,
        cost_estimate: m.cost_estimate ?? null,
        is_byok: m.is_byok ?? false,
        is_active: true,
        sort_order: m.sort_order,
      },
      create: m,
    })
    console.log(`  ${upserted.ollama_id} (${upserted.tier_required})`)
    created++
  }
  console.log(`Done. ${created} models seeded.`)
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())