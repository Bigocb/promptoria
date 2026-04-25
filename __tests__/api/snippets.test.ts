import { NextRequest } from 'next/server'

jest.mock('@/lib/prisma', () => {
  const mockClient = {
    user: { findUnique: jest.fn(), findFirst: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn() },
    userSettings: { findUnique: jest.fn(), create: jest.fn(), update: jest.fn() },
    workspace: { findUnique: jest.fn(), findFirst: jest.fn(), create: jest.fn() },
    prompt: { findUnique: jest.fn(), findFirst: jest.fn(), findMany: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn(), count: jest.fn() },
    snippet: { findUnique: jest.fn(), findFirst: jest.fn(), findMany: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn(), count: jest.fn() },
    syncLog: { findMany: jest.fn(), create: jest.fn() },
    device: { findUnique: jest.fn(), create: jest.fn(), update: jest.fn() },
    $transaction: jest.fn(),
  }
  return { __esModule: true, default: mockClient }
})

jest.mock('@/lib/jwt', () => ({
  verifyAccessToken: jest.fn(),
}))

import { POST as createSnippet, GET as listSnippets } from '@/app/api/snippets/route'

const authHeaders = { Authorization: 'Bearer valid_token' }
const mockWorkspace = { id: 'ws1', user_id: 'user123', name: 'Test', slug: 'test' }

describe('POST /api/snippets', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    const { verifyAccessToken } = require('@/lib/jwt')
    verifyAccessToken.mockReturnValue({ userId: 'user123' })
  })

  test('returns 401 without auth', async () => {
    const req = new NextRequest('http://localhost:3000/api/snippets', {
      method: 'POST',
      body: JSON.stringify({ name: 'Test', content: 'Hello' }),
    })
    const res = await createSnippet(req)
    expect(res.status).toBe(401)
  })

  test('returns 401 with invalid token', async () => {
    const { verifyAccessToken } = require('@/lib/jwt')
    verifyAccessToken.mockImplementation(() => { throw new Error('Invalid') })

    const req = new NextRequest('http://localhost:3000/api/snippets', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ name: 'Test', content: 'Hello' }),
    })
    const res = await createSnippet(req)
    expect(res.status).toBe(401)
  })

  test('returns 404 if workspace not found', async () => {
    const prisma = require('@/lib/prisma').default
    prisma.workspace.findFirst.mockResolvedValueOnce(null)

    const req = new NextRequest('http://localhost:3000/api/snippets', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ name: 'Test', content: 'Hello' }),
    })
    const res = await createSnippet(req)
    expect(res.status).toBe(404)
  })

  test('returns 400 if name is missing', async () => {
    const prisma = require('@/lib/prisma').default
    prisma.workspace.findFirst.mockResolvedValueOnce(mockWorkspace)

    const req = new NextRequest('http://localhost:3000/api/snippets', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ content: 'Hello' }),
    })
    const res = await createSnippet(req)
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toContain('name and content are required')
  })

  test('returns 400 if content is missing', async () => {
    const prisma = require('@/lib/prisma').default
    prisma.workspace.findFirst.mockResolvedValueOnce(mockWorkspace)

    const req = new NextRequest('http://localhost:3000/api/snippets', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ name: 'Test' }),
    })
    const res = await createSnippet(req)
    expect(res.status).toBe(400)
  })

  test('creates snippet and returns 201', async () => {
    const prisma = require('@/lib/prisma').default
    prisma.workspace.findFirst.mockResolvedValueOnce(mockWorkspace)

    const createdSnippet = {
      id: 's1',
      name: 'Brand Voice',
      description: 'Company tone',
      content: 'You are a friendly assistant.',
      workspace_id: 'ws1',
      created_at: new Date('2026-04-20T10:00:00Z'),
      updated_at: new Date('2026-04-20T10:00:00Z'),
    }
    prisma.snippet.create.mockResolvedValueOnce(createdSnippet)
    prisma.syncLog.create.mockResolvedValueOnce({})

    const req = new NextRequest('http://localhost:3000/api/snippets', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ name: 'Brand Voice', content: 'You are a friendly assistant.', description: 'Company tone' }),
    })
    const res = await createSnippet(req)
    expect(res.status).toBe(201)

    const data = await res.json()
    expect(data.name).toBe('Brand Voice')
    expect(data.id).toBe('s1')

    expect(prisma.snippet.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          name: 'Brand Voice',
          content: 'You are a friendly assistant.',
          workspace_id: 'ws1',
        }),
      })
    )
    expect(prisma.syncLog.create).toHaveBeenCalled()
  })

  test('handles database errors', async () => {
    const prisma = require('@/lib/prisma').default
    prisma.workspace.findFirst.mockResolvedValueOnce(mockWorkspace)
    prisma.snippet.create.mockRejectedValueOnce(new Error('DB error'))

    const req = new NextRequest('http://localhost:3000/api/snippets', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ name: 'Test', content: 'Hello' }),
    })
    const res = await createSnippet(req)
    expect(res.status).toBe(500)
  })
})

describe('GET /api/snippets', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    const { verifyAccessToken } = require('@/lib/jwt')
    verifyAccessToken.mockReturnValue({ userId: 'user123' })
  })

  test('returns 401 without auth', async () => {
    const req = new NextRequest('http://localhost:3000/api/snippets')
    const res = await listSnippets(req)
    expect(res.status).toBe(401)
  })

  test('returns 404 if workspace not found', async () => {
    const prisma = require('@/lib/prisma').default
    prisma.workspace.findFirst.mockResolvedValueOnce(null)

    const req = new NextRequest('http://localhost:3000/api/snippets', { headers: authHeaders })
    const res = await listSnippets(req)
    expect(res.status).toBe(404)
  })

  test('returns snippets list with pagination', async () => {
    const prisma = require('@/lib/prisma').default
    prisma.workspace.findFirst.mockResolvedValueOnce(mockWorkspace)
    prisma.snippet.count.mockResolvedValueOnce(1)
    prisma.snippet.findMany.mockResolvedValueOnce([
      { id: 's1', name: 'Brand Voice', description: null, content: 'Be friendly.', workspace_id: 'ws1', created_at: new Date(), updated_at: new Date() },
    ])

    const req = new NextRequest('http://localhost:3000/api/snippets', { headers: authHeaders })
    const res = await listSnippets(req)
    expect(res.status).toBe(200)

    const data = await res.json()
    expect(data.snippets).toHaveLength(1)
    expect(data.pagination).toBeDefined()
    expect(data.pagination.total).toBe(1)
  })

  test('returns empty array for workspace with no snippets', async () => {
    const prisma = require('@/lib/prisma').default
    prisma.workspace.findFirst.mockResolvedValueOnce(mockWorkspace)
    prisma.snippet.count.mockResolvedValueOnce(0)
    prisma.snippet.findMany.mockResolvedValueOnce([])

    const req = new NextRequest('http://localhost:3000/api/snippets', { headers: authHeaders })
    const res = await listSnippets(req)
    const data = await res.json()

    expect(data.snippets).toEqual([])
    expect(data.pagination.total).toBe(0)
  })
})