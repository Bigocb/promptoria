import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

const DEMO_ACCOUNTS = [
  { email: 'admin@promptoria.app', name: 'Admin Demo', tier: 'admin', tokenLimit: 999_999_000 },
  { email: 'free@promptoria.app', name: 'Free Tier Demo', tier: 'free', tokenLimit: 5_000 },
  { email: 'pro@promptoria.app', name: 'Pro Tier Demo', tier: 'pro', tokenLimit: 50_000 },
  { email: 'enterprise@promptoria.app', name: 'Enterprise Tier Demo', tier: 'enterprise', tokenLimit: 500_000 },
]

const DEMO_PASSWORD = 'demo1234'

const DEMO_SNIPPETS = [
  { name: 'Tone Modifier', content: 'Write in a {tone} tone. Be {adjective} but never {negative_trait}.' },
  { name: 'Output Format', content: 'Format your response as {format}. Use {style} headings if Markdown.' },
  { name: 'Audience Constraint', content: 'Target audience: {audience}. Reading level: {grade_level}. Keep sentences under {max_words} words.' },
  { name: 'Quality Gate', content: 'Before responding, verify: 1) No hallucinations 2) All facts are {verification_type} 3) Response is under {max_tokens} tokens' },
  { name: 'Context Block', content: '## Context\n{context}\n\n## Instructions\n{instructions}\n\n## Constraints\n{constraints}' },
]

const DEMO_PROMPTS = [
  {
    name: 'Product Description Generator',
    description: 'Generate compelling e-commerce product descriptions from bullet points.',
    tags: ['ecommerce', 'marketing', 'product'],
    model: 'qwen3.5:2b',
    template_body: `You are an expert e-commerce copywriter.

Write a compelling product description (2-3 paragraphs) for the following item:
Product: {product_name}
Category: {category}
Key features:
{features}

Tone: {tone}
Target audience: {audience}

Include:
- A catchy opening hook
- Benefits, not just features
- A subtle call to action
- Keep it under 200 words`,
  },
  {
    name: 'Code Review Assistant',
    description: 'Review code snippets for bugs, style, and performance issues.',
    tags: ['engineering', 'code-review', 'quality'],
    model: 'qwen3.5:2b',
    template_body: `You are a senior software engineer doing a code review.

Review the following {language} code:
\`\`\`{language}
{code}
\`\`\`

Provide:
1. A quick summary of what the code does
2. Any bugs or potential errors (with severity: Crit, Warning, Suggestion)
3. Style improvements
4. Performance considerations
5. One positive thing about the code

Format your response with clear headings.`,
  },
  {
    name: 'Customer Support Response',
    description: 'Draft professional support replies based on ticket context.',
    tags: ['support', 'customer-service', 'communication'],
    model: 'qwen3.5:2b',
    template_body: `You are a friendly customer support agent.

Draft a response to the following customer inquiry:
Customer message: {customer_message}
Customer sentiment: {sentiment}
Ticket priority: {priority}

Guidelines:
- Acknowledge their frustration (if negative sentiment)
- Provide a clear answer or next steps
- Offer additional help
- Sign off warmly
- Keep it concise (under 150 words)
- Do not make up refund amounts or specific timelines unless provided`,
  },
  {
    name: 'Meeting Notes Summarizer',
    description: 'Summarize raw meeting transcripts into structured action items.',
    tags: ['productivity', 'meetings', 'summarization'],
    model: 'qwen3.5:2b',
    template_body: `You are an executive assistant summarizing a meeting.

Given the following transcript, produce a structured summary:

TRANSCRIPT:
{transcript}

Output format:
## Attendees
(List anyone explicitly mentioned)

## Key Decisions
(Bullet points)

## Action Items
| Owner | Task | Due |
|-------|------|-----|

## Open Questions
(Bullet points)

If the transcript is too short or unclear, state that explicitly.`,
  },
  {
    name: 'Bug Report Analyzer',
    description: 'Parse unstructured bug reports into standardized fields.',
    tags: ['engineering', 'bugs', 'qa'],
    model: 'qwen3.5:2b',
    template_body: `You are a QA engineer structuring bug reports.

Take the following unstructured input and extract structured fields:

Input:
{unstructured_report}

Expected output:
- **Title**: One-line summary
- **Severity**: Critical / High / Medium / Low (choose based on impact language)
- **Steps to Reproduce**: Numbered list
- **Expected Result**: What should happen
- **Actual Result**: What actually happens
- **Environment**: Any OS/browser/device mentioned
- **Attachments**: Mention if screenshots/videos referenced
- **Suggested Fix** (if user mentioned one)

If critical info is missing, explicitly state "[MISSING: ...]".`,
  },
  {
    name: 'Feature Specification Draft',
    description: 'Turn informal feature ideas into structured PRD-style specs.',
    tags: ['product', 'specs', 'planning'],
    model: 'qwen3.5:2b',
    template_body: `You are a product manager writing a feature spec.

Draft a lightweight feature specification from the following input:

Feature idea:
{idea}

Target users: {target_users}
Success metric: {success_metric}
Constraints: {constraints}

Structure:
# Feature: [Name]
## Problem
## Solution Overview
## User Stories
- As a [user], I want [goal] so that [benefit]
## Acceptance Criteria
(Use Gherkin-style Given/When/Then)
## Open Questions
## Out of Scope

Keep it concise. Use bullet points over long paragraphs.`,
  },
]

async function main() {
  console.log('Seeding demo accounts...\n')

  for (const account of DEMO_ACCOUNTS) {
    const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10)

    const user = await prisma.user.upsert({
      where: { email: account.email },
      update: {
        subscription_tier: account.tier,
        daily_tokens_limit: account.tokenLimit,
      },
      create: {
        email: account.email,
        password: passwordHash,
        name: account.name,
        subscription_tier: account.tier,
        daily_tokens_limit: account.tokenLimit,
      },
    })

    let workspace = await prisma.workspace.findFirst({ where: { user_id: user.id } })
    if (!workspace) {
      workspace = await prisma.workspace.create({
        data: {
          name: `${account.name}'s Workspace`,
          slug: `${account.tier}-demo`,
          user_id: user.id,
        },
      })
    }

    await prisma.userSettings.upsert({
      where: { user_id: user.id },
      update: {},
      create: {
        user_id: user.id,
        theme: 'dark',
        default_model: 'qwen3.5:2b',
        default_temperature: 0.7,
        default_max_tokens: 1024,
      },
    })

    const interactionType = await prisma.agentInteractionType.upsert({
      where: { workspace_id_name: { workspace_id: workspace.id, name: 'General' } },
      update: {},
      create: {
        name: 'General',
        description: 'General purpose prompts',
        emoji: '',
        workspace_id: workspace.id,
      },
    })

    const category = await prisma.promptCategory.upsert({
      where: { workspace_id_name: { workspace_id: workspace.id, name: 'Templates' } },
      update: {},
      create: {
        name: 'Templates',
        description: 'Starter prompt templates',
        workspace_id: workspace.id,
        agent_interaction_type_id: interactionType.id,
      },
    })

    for (const snippet of DEMO_SNIPPETS) {
      await prisma.snippet.upsert({
        where: { workspace_id_name: { workspace_id: workspace.id, name: snippet.name } },
        update: {},
        create: {
          name: snippet.name,
          content: snippet.content,
          workspace_id: workspace.id,
        },
      })
    }

    for (const tmpl of DEMO_PROMPTS) {
      const existing = await prisma.prompt.findFirst({
        where: { workspace_id: workspace.id, name: `${account.tier}/${tmpl.name}` },
      })
      if (existing) continue

      const prompt = await prisma.prompt.create({
        data: {
          name: `${account.tier}/${tmpl.name}`,
          description: `[Demo] ${tmpl.description}`,
          workspace_id: workspace.id,
          tags: ['demo', ...tmpl.tags],
          model: tmpl.model,
          category_id: category.id,
        },
      })

      const version = await prisma.promptVersion.create({
        data: {
          prompt_id: prompt.id,
          version_number: 1,
          template_body: tmpl.template_body,
          model_config: { temperature: 0.7, maxTokens: 1024 },
          change_log: 'Initial version from demo seed',
        },
      })

      if (account.tier === 'admin' || account.tier === 'enterprise' || account.tier === 'pro') {
        const testInputs = [
          tmpl.template_body.replace(/\{[^}]+\}/g, 'example input')
            .substring(0, Math.min(200, tmpl.template_body.length)),
        ]

        for (const input of testInputs.slice(0, 1)) {
          const existingRun = await prisma.testRun.findFirst({
            where: { prompt_version_id: version.id },
          })
          if (existingRun) continue

          const model = tmpl.model
          const fakeOutput = `[Demo output for "${tmpl.name}"]\n\nThis is a pre-seeded demonstration result. Run this prompt with a live model to see real output.`
          const fakeTokens = Math.ceil((input.length + fakeOutput.length) / 4)
          const fakeDuration = Math.floor(Math.random() * 3000) + 800

          await prisma.testRun.create({
            data: {
              workspace_id: workspace.id,
              prompt_id: prompt.id,
              prompt_version_id: version.id,
              user_id: user.id,
              test_case_input: input,
              model: model,
              temperature: 0.7,
              max_tokens: 1024,
              output: fakeOutput,
              total_tokens: fakeTokens,
              status: 'success',
              started_at: new Date(Date.now() - 60_000),
              completed_at: new Date(),
              duration_ms: fakeDuration,
              cost_cents: Math.round(fakeDuration / 1000 * 0.1),
              gpu_seconds: fakeDuration / 1000,
            },
          })
        }
      }
    }

    console.log(`  ${account.tier}: ${account.email} / ${DEMO_PASSWORD}`)
  }

  console.log('\nDone! 4 demo accounts seeded.')
  console.log(`  free@promptoria.app / ${DEMO_PASSWORD} (free tier, 5K tokens/day)`)
  console.log(`  pro@promptoria.app / ${DEMO_PASSWORD} (pro tier, 50K tokens/day)`)
  console.log(`  enterprise@promptoria.app / ${DEMO_PASSWORD} (enterprise tier, 500K tokens/day)`)
  console.log(`  admin@promptoria.app / ${DEMO_PASSWORD} (admin, unlimited)`)
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(async () => { await prisma.$disconnect() })