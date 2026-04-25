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

const mockModels = [
  {
    name: 'llama3:8b',
    model: 'llama3:8b',
    details: {
      family: 'llama',
      parameter_size: '8B',
      quantization_level: 'Q4_0',
    },
  },
  {
    name: 'mistral:7b',
    model: 'mistral:7b',
    details: {
      family: 'mistral',
      parameter_size: '7B',
      quantization_level: 'Q4_0',
    },
  },
  {
    name: 'gemma:2b',
    model: 'gemma:2b',
    details: {
      family: 'gemma',
      parameter_size: '2B',
      quantization_level: 'Q4_0',
    },
  },
]

beforeEach(() => {
  jest.clearAllMocks()
  ;(global.fetch as jest.Mock) = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ models: mockModels }),
  })
})

import { GET as getModels } from '@/app/api/models/route'

describe('GET /api/models', () => {
  test('returns list of available models', async () => {
    const req = new NextRequest('http://localhost:3000/api/models')
    const res = await getModels(req)
    expect(res.status).toBe(200)

    const data = await res.json()
    expect(data.models).toBeDefined()
    expect(Array.isArray(data.models)).toBe(true)
    expect(data.models.length).toBe(3)
  })

  test('each model has required fields', async () => {
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
    })
  })

  test('models include family-inferred metadata', async () => {
    const req = new NextRequest('http://localhost:3000/api/models')
    const res = await getModels(req)
    const data = await res.json()

    const llama = data.models.find((m: any) => m.id === 'llama3:8b')
    expect(llama.family).toBe('llama')
    expect(llama.parameter_size).toBe('8B')
    expect(llama.quantization_level).toBe('Q4_0')
  })

  test('returns empty models with error when Ollama is unreachable', async () => {
    ;(global.fetch as jest.Mock) = jest.fn().mockRejectedValue(new Error('ECONNREFUSED'))

    const req = new NextRequest('http://localhost:3000/api/models')
    const res = await getModels(req)
    const data = await res.json()

    expect(data.models).toEqual([])
    expect(data.error).toBeDefined()
  })

  test('returns empty models with error when Ollama responds non-OK', async () => {
    ;(global.fetch as jest.Mock) = jest.fn().mockResolvedValue({
      ok: false,
      status: 503,
      json: async () => ({}),
    })

    const req = new NextRequest('http://localhost:3000/api/models')
    const res = await getModels(req)
    const data = await res.json()

    expect(data.models).toEqual([])
    expect(data.error).toBeDefined()
  })
})