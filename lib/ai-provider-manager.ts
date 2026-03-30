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
 * TODO: Implement after adding aiProviderSettings model to Prisma schema
 */
/*
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
*/

/**
 * Get all AI provider configs for a workspace
 * TODO: Implement after adding aiProviderSettings model to Prisma schema
 */
/*
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
*/

/**
 * All multi-provider database functions disabled - pending aiProviderSettings model
 * TODO: Implement after adding aiProviderSettings model to Prisma schema
 */


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
