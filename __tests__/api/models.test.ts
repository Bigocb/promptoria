import { NextRequest } from 'next/server'

const mockModelPresets = [
  {
    id: 'preset-1',
    ollama_id: 'llama3:8b',
    display_name: 'Llama 3 (8B)',
    family: 'llama',
    parameter_size: '8B',
    description: 'Meta Llama',
    context_window: '128K',
    max_tokens: 4096,
    is_active: true,
    tier_required: 'free',
    cost_estimate: 'medium',
    is_byok: false,
    sort_order: 1,
    created_at: new Date(),
    updated_at: new Date(),
  },
  {
    id: 'preset-2',
    ollama_id: 'mistral:7b',
    display_name: 'Mistral 7B',
    family: 'mistral',
    parameter_size: '7B',
    description: 'Mistral model',
    context_window: '32K',
    max_tokens: 8000,
    is_active: true,
    tier_required: 'pro',
    cost_estimate: 'medium',
    is_byok: false,
    sort_order: 2,
    created_at: new Date(),
    updated_at: new Date(),
  },
  {
    id: 'preset-3',
    ollama_id: 'gemma:2b',
    display_name: 'Gemma 2B',
    family: 'gemma',
    parameter_size: '2B',
    description: 'Google Gemma',
    context_window: '8K',
    max_tokens: 2048,
    is_active: true,
    tier_required: 'free',
    cost_estimate: 'cheap',
    is_byok: false,
    sort_order: 3,
    created_at: new Date(),
    updated_at: new Date(),
  },
]

jest.mock('@/lib/prisma', () => {
  const mockClient = {
    workspace: { findFirst: jest.fn() },
    prompt: { findMany: jest.fn(), count: jest.fn() },
    snippet: { findMany: jest.fn(), count: jest.fn() },
    promptCategory: { findMany: jest.fn() },
    user: { findUnique: jest.fn(), findFirst: jest.fn() },
    modelPreset: { findMany: jest.fn() },
    $transaction: jest.fn(),
  }
  return { __esModule: true, default: mockClient }
})

jest.mock('@/lib/jwt', () => ({
  verifyAccessToken: jest.fn(),
}))

import prisma from '@/lib/prisma'
import { GET as getModels } from '@/app/api/models/route'

beforeEach(() => {
  jest.clearAllMocks()
})

describe('GET /api/models', () => {
  test('returns list of active models for free tier', async () => {
    ;(prisma.modelPreset.findMany as jest.Mock).mockResolvedValue([mockModelPresets[0], mockModelPresets[2]])
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(null)

    const req = new NextRequest('http://localhost:3000/api/models')
    const res = await getModels(req)
    expect(res.status).toBe(200)

    const data = await res.json()
    expect(data.models).toBeDefined()
    expect(Array.isArray(data.models)).toBe(true)
    expect(data.models.length).toBe(2)
    expect(data.user_tier).toBe('free')
  })

  test('pro tier user sees pro models too', async () => {
    const { verifyAccessToken } = require('@/lib/jwt')
    verifyAccessToken.mockReturnValue({ userId: 'user-pro-123', email: 'test@example.com' })

    ;(prisma.modelPreset.findMany as jest.Mock).mockResolvedValue(mockModelPresets)
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({ subscription_tier: 'pro' })

    const req = new NextRequest('http://localhost:3000/api/models', {
      headers: { Authorization: 'Bearer valid-token' },
    })
    const res = await getModels(req)
    const data = await res.json()

    expect(data.models.length).toBe(3)
    expect(data.user_tier).toBe('pro')
  })

  test('each model has required fields', async () => {
    ;(prisma.modelPreset.findMany as jest.Mock).mockResolvedValue([mockModelPresets[0]])
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(null)

    const req = new NextRequest('http://localhost:3000/api/models')
    const res = await getModels(req)
    const data = await res.json()

    data.models.forEach((m: any) => {
      expect(m).toHaveProperty('id')
      expect(m).toHaveProperty('name')
      expect(m).toHaveProperty('description')
      expect(m).toHaveProperty('family')
      expect(m).toHaveProperty('contextWindow')
      expect(m).toHaveProperty('maxTokens')
      expect(m).toHaveProperty('tier_required')
    })
  })

  test('returns empty models with error on database failure', async () => {
    ;(prisma.modelPreset.findMany as jest.Mock).mockRejectedValue(new Error('DB down'))

    const req = new NextRequest('http://localhost:3000/api/models')
    const res = await getModels(req)
    const data = await res.json()

    expect(data.models).toEqual([])
    expect(data.error).toBeDefined()
  })
})