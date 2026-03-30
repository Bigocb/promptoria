/**
 * Database seed script
 * Run with: npm run db:seed
 * 
 * This creates mock data for testing PromptArchitect
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Create a workspace
  const workspace = await prisma.workspace.upsert({
    where: { slug: 'demo-workspace' },
    update: {},
    create: {
      name: 'Demo Workspace',
      slug: 'demo-workspace',
      userId: 'user_123', // Mock user ID
    },
  })

  console.log(`✓ Created workspace: ${workspace.name}`)

  // Create folders
  const snippetsFolder = await prisma.folder.upsert({
    where: { id: 'folder-snippets' },
    update: {},
    create: {
      id: 'folder-snippets',
      name: 'Snippets',
      description: 'Reusable text blocks',
      workspaceId: workspace.id,
    },
  })

  const promptsFolder = await prisma.folder.upsert({
    where: { id: 'folder-prompts' },
    update: {},
    create: {
      id: 'folder-prompts',
      name: 'Prompts',
      description: 'Main prompts',
      workspaceId: workspace.id,
    },
  })

  console.log(`✓ Created folders`)

  // Create snippets
  const brandVoiceSnippet = await prisma.snippet.upsert({
    where: { id: 'snippet-brand-voice' },
    update: {},
    create: {
      id: 'snippet-brand-voice',
      name: 'Brand Voice',
      description: 'Our brand tone and personality guidelines',
      content: `You are a friendly, professional, and engaging assistant. 
Your communication style is:
- Clear and concise
- Friendly but professional
- Solution-oriented
- Respectful and inclusive

Always maintain a tone that builds trust and confidence with the user.`,
      workspaceId: workspace.id,
      folderId: snippetsFolder.id,
      version: 1,
    },
  })

  const formatInstructionsSnippet = await prisma.snippet.upsert({
    where: { id: 'snippet-format' },
    update: {},
    create: {
      id: 'snippet-format',
      name: 'Format Instructions',
      description: 'Output formatting guidelines',
      content: `Format your response as follows:
- Use clear headings and sections
- Keep paragraphs short and digestible
- Use bullet points for lists
- Include examples when helpful
- Always end with a clear call-to-action`,
      workspaceId: workspace.id,
      folderId: snippetsFolder.id,
      version: 1,
    },
  })

  const seoSnippet = await prisma.snippet.upsert({
    where: { id: 'snippet-seo' },
    update: {},
    create: {
      id: 'snippet-seo',
      name: 'SEO Best Practices',
      description: 'Guidelines for SEO-optimized content',
      content: `When generating content:
- Include relevant keywords naturally (3-5 per 100 words)
- Write compelling meta descriptions (150-160 characters)
- Use H2 and H3 headers for structure
- Include internal linking opportunities
- Ensure content is scannable and well-organized`,
      workspaceId: workspace.id,
      folderId: snippetsFolder.id,
      version: 1,
    },
  })

  console.log(`✓ Created snippets`)

  // Create a Product Description prompt
  const productPrompt = await prisma.prompt.upsert({
    where: { id: 'prompt-product-desc' },
    update: {},
    create: {
      id: 'prompt-product-desc',
      name: 'Product Description Generator',
      description: 'Generates compelling e-commerce product descriptions',
      workspaceId: workspace.id,
      folderId: promptsFolder.id,
      model: 'gpt-4',
    },
  })

  // Create version 1 of Product Description
  const promptVersion1 = await prisma.promptVersion.upsert({
    where: { id: 'version-product-desc-v1' },
    update: {},
    create: {
      id: 'version-product-desc-v1',
      versionNumber: 1,
      promptId: productPrompt.id,
      template_body: `Your task is to write a compelling product description for an e-commerce listing.

Product: {{product_name}}
Category: {{product_category}}
Price: {{product_price}}

Create a description that is:
- Under 200 words
- Focused on benefits, not just features
- Optimized for search engines
- Includes a clear call-to-action`,
      model_config: {
        temperature: 0.7,
        max_tokens: 500,
        top_p: 0.9,
      },
      changeLog: 'Initial version',
      createdBy: 'system@promptarchitect.com',
      isActive: false,
    },
  })

  // Link snippets to version 1
  await prisma.promptComposition.upsert({
    where: { id: 'composition-1' },
    update: {},
    create: {
      id: 'composition-1',
      promptVersionId: promptVersion1.id,
      snippetId: brandVoiceSnippet.id,
      rank: 0,
    },
  })

  await prisma.promptComposition.upsert({
    where: { id: 'composition-2' },
    update: {},
    create: {
      id: 'composition-2',
      promptVersionId: promptVersion1.id,
      snippetId: seoSnippet.id,
      rank: 1,
    },
  })

  await prisma.promptComposition.upsert({
    where: { id: 'composition-3' },
    update: {},
    create: {
      id: 'composition-3',
      promptVersionId: promptVersion1.id,
      snippetId: formatInstructionsSnippet.id,
      rank: 2,
    },
  })

  console.log(`✓ Created prompt version 1 with snippets`)

  // Create version 2 with improvements
  const promptVersion2 = await prisma.promptVersion.upsert({
    where: { id: 'version-product-desc-v2' },
    update: {},
    create: {
      id: 'version-product-desc-v2',
      versionNumber: 2,
      promptId: productPrompt.id,
      template_body: `Your task is to write a compelling product description for an e-commerce listing.

**Product Information:**
- Name: {{product_name}}
- Category: {{product_category}}
- Price: {{product_price}}
- Target Audience: {{target_audience}}
- Key Features: {{key_features}}

**Requirements:**
- Length: 150-200 words
- Focus on benefits, not just features
- Include {{num_pain_points}} pain points the product solves
- Write for {{target_audience}}
- Optimize for search engines
- Include a compelling call-to-action
- Highlight what makes this product unique`,
      model_config: {
        temperature: 0.7,
        max_tokens: 600,
        top_p: 0.95,
      },
      changeLog: 'Enhanced with more variables and specific requirements for better control',
      createdBy: 'system@promptarchitect.com',
      isActive: true,
    },
  })

  // Link snippets to version 2
  await prisma.promptComposition.upsert({
    where: { id: 'composition-v2-1' },
    update: {},
    create: {
      id: 'composition-v2-1',
      promptVersionId: promptVersion2.id,
      snippetId: brandVoiceSnippet.id,
      rank: 0,
    },
  })

  await prisma.promptComposition.upsert({
    where: { id: 'composition-v2-2' },
    update: {},
    create: {
      id: 'composition-v2-2',
      promptVersionId: promptVersion2.id,
      snippetId: seoSnippet.id,
      rank: 1,
    },
  })

  await prisma.promptComposition.upsert({
    where: { id: 'composition-v2-3' },
    update: {},
    create: {
      id: 'composition-v2-3',
      promptVersionId: promptVersion2.id,
      snippetId: formatInstructionsSnippet.id,
      rank: 2,
    },
  })

  console.log(`✓ Created prompt version 2 (active)`)

  // Create a test run
  const testRun = await prisma.testRun.create({
    data: {
      promptVersionId: promptVersion2.id,
      promptId: productPrompt.id,
      workspaceId: workspace.id,
      variables: {
        product_name: 'Premium Wireless Headphones',
        product_category: 'Audio Equipment',
        product_price: '$199.99',
        target_audience: 'Music professionals and audiophiles',
        key_features: 'Noise cancellation, 40hr battery, premium sound quality',
        num_pain_points: '3',
      },
      compiledPrompt: `You are a friendly, professional, and engaging assistant...
      
Your task is to write a compelling product description for an e-commerce listing.

**Product Information:**
- Name: Premium Wireless Headphones
- Category: Audio Equipment
- Price: $199.99
- Target Audience: Music professionals and audiophiles
- Key Features: Noise cancellation, 40hr battery, premium sound quality

[... full compiled prompt]`,
      output: `Premium Wireless Headphones deliver studio-quality audio wherever you go. 
      
Engineered for professionals and audiophiles alike, these headphones feature advanced noise cancellation technology that blocks out 99% of ambient sound. With an impressive 40-hour battery life, you'll enjoy uninterrupted listening for days.

**Why Choose These Headphones?**
- Industry-leading noise cancellation for immersive listening
- Extended 40-hour battery keeps you powered through long sessions
- Premium sound signature captures every detail of your music
- Comfortable design for all-day wear
- Professional-grade build quality

Stop settling for average audio. Upgrade to premium sound today.`,
      model: 'gpt-4',
      inputTokens: 427,
      outputTokens: 156,
      totalTokens: 583,
      costUsd: (427 * 0.00003 + 156 * 0.00006), // GPT-4 pricing
      latencyMs: 2341,
      status: 'success',
    },
  })

  console.log(`✓ Created test run with output`)

  // Create another test run (failed example)
  await prisma.testRun.create({
    data: {
      promptVersionId: promptVersion1.id,
      promptId: productPrompt.id,
      workspaceId: workspace.id,
      variables: {
        product_name: 'Mechanical Keyboard',
        product_category: 'Computer Peripherals',
        product_price: '$149.99',
      },
      compiledPrompt: 'Incomplete test',
      status: 'error',
      errorMessage: 'Missing required variable: target_audience',
    },
  })

  console.log(`✓ Created failed test run example`)

  // Create a Social Media Copywriting prompt
  const socialPrompt = await prisma.prompt.upsert({
    where: { id: 'prompt-social' },
    update: {},
    create: {
      id: 'prompt-social',
      name: 'Social Media Copywriter',
      description: 'Creates engaging social media posts',
      workspaceId: workspace.id,
      folderId: promptsFolder.id,
      model: 'gpt-3.5-turbo',
    },
  })

  const socialVersion = await prisma.promptVersion.upsert({
    where: { id: 'version-social-v1' },
    update: {},
    create: {
      id: 'version-social-v1',
      versionNumber: 1,
      promptId: socialPrompt.id,
      template_body: `Write a {{platform}} post about {{topic}}.

Style: {{style}}
Length: {{length}} characters
Include hashtags: {{include_hashtags}}

Make it engaging and {{tone}}.`,
      model_config: {
        temperature: 0.9,
        max_tokens: 300,
        top_p: 1.0,
      },
      changeLog: 'Initial version',
      createdBy: 'system@promptarchitect.com',
      isActive: true,
    },
  })

  // Link brand voice snippet to social prompt
  await prisma.promptComposition.create({
    data: {
      promptVersionId: socialVersion.id,
      snippetId: brandVoiceSnippet.id,
      rank: 0,
    },
  })

  console.log(`✓ Created social media prompt`)

  console.log('✨ Database seeding complete!')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error('❌ Seeding failed:', e)
    await prisma.$disconnect()
    process.exit(1)
  })
