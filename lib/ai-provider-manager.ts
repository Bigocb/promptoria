/**
 * AI Provider Configuration System
 * 
 * Enables flexible switching between multiple LLM providers:
 * - OpenAI (GPT-4, GPT-3.5-turbo)
 * - Anthropic (Claude 3 Opus, Sonnet, Haiku)
 * - Cohere (coming soon)
 * - Azure OpenAI (coming soon)
 * - Local models via Ollama (coming soon)
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// ============================================================================
// TYPES
// ============================================================================

export type AIProvider = 'openai' | 'anthropic' | 'cohere' | 'azure' | 'ollama' | 'custom'

export interface ModelConfig {
  provider: AIProvider
  model: string
  apiKey?: string // Stored encrypted
  baseUrl?: string // For custom endpoints
  temperature: number
  max_tokens: number
  top_p: number
  frequency_penalty?: number
  presence_penalty?: number
  custom_params?: Record<string, any>
}

export interface AIProviderSettings {
  id: string
  workspace_id: string
  provider: AIProvider
  is_default: boolean
  name: string // e.g., "Production OpenAI"
  description?: string
  
  // API Configuration
  api_key_encrypted: string // Never store plaintext
  base_url?: string
  
  // Default model settings
  default_model: string
  default_temperature: number
  default_max_tokens: number
  default_top_p: number
  
  // Feature flags
  is_enabled: boolean
  is_public: boolean // Team can use?
  
  // Usage tracking
  total_tokens_used: number
  total_cost: number
  request_count: number
  error_count: number
  
  // Metadata
  created_at: Date
  updated_at: Date
  tested_at?: Date // Last successful test
}

// ============================================================================
// DATABASE SCHEMA (Add to prisma/schema.prisma)
// ============================================================================

/**
model AIProviderSettings {
  id                    String   @id @default(cuid())
  workspace_id          String
  provider              String   // openai | anthropic | cohere | azure | ollama | custom
  is_default            Boolean  @default(false)
  name                  String   // "My OpenAI Config", "Claude Production", etc.
  description           String?
  
  // Encrypted API key
  api_key_encrypted     String
  base_url              String?  // For custom endpoints
  
  // Default model settings
  default_model         String   // "gpt-4", "claude-3-opus", etc.
  default_temperature   Float    @default(0.7)
  default_max_tokens    Int      @default(2000)
  default_top_p         Float    @default(0.9)
  
  // Custom parameters (JSON)
  custom_params         Json?    // Provider-specific settings
  
  // Status
  is_enabled            Boolean  @default(true)
  is_public             Boolean  @default(false)
  
  // Usage tracking
  total_tokens_used     Int      @default(0)
  total_cost            Float    @default(0)
  request_count         Int      @default(0)
  error_count           Int      @default(0)
  
  // Timestamps
  created_at            DateTime @default(now())
  updated_at            DateTime @updatedAt
  tested_at             DateTime?
  
  // Relations
  workspace             Workspace @relation(fields: [workspace_id], references: [id], onDelete: Cascade)
  
  @@index([workspace_id])
  @@index([provider])
  @@unique([workspace_id, name])
}

model PromptModelOverride {
  id                    String   @id @default(cuid())
  prompt_version_id     String
  ai_provider_id        String   // Override which provider to use
  
  created_at            DateTime @default(now())
  
  @@index([prompt_version_id])
  @@unique([prompt_version_id])
}
*/

// ============================================================================
// SUPPORTED MODELS
// ============================================================================

