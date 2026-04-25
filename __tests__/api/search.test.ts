import { NextRequest } from 'next/server'

jest.mock('@/lib/prisma', () => {
  const mockClient = {
    user: { findUnique: jest.fn(), findFirst: jest.fn() },
    workspace: { findFirst: jest.fn() },
    prompt: { findMany: jest.fn() },
    snippet: { findMany: jest.fn() },
    promptCategory: { findMany: jest.fn() },
    $transaction: jest.fn(),
  }
  return { __esModule: true, default: mockClient }
})

jest.mock('@/lib/jwt', () => ({
  verifyAccessToken: jest.fn(),
}))

import { GET as searchHandler } from '@/app/api/search/route'

const authHeaders = { Authorization: 'Bearer valid_token' }
const mockWorkspace = { id: 'ws1', user_id: 'user123' }

describe('GET /api/search', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    const { verifyAccessToken } = require('@/lib/jwt')
    verifyAccessToken.mockReturnValue({ userId: 'user123' })
  })

  test('returns 401 without auth', async () => {
    const req = new NextRequest('http://localhost:3000/api/search?q=test')
    const res = await searchHandler(req)
    expect(res.status).toBe(401)
  })

  test('returns 404 if workspace not found', async () => {
    const prisma = require('@/lib/prisma').default
    prisma.workspace.findFirst.mockResolvedValueOnce(null)

    const req = new NextRequest('http://localhost:3000/api/search?q=test', { headers: authHeaders })
    const res = await searchHandler(req)
    expect(res.status).toBe(404)
  })

  test('searches across prompts, snippets, and categories by default', async () => {
    const prisma = require('@/lib/prisma').default
    prisma.workspace.findFirst.mockResolvedValueOnce(mockWorkspace)
    prisma.prompt.findMany.mockResolvedValueOnce([{ id: 'p1', name: 'Hello Prompt' }])
    prisma.snippet.findMany.mockResolvedValueOnce([{ id: 's1', name: 'Hello Snippet' }])
    prisma.promptCategory.findMany.mockResolvedValueOnce([])

    const req = new NextRequest('http://localhost:3000/api/search?q=hello', { headers: authHeaders })
    const res = await searchHandler(req)
    expect(res.status).toBe(200)

    const data = await res.json()
    expect(data.results.prompts).toBeDefined()
    expect(data.results.snippets).toBeDefined()
    expect(data.results.categories).toBeDefined()
    expect(data.query).toBe('hello')
  })

  test('can search only prompts', async () => {
    const prisma = require('@/lib/prisma').default
    prisma.workspace.findFirst.mockResolvedValueOnce(mockWorkspace)
    prisma.prompt.findMany.mockResolvedValueOnce([{ id: 'p1', name: 'Test Prompt' }])

    const req = new NextRequest('http://localhost:3000/api/search?q=test&type=prompts', { headers: authHeaders })
    const res = await searchHandler(req)
    expect(res.status).toBe(200)

    const data = await res.json()
    expect(data.results.prompts).toBeDefined()
    expect(data.results.snippets).toBeUndefined()

    expect(prisma.prompt.findMany).toHaveBeenCalled()
  })

  test('returns empty results when nothing matches', async () => {
    const prisma = require('@/lib/prisma').default
    prisma.workspace.findFirst.mockResolvedValueOnce(mockWorkspace)
    prisma.prompt.findMany.mockResolvedValueOnce([])
    prisma.snippet.findMany.mockResolvedValueOnce([])
    prisma.promptCategory.findMany.mockResolvedValueOnce([])

    const req = new NextRequest('http://localhost:3000/api/search?q=nonexistent', { headers: authHeaders })
    const res = await searchHandler(req)
    const data = await res.json()

    expect(data.results.prompts).toHaveLength(0)
    expect(data.results.snippets).toHaveLength(0)
  })

  test('handles database errors gracefully', async () => {
    const prisma = require('@/lib/prisma').default
    prisma.workspace.findFirst.mockRejectedValueOnce(new Error('DB down'))

    const req = new NextRequest('http://localhost:3000/api/search?q=test', { headers: authHeaders })
    const res = await searchHandler(req)
    expect(res.status).toBe(500)
  })
})