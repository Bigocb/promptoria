import { NextRequest } from 'next/server'

jest.mock('@/lib/prisma', () => {
  const mockClient = {
    user: { findUnique: jest.fn(), findFirst: jest.fn() },
    userSettings: { findUnique: jest.fn(), create: jest.fn(), update: jest.fn() },
    workspace: { findFirst: jest.fn() },
    prompt: { findUnique: jest.fn(), findFirst: jest.fn(), findMany: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn(), count: jest.fn() },
    promptVersion: { findUnique: jest.fn(), findFirst: jest.fn(), create: jest.fn(), update: jest.fn() },
    syncLog: { create: jest.fn() },
    $transaction: jest.fn(),
  }
  return { __esModule: true, default: mockClient }
})

jest.mock('@/lib/jwt', () => ({
  verifyAccessToken: jest.fn(),
}))

import { GET as getPrompt, PUT as updatePrompt, DELETE as deletePrompt } from '@/app/api/prompts/[id]/route'

const authHeaders = { Authorization: 'Bearer valid_token' }
const mockWorkspace = { id: 'ws1', user_id: 'user123', name: 'Test', slug: 'test' }
const mockPrompt = {
  id: 'p1',
  name: 'Test Prompt',
  description: 'A test',
  tags: ['tag1', 'tag2'],
  model: 'llama3.2',
  category_id: 'cat1',
  workspace_id: 'ws1',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  versions: [{ id: 'v1', version_number: 1, template_body: 'Hello {{name}}', is_active: true }],
  category: { agent_interaction_type_id: 'it1', interaction_type: { id: 'it1', name: 'Chat' } },
}

describe('GET /api/prompts/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    const { verifyAccessToken } = require('@/lib/jwt')
    verifyAccessToken.mockReturnValue({ userId: 'user123' })
  })

  test('returns 401 without auth', async () => {
    const req = new NextRequest('http://localhost:3000/api/prompts/p1')
    const res = await getPrompt(req, { params: { id: 'p1' } })
    expect(res.status).toBe(401)
  })

  test('returns 401 with invalid token', async () => {
    const { verifyAccessToken } = require('@/lib/jwt')
    verifyAccessToken.mockImplementation(() => { throw new Error('Invalid') })
    const req = new NextRequest('http://localhost:3000/api/prompts/p1', { headers: authHeaders })
    const res = await getPrompt(req, { params: { id: 'p1' } })
    expect(res.status).toBe(401)
  })

  test('returns 404 if prompt not found', async () => {
    const prisma = require('@/lib/prisma').default
    prisma.workspace.findFirst.mockResolvedValueOnce(mockWorkspace)
    prisma.prompt.findUnique.mockResolvedValueOnce(null)
    const req = new NextRequest('http://localhost:3000/api/prompts/p1', { headers: authHeaders })
    const res = await getPrompt(req, { params: { id: 'p1' } })
    expect(res.status).toBe(404)
  })

  test('returns 403 if prompt belongs to different workspace', async () => {
    const prisma = require('@/lib/prisma').default
    prisma.workspace.findFirst.mockResolvedValueOnce(mockWorkspace)
    prisma.prompt.findUnique.mockResolvedValueOnce({ ...mockPrompt, workspace_id: 'ws-other' })
    const req = new NextRequest('http://localhost:3000/api/prompts/p1', { headers: authHeaders })
    const res = await getPrompt(req, { params: { id: 'p1' } })
    expect(res.status).toBe(403)
  })

  test('returns prompt with interaction type when found', async () => {
    const prisma = require('@/lib/prisma').default
    prisma.workspace.findFirst.mockResolvedValueOnce(mockWorkspace)
    prisma.prompt.findUnique.mockResolvedValueOnce(mockPrompt)
    const req = new NextRequest('http://localhost:3000/api/prompts/p1', { headers: authHeaders })
    const res = await getPrompt(req, { params: { id: 'p1' } })
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.id).toBe('p1')
    expect(data.tags).toEqual(['tag1', 'tag2'])
    expect(data.agent_interaction_type_id).toBe('it1')
    expect(data.category_id).toBe('cat1')
  })
})

describe('PUT /api/prompts/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    const { verifyAccessToken } = require('@/lib/jwt')
    verifyAccessToken.mockReturnValue({ userId: 'user123' })
  })

  test('returns 401 without auth', async () => {
    const req = new NextRequest('http://localhost:3000/api/prompts/p1', {
      method: 'PUT',
      body: JSON.stringify({ name: 'Updated' }),
    })
    const res = await updatePrompt(req, { params: { id: 'p1' } })
    expect(res.status).toBe(401)
  })

  test('updates prompt name', async () => {
    const prisma = require('@/lib/prisma').default
    prisma.workspace.findFirst.mockResolvedValueOnce(mockWorkspace)
    prisma.prompt.findUnique.mockResolvedValueOnce({ ...mockPrompt, versions: [{ id: 'v1', version_number: 1 }] })
    prisma.prompt.update.mockResolvedValueOnce({
      ...mockPrompt,
      name: 'Updated',
      versions: [{ id: 'v1', version_number: 1 }, { id: 'v2', version_number: 2, template_body: 'new' }],
    })
    const req = new NextRequest('http://localhost:3000/api/prompts/p1', {
      method: 'PUT',
      headers: { ...authHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Updated' }),
    })
    const res = await updatePrompt(req, { params: { id: 'p1' } })
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.name).toBe('Updated')
  })

  test('updates tags', async () => {
    const prisma = require('@/lib/prisma').default
    prisma.workspace.findFirst.mockResolvedValueOnce(mockWorkspace)
    prisma.prompt.findUnique.mockResolvedValueOnce({ ...mockPrompt, versions: [{ id: 'v1', version_number: 1 }] })
    prisma.prompt.update.mockResolvedValueOnce({
      ...mockPrompt,
      tags: ['new-tag'],
      versions: [{ id: 'v1', version_number: 1 }],
    })
    const req = new NextRequest('http://localhost:3000/api/prompts/p1', {
      method: 'PUT',
      headers: { ...authHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ tags: ['new-tag'] }),
    })
    const res = await updatePrompt(req, { params: { id: 'p1' } })
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.tags).toEqual(['new-tag'])
  })
})

describe('DELETE /api/prompts/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    const { verifyAccessToken } = require('@/lib/jwt')
    verifyAccessToken.mockReturnValue({ userId: 'user123' })
  })

  test('returns 401 without auth', async () => {
    const req = new NextRequest('http://localhost:3000/api/prompts/p1', { method: 'DELETE' })
    const res = await deletePrompt(req, { params: { id: 'p1' } })
    expect(res.status).toBe(401)
  })

  test('deletes prompt successfully', async () => {
    const prisma = require('@/lib/prisma').default
    prisma.workspace.findFirst.mockResolvedValueOnce(mockWorkspace)
    prisma.prompt.findUnique.mockResolvedValueOnce(mockPrompt)
    prisma.prompt.delete.mockResolvedValueOnce(mockPrompt)
    const req = new NextRequest('http://localhost:3000/api/prompts/p1', {
      method: 'DELETE',
      headers: authHeaders,
    })
    const res = await deletePrompt(req, { params: { id: 'p1' } })
    expect(res.status).toBe(200)
  })

  test('returns 403 if not owner', async () => {
    const prisma = require('@/lib/prisma').default
    prisma.workspace.findFirst.mockResolvedValueOnce(mockWorkspace)
    prisma.prompt.findUnique.mockResolvedValueOnce({ ...mockPrompt, workspace_id: 'ws-other' })
    const req = new NextRequest('http://localhost:3000/api/prompts/p1', {
      method: 'DELETE',
      headers: authHeaders,
    })
    const res = await deletePrompt(req, { params: { id: 'p1' } })
    expect(res.status).toBe(403)
  })
})