export const SUPPORTED_MODELS = {
  openai: {
    name: 'OpenAI',
    models: [
      { id: 'gpt-4', name: 'GPT-4 (Latest)', maxTokens: 8192, costPerMTok: { input: 0.00003, output: 0.00006 } },
      { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', maxTokens: 128000, costPerMTok: { input: 0.00001, output: 0.00003 } },
      { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', maxTokens: 4096, costPerMTok: { input: 0.0005, output: 0.0015 } },
    ],
    requiresApiKey: true,
    apiEndpoint: 'https://api.openai.com/v1',
  },
  anthropic: {
    name: 'Anthropic (Claude)',
    models: [
      { id: 'claude-3-opus', name: 'Claude 3 Opus (Most Capable)', maxTokens: 200000, costPerMTok: { input: 0.000015, output: 0.00075 } },
      { id: 'claude-3-sonnet', name: 'Claude 3 Sonnet (Balanced)', maxTokens: 200000, costPerMTok: { input: 0.000003, output: 0.00015 } },
      { id: 'claude-3-haiku', name: 'Claude 3 Haiku (Fast & Cheap)', maxTokens: 200000, costPerMTok: { input: 0.00000025, output: 0.00000125 } },
    ],
    requiresApiKey: true,
    apiEndpoint: 'https://api.anthropic.com/v1',
  },
  cohere: {
    name: 'Cohere',
    models: [
      { id: 'command', name: 'Command (General Purpose)', maxTokens: 4096, costPerMTok: { input: 0.000001, output: 0.000001 } },
      { id: 'command-light', name: 'Command Light (Fast)', maxTokens: 4096, costPerMTok: { input: 0.0000003, output: 0.0000006 } },
    ],
    requiresApiKey: true,
    apiEndpoint: 'https://api.cohere.ai/v1',
  },
  azure: {
    name: 'Azure OpenAI',
    models: [
      { id: 'gpt-4', name: 'GPT-4', maxTokens: 8192, costPerMTok: { input: 0.00003, output: 0.00006 } },
      { id: 'gpt-35-turbo', name: 'GPT-3.5 Turbo', maxTokens: 4096, costPerMTok: { input: 0.0005, output: 0.0015 } },
    ],
    requiresApiKey: true,
    apiEndpoint: 'https://{resource}.openai.azure.com',
  },
  ollama: {
    name: 'Ollama (Local)',
    models: [
      { id: 'llama2', name: 'Llama 2', maxTokens: 4096, costPerMTok: { input: 0, output: 0 } },
      { id: 'mistral', name: 'Mistral', maxTokens: 4096, costPerMTok: { input: 0, output: 0 } },
      { id: 'neural-chat', name: 'Neural Chat', maxTokens: 4096, costPerMTok: { input: 0, output: 0 } },
    ],
    requiresApiKey: false,
    apiEndpoint: 'http://localhost:11434',
  },
}

// ============================================================================
// API FUNCTIONS
// ============================================================================

/**
 * Create a new AI provider configuration
 */
export async function createAIProviderConfig(data: {
  workspace_id: string
  provider: AIProvider
  name: string
  description?: string
  api_key?: string
  base_url?: string
  default_model: string
  default_temperature?: number
  default_max_tokens?: number
  default_top_p?: number
  is_default?: boolean
  is_public?: boolean
}) {
  try {
    if (!data.provider || !data.name || !data.default_model) {
      throw new Error('Missing required fields: provider, name, default_model')
    }

    // Encrypt API key (TODO: implement proper encryption)
    const encryptedKey = data.api_key ? Buffer.from(data.api_key).toString('base64') : ''

    const config = await prisma.aiProviderSettings?.create({
      data: {
        workspace_id: data.workspace_id,
        provider: data.provider,
        name: data.name,
        description: data.description,
        api_key_encrypted: encryptedKey,
        base_url: data.base_url,
        default_model: data.default_model,
        default_temperature: data.default_temperature || 0.7,
        default_max_tokens: data.default_max_tokens || 2000,
        default_top_p: data.default_top_p || 0.9,
        is_default: data.is_default || false,
        is_public: data.is_public || false,
      },
    })

    return config
  } catch (error) {
    throw new Error(`Failed to create AI provider config: ${error instanceof Error ? error.message : String(error)}`)
  }
}

/**
 * Get all AI provider configs for a workspace
 */
export async function getAIProviderConfigs(workspaceId: string) {
  try {
    const configs = await prisma.aiProviderSettings?.findMany({
      where: {
        workspace_id: workspaceId,
        is_enabled: true,
      },
      orderBy: { is_default: 'desc' },
    })

    return configs || []
  } catch (error) {
    throw new Error(`Failed to fetch AI provider configs: ${error instanceof Error ? error.message : String(error)}`)
  }
}

/**
 * Get default AI provider for workspace
 */
export async function getDefaultAIProvider(workspaceId: string) {
  try {
    const config = await prisma.aiProviderSettings?.findFirst({
      where: {
        workspace_id: workspaceId,
        is_default: true,
        is_enabled: true,
      },
    })

    if (!config) {
      throw new Error('No default AI provider configured')
    }

    return config
  } catch (error) {
    throw new Error(`Failed to get default AI provider: ${error instanceof Error ? error.message : String(error)}`)
  }
}

/**
 * Set default AI provider
 */
export async function setDefaultAIProvider(workspaceId: string, configId: string) {
  try {
    // Clear current default
    await prisma.aiProviderSettings?.updateMany({
      where: { workspace_id: workspaceId },
      data: { is_default: false },
    })

    // Set new default
    const updated = await prisma.aiProviderSettings?.update({
      where: { id: configId },
      data: { is_default: true },
    })

    return updated
  } catch (error) {
    throw new Error(`Failed to set default AI provider: ${error instanceof Error ? error.message : String(error)}`)
  }
}

/**
 * Update AI provider config
 */
export async function updateAIProviderConfig(
  configId: string,
  updates: {
    name?: string
    description?: string
    default_model?: string
    default_temperature?: number
    default_max_tokens?: number
    default_top_p?: number
    is_enabled?: boolean
    is_public?: boolean
  }
) {
  try {
    const updated = await prisma.aiProviderSettings?.update({
      where: { id: configId },
      data: {
        ...updates,
        updated_at: new Date(),
      },
    })

    return updated
  } catch (error) {
    throw new Error(`Failed to update AI provider config: ${error instanceof Error ? error.message : String(error)}`)
  }
}

/**
 * Test AI provider connection
 */
export async function testAIProviderConnection(configId: string) {
  try {
    const config = await prisma.aiProviderSettings?.findUnique({
      where: { id: configId },
    })

    if (!config) {
      throw new Error('Configuration not found')
    }

    // Decrypt API key
    const apiKey = Buffer.from(config.api_key_encrypted, 'base64').toString('utf-8')

    // Test based on provider
    let response
    switch (config.provider) {
      case 'openai':
        response = await testOpenAI(apiKey, config.default_model)
        break
      case 'anthropic':
        response = await testAnthropic(apiKey, config.default_model)
        break
      case 'ollama':
        response = await testOllama(config.base_url || 'http://localhost:11434')
        break
      default:
        throw new Error(`Testing not implemented for provider: ${config.provider}`)
    }

    // Update tested_at
    await prisma.aiProviderSettings?.update({
      where: { id: configId },
      data: { tested_at: new Date() },
    })

    return { success: true, message: response }
  } catch (error) {
    throw new Error(`Failed to test AI provider: ${error instanceof Error ? error.message : String(error)}`)
  }
}

/**
 * Test OpenAI connection
 */
async function testOpenAI(apiKey: string, model: string) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: 'Say "Test successful" only' }],
      max_tokens: 10,
    }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(`OpenAI error: ${error.error?.message || 'Unknown error'}`)
  }

  return 'OpenAI connection successful'
}

/**
 * Test Anthropic connection
 */
async function testAnthropic(apiKey: string, model: string) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      max_tokens: 10,
      messages: [{ role: 'user', content: 'Say "Test successful" only' }],
    }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(`Anthropic error: ${error.error?.message || 'Unknown error'}`)
  }

  return 'Anthropic connection successful'
}

/**
 * Test Ollama connection
 */
async function testOllama(baseUrl: string) {
  const response = await fetch(`${baseUrl}/api/tags`)

  if (!response.ok) {
    throw new Error('Ollama connection failed')
  }

  const data = await response.json()
  const modelCount = data.models?.length || 0

  return `Ollama connection successful (${modelCount} models available)`
}

/**
 * Record provider usage
 */
export async function recordProviderUsage(
  configId: string,
  stats: {
    tokens: number
    cost: number
    success: boolean
  }
) {
  try {
    const updated = await prisma.aiProviderSettings?.update({
      where: { id: configId },
      data: {
        total_tokens_used: { increment: stats.tokens },
        total_cost: { increment: stats.cost },
        request_count: { increment: 1 },
        error_count: { increment: stats.success ? 0 : 1 },
      },
    })

    return updated
  } catch (error) {
    throw new Error(`Failed to record usage: ${error instanceof Error ? error.message : String(error)}`)
  }
}

/**
 * Delete AI provider config
 */
export async function deleteAIProviderConfig(configId: string) {
  try {
    await prisma.aiProviderSettings?.delete({
      where: { id: configId },
    })

    return { success: true }
  } catch (error) {
    throw new Error(`Failed to delete AI provider config: ${error instanceof Error ? error.message : String(error)}`)
  }
}

/**
 * Get pricing information for a model
 */
export function getModelPricing(provider: AIProvider, model: string) {
  const providerData = SUPPORTED_MODELS[provider as keyof typeof SUPPORTED_MODELS]
  if (!providerData) {
    return null
  }

  const modelData = providerData.models.find((m) => m.id === model)
  return modelData?.costPerMTok || null
}

/**
 * Calculate cost for a request
 */
export function calculateCost(provider: AIProvider, model: string, inputTokens: number, outputTokens: number) {
  const pricing = getModelPricing(provider, model)
  if (!pricing) {
    return null
  }

  const inputCost = (inputTokens / 1000000) * pricing.input
  const outputCost = (outputTokens / 1000000) * pricing.output

  return inputCost + outputCost
}
