import { NextRequest } from 'next/server'

jest.mock('@/lib/prisma', () => {
  const mockClient = {
    user: { findUnique: jest.fn(), findFirst: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn() },
    userSettings: { findUnique: jest.fn(), create: jest.fn(), update: jest.fn() },
    workspace: { findUnique: jest.fn(), findFirst: jest.fn(), create: jest.fn() },
    prompt: { findUnique: jest.fn(), findFirst: jest.fn(), findMany: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn(), count: jest.fn() },
    promptVersion: { findUnique: jest.fn(), findFirst: jest.fn(), create: jest.fn(), update: jest.fn() },
    promptComposition: { findMany: jest.fn(), create: jest.fn(), updateMany: jest.fn(), delete: jest.fn() },
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

import { POST as createPrompt, GET as listPrompts } from '@/app/api/prompts/route'

const authHeaders = { Authorization: 'Bearer valid_token' }
const mockWorkspace = { id: 'ws1', user_id: 'user123', name: 'Test', slug: 'test' }

describe('POST /api/prompts', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    const { verifyAccessToken } = require('@/lib/jwt')
    verifyAccessToken.mockReturnValue({ userId: 'user123' })
  })

  test('returns 401 without auth', async () => {
    const req = new NextRequest('http://localhost:3000/api/prompts', {
      method: 'POST',
      body: JSON.stringify({ name: 'Test', template_body: 'Hello' }),
    })
    const res = await createPrompt(req)
    expect(res.status).toBe(401)
  })

  test('returns 401 with invalid token', async () => {
    const { verifyAccessToken } = require('@/lib/jwt')
    verifyAccessToken.mockImplementation(() => { throw new Error('Invalid') })

    const req = new NextRequest('http://localhost:3000/api/prompts', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ name: 'Test', template_body: 'Hello' }),
    })
    const res = await createPrompt(req)
    expect(res.status).toBe(401)
  })

  test('returns 404 if workspace not found', async () => {
    const prisma = require('@/lib/prisma').default
    prisma.workspace.findFirst.mockResolvedValueOnce(null)

    const req = new NextRequest('http://localhost:3000/api/prompts', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ name: 'Test', template_body: 'Hello' }),
    })
    const res = await createPrompt(req)
    expect(res.status).toBe(404)
  })

  test('returns 400 if name is missing', async () => {
    const prisma = require('@/lib/prisma').default
    prisma.workspace.findFirst.mockResolvedValueOnce(mockWorkspace)

    const req = new NextRequest('http://localhost:3000/api/prompts', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ template_body: 'Hello' }),
    })
    const res = await createPrompt(req)
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toContain('name and template_body are required')
  })

  test('returns 400 if template_body is missing', async () => {
    const prisma = require('@/lib/prisma').default
    prisma.workspace.findFirst.mockResolvedValueOnce(mockWorkspace)

    const req = new NextRequest('http://localhost:3000/api/prompts', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ name: 'Test' }),
    })
    const res = await createPrompt(req)
    expect(res.status).toBe(400)
  })

  test('creates prompt and returns 201', async () => {
    const prisma = require('@/lib/prisma').default
    prisma.workspace.findFirst.mockResolvedValueOnce(mockWorkspace)

    const createdPrompt = {
      id: 'p1',
      name: 'My Prompt',
      description: null,
      tags: ['test'],
      model: 'claude-3-haiku',
      category_id: null,
      created_at: new Date('2026-04-20T10:00:00Z'),
      updated_at: new Date('2026-04-20T10:00:00Z'),
      versions: [{
        id: 'v1',
        version_number: 1,
        template_body: 'Hello {{name}}',
        model_config: {},
        change_log: 'Initial version',
      }],
    }
    prisma.prompt.create.mockResolvedValueOnce(createdPrompt)
    prisma.syncLog.create.mockResolvedValueOnce({})

    const req = new NextRequest('http://localhost:3000/api/prompts', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ name: 'My Prompt', template_body: 'Hello {{name}}' }),
    })
    const res = await createPrompt(req)
    expect(res.status).toBe(201)

    const data = await res.json()
    expect(data.name).toBe('My Prompt')
    expect(data.id).toBe('p1')

    expect(prisma.prompt.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          name: 'My Prompt',
          workspace_id: 'ws1',
        }),
      })
    )
    expect(prisma.syncLog.create).toHaveBeenCalled()
  })

  test('handles database errors', async () => {
    const prisma = require('@/lib/prisma').default
    prisma.workspace.findFirst.mockResolvedValueOnce(mockWorkspace)
    prisma.prompt.create.mockRejectedValueOnce(new Error('DB error'))

    const req = new NextRequest('http://localhost:3000/api/prompts', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ name: 'Test', template_body: 'Hello' }),
    })
    const res = await createPrompt(req)
    expect(res.status).toBe(500)
  })
})

describe('GET /api/prompts', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    const { verifyAccessToken } = require('@/lib/jwt')
    verifyAccessToken.mockReturnValue({ userId: 'user123' })
  })

  test('returns 401 without auth', async () => {
    const req = new NextRequest('http://localhost:3000/api/prompts')
    const res = await listPrompts(req)
    expect(res.status).toBe(401)
  })

  test('returns 404 if workspace not found', async () => {
    const prisma = require('@/lib/prisma').default
    prisma.workspace.findFirst.mockResolvedValueOnce(null)

    const req = new NextRequest('http://localhost:3000/api/prompts', { headers: authHeaders })
    const res = await listPrompts(req)
    expect(res.status).toBe(404)
  })

  test('returns prompts list with pagination', async () => {
    const prisma = require('@/lib/prisma').default
    prisma.workspace.findFirst.mockResolvedValueOnce(mockWorkspace)
    prisma.prompt.count.mockResolvedValueOnce(2)
    prisma.prompt.findMany.mockResolvedValueOnce([
      { id: 'p1', name: 'Prompt 1', description: null, tags: [], model: 'claude-3-haiku', versions: [], created_at: new Date(), updated_at: new Date() },
      { id: 'p2', name: 'Prompt 2', description: null, tags: ['test'], model: 'llama2', versions: [{ id: 'v1', version_number: 1 }], created_at: new Date(), updated_at: new Date() },
    ])

    const req = new NextRequest('http://localhost:3000/api/prompts', { headers: authHeaders })
    const res = await listPrompts(req)
    expect(res.status).toBe(200)

    const data = await res.json()
    expect(data.prompts).toHaveLength(2)
    expect(data.pagination).toBeDefined()
    expect(data.pagination.total).toBe(2)
  })

  test('respects pagination parameters', async () => {
    const prisma = require('@/lib/prisma').default
    prisma.workspace.findFirst.mockResolvedValueOnce(mockWorkspace)
    prisma.prompt.count.mockResolvedValueOnce(50)
    prisma.prompt.findMany.mockResolvedValueOnce([])

    const req = new NextRequest('http://localhost:3000/api/prompts?skip=10&take=5', { headers: authHeaders })
    const res = await listPrompts(req)
    expect(res.status).toBe(200)

    expect(prisma.prompt.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 10,
        take: 5,
      })
    )
  })

  test('returns empty array for workspace with no prompts', async () => {
    const prisma = require('@/lib/prisma').default
    prisma.workspace.findFirst.mockResolvedValueOnce(mockWorkspace)
    prisma.prompt.count.mockResolvedValueOnce(0)
    prisma.prompt.findMany.mockResolvedValueOnce([])

    const req = new NextRequest('http://localhost:3000/api/prompts', { headers: authHeaders })
    const res = await listPrompts(req)
    const data = await res.json()

    expect(data.prompts).toEqual([])
    expect(data.pagination.total).toBe(0)
  })
})