import { NextRequest } from 'next/server'

jest.mock('@/lib/prisma', () => {
  const mockClient = {
    workspace: { findFirst: jest.fn() },
    prompt: { findMany: jest.fn(), count: jest.fn() },
    snippet: { findMany: jest.fn(), count: jest.fn() },
    promptCategory: { findMany: jest.fn() },
    user: { findUnique: jest.fn(), findFirst: jest.fn() },
    $transaction: jest.fn(),
  }
  return { __esModule: true, default: mockClient }
})

jest.mock('@/lib/jwt', () => ({
  verifyAccessToken: jest.fn(),
}))

import { GET as getModels } from '@/app/api/models/route'

describe('GET /api/models', () => {
  test('returns list of available models', async () => {
    const req = new NextRequest('http://localhost:3000/api/models')
    const res = await getModels(req)
    expect(res.status).toBe(200)

    const data = await res.json()
    expect(data.models).toBeDefined()
    expect(Array.isArray(data.models)).toBe(true)
    expect(data.models.length).toBeGreaterThan(0)
  })

  test('includes Ollama models with free pricing', async () => {
    const req = new NextRequest('http://localhost:3000/api/models')
    const res = await getModels(req)
    const data = await res.json()

    const ollamaModels = data.models.filter((m: any) => m.provider === 'ollama')
    expect(ollamaModels.length).toBeGreaterThan(0)
    ollamaModels.forEach((m: any) => {
      expect(m.inputPrice).toBe(0)
      expect(m.outputPrice).toBe(0)
    })
  })

  test('includes Anthropic models with paid pricing', async () => {
    const req = new NextRequest('http://localhost:3000/api/models')
    const res = await getModels(req)
    const data = await res.json()

    const anthropicModels = data.models.filter((m: any) => m.provider === 'anthropic')
    expect(anthropicModels.length).toBeGreaterThan(0)
    anthropicModels.forEach((m: any) => {
      expect(m.inputPrice).toBeGreaterThan(0)
      expect(m.outputPrice).toBeGreaterThan(0)
    })
  })

  test('each model has required fields', async () => {
    const req = new NextRequest('http://localhost:3000/api/models')
    const res = await getModels(req)
    const data = await res.json()

    data.models.forEach((m: any) => {
      expect(m).toHaveProperty('id')
      expect(m).toHaveProperty('name')
      expect(m).toHaveProperty('description')
      expect(m).toHaveProperty('inputPrice')
      expect(m).toHaveProperty('outputPrice')
      expect(m).toHaveProperty('maxTokens')
      expect(m).toHaveProperty('provider')
    })
  })
})