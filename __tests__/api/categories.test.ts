import { NextRequest } from 'next/server'

jest.mock('@/lib/prisma', () => {
  const mockClient = {
    workspace: { findFirst: jest.fn() },
    promptCategory: { findMany: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn() },
    agentInteractionType: { findMany: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn() },
    prompt: { findMany: jest.fn() },
    syncLog: { create: jest.fn() },
  }
  return { __esModule: true, default: mockClient }
})

jest.mock('@/lib/jwt', () => ({
  verifyAccessToken: jest.fn(),
}))

import { GET as listCategories, POST as createCategory } from '@/app/api/categories/route'
import { GET as listInteractions, POST as createInteraction } from '@/app/api/categories/interactions/route'

const authHeaders = { Authorization: 'Bearer valid_token' }
const mockWorkspace = { id: 'ws1', user_id: 'user123', name: 'Test' }

describe('GET /api/categories', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    const { verifyAccessToken } = require('@/lib/jwt')
    verifyAccessToken.mockReturnValue({ userId: 'user123' })
  })

  test('returns 401 without auth', async () => {
    const req = new NextRequest('http://localhost:3000/api/categories')
    const res = await listCategories(req)
    expect(res.status).toBe(401)
  })

  test('returns categories list', async () => {
    const prisma = require('@/lib/prisma').default
    prisma.workspace.findFirst.mockResolvedValueOnce(mockWorkspace)
    prisma.promptCategory.findMany.mockResolvedValueOnce([
      { id: 'cat1', name: 'Writing', agent_interaction_type_id: 'it1' },
      { id: 'cat2', name: 'Coding', agent_interaction_type_id: 'it1' },
    ])
    const req = new NextRequest('http://localhost:3000/api/categories', { headers: authHeaders })
    const res = await listCategories(req)
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.categories).toHaveLength(2)
    expect(data.categories[0].name).toBe('Writing')
  })

  test('returns empty array when no categories', async () => {
    const prisma = require('@/lib/prisma').default
    prisma.workspace.findFirst.mockResolvedValueOnce(mockWorkspace)
    prisma.promptCategory.findMany.mockResolvedValueOnce([])
    const req = new NextRequest('http://localhost:3000/api/categories', { headers: authHeaders })
    const res = await listCategories(req)
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.categories).toHaveLength(0)
  })
})

describe('GET /api/categories/interactions', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    const { verifyAccessToken } = require('@/lib/jwt')
    verifyAccessToken.mockReturnValue({ userId: 'user123' })
  })

  test('returns 401 without auth', async () => {
    const req = new NextRequest('http://localhost:3000/api/categories/interactions')
    const res = await listInteractions(req)
    expect(res.status).toBe(401)
  })

  test('returns interaction types list', async () => {
    const prisma = require('@/lib/prisma').default
    prisma.workspace.findFirst.mockResolvedValueOnce(mockWorkspace)
    prisma.agentInteractionType.findMany.mockResolvedValueOnce([
      { id: 'it1', name: 'Chat', emoji: '💬', workspace_id: 'ws1', categories: [] },
      { id: 'it2', name: 'Code', emoji: '💻', workspace_id: 'ws1', categories: [] },
    ])
    prisma.prompt.findMany.mockResolvedValueOnce([])
    const req = new NextRequest('http://localhost:3000/api/categories/interactions', { headers: authHeaders })
    const res = await listInteractions(req)
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.interactions).toHaveLength(2)
    expect(data.interactions[0].name).toBe('Chat')
  })
})