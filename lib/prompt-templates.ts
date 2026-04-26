export interface TemplatePrompt {
  name: string
  description: string
  tags: string[]
  model: string
  template_body: string
  category?: string
  interaction_type?: string
}

const STARTER_PROMPTS: TemplatePrompt[] = [
  {
    name: 'Product Description Generator',
    description: 'Generate compelling e-commerce product descriptions from bullet points.',
    tags: ['ecommerce', 'marketing', 'product'],
    model: 'llama3.2:3b',
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
    model: 'llama3.2:3b',
    template_body: `You are a senior software engineer doing a code review.

Review the following {language} code:
\`\`\`{language}
{code}
\`\`\`

Provide:
1. A quick summary of what the code does
2. Any bugs or potential errors (with severity: 🔴 Critical, 🟡 Warning, 🟢 Suggestion)
3. Style improvements
4. Performance considerations
5. One positive thing about the code

Format your response with clear headings.`,
  },
  {
    name: 'Customer Support Response',
    description: 'Draft professional support replies based on ticket context.',
    tags: ['support', 'customer-service', 'communication'],
    model: 'llama3.2:3b',
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
    model: 'llama3.2:3b',
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
    name: 'Social Media Post Writer',
    description: 'Create platform-optimized social posts from blog content.',
    tags: ['marketing', 'social', 'content'],
    model: 'llama3.2:3b',
    template_body: `You are a social media specialist.

Turn the following content into a {platform} post:

Source content:
{content}

Requirements:
- Platform: {platform} (twitter/x, linkedin, instagram, etc.)
- Tone: {tone}
- Include {hashtag_count} relevant hashtags
- {cta}
- Character limit: {char_limit}

Provide:
1. The main post text
2. An optional hook/attention grabber (if different from main text)
3. Suggested image prompt (if visual content is typical for this platform)`,
  },
  {
    name: 'Bug Report Analyzer',
    description: 'Parse unstructured bug reports into standardized fields.',
    tags: ['engineering', 'bugs', 'qa'],
    model: 'llama3.2:3b',
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
    name: 'Interview Question Generator',
    description: 'Generate targeted interview questions for any role.',
    tags: ['hr', 'recruiting', 'interviews'],
    model: 'llama3.2:3b',
    template_body: `You are an experienced hiring manager.

Generate {count} interview questions for a {role} position at a {company_type} company.

Focus areas: {focus_areas}
Seniority level: {seniority}

Provide a mix of:
- Behavioral ("Tell me about a time...")
- Technical / role-specific
- Culture fit
- Situational ("What would you do if...")

For each question, briefly note what you're looking for in a strong answer.
Avoid generic questions like "What are your strengths?" unless specifically requested.`,
  },
  {
    name: 'Email Subject Line Optimizer',
    description: 'Generate multiple subject line variants from email body copy.',
    tags: ['marketing', 'email', 'copywriting'],
    model: 'llama3.2:3b',
    template_body: `You are an email marketing expert.

Given the following email content, generate {variant_count} subject line options:

Email content:
{email_body}

Target open rate benchmark: {benchmark}
Tone: {tone}

For each subject line, label it:
- [Curiosity] — piques interest without giving everything away
- [Direct] — clearly states the value
- [Urgency] — implies limited time or scarcity
- [Personal] — feels one-to-one

Keep each subject line under 60 characters.`,
  },
  {
    name: 'Feature Specification Draft',
    description: 'Turn informal feature ideas into structured PRD-style specs.',
    tags: ['product', 'specs', 'planning'],
    model: 'llama3.2:3b',
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
  {
    name: 'Data Table Formatter',
    description: 'Convert messy data into clean markdown or JSON tables.',
    tags: ['data', 'formatting', 'utility'],
    model: 'llama3.2:3b',
    template_body: `You are a data formatting assistant.

Reformat the following raw data into a clean {format} table:

Raw data:
{raw_data}

Column headers (if known): {headers}

Requirements:
- Align columns for readability
- Infer data types where possible
- Highlight any rows that seem malformed or incomplete
- If JSON: output valid JSON array of objects
- If Markdown: use proper pipe-delimited format with alignment hints

If the data is too ambiguous, ask clarifying questions instead of guessing.`,
  },
]

export { STARTER_PROMPTS }

/**
 * Seed a workspace with starter prompt templates.
 * Creates prompts, versions, and optionally interaction types/categories.
 */
export async function seedWorkspaceTemplates(workspaceId: string, prismaClient: any) {
  const results = {
    promptsCreated: 0,
    interactionTypesCreated: 0,
    errors: [] as string[],
  }

  // Ensure there is at least one interaction type
  let defaultInteractionType = await prismaClient.agentInteractionType.findFirst({
    where: { workspace_id: workspaceId },
  })

  if (!defaultInteractionType) {
    defaultInteractionType = await prismaClient.agentInteractionType.create({
      data: {
        name: 'General',
        description: 'General purpose prompts',
        emoji: '💡',
        workspace_id: workspaceId,
      },
    })
    results.interactionTypesCreated++
  }

  // Create a default category
  let defaultCategory = await prismaClient.promptCategory.findFirst({
    where: { workspace_id: workspaceId },
  })

  if (!defaultCategory) {
    defaultCategory = await prismaClient.promptCategory.create({
      data: {
        name: 'Templates',
        description: 'Starter prompt templates',
        workspace_id: workspaceId,
        agent_interaction_type_id: defaultInteractionType.id,
      },
    })
  }

  for (const template of STARTER_PROMPTS) {
    try {
      const existing = await prismaClient.prompt.findFirst({
        where: { workspace_id: workspaceId, name: template.name },
      })
      if (existing) continue

      const prompt = await prismaClient.prompt.create({
        data: {
          name: template.name,
          description: template.description,
          workspace_id: workspaceId,
          tags: template.tags as any,
          model: template.model,
          category_id: defaultCategory.id,
        },
      })

      await prismaClient.promptVersion.create({
        data: {
          prompt_id: prompt.id,
          version_number: 1,
          template_body: template.template_body,
          model_config: null,
          change_log: 'Created from template library',
        },
      })

      results.promptsCreated++
    } catch (err: any) {
      results.errors.push(`Failed to seed "${template.name}": ${err.message}`)
    }
  }

  return results
}
