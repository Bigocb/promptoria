import { NextRequest } from 'next/server'

jest.mock('@/lib/prisma', () => {
  const mockClient = {
    workspace: { findFirst: jest.fn() },
    prompt: { findUnique: jest.fn() },
    promptVersion: { findUnique: jest.fn() },
    userSettings: { findUnique: jest.fn() },
    syncLog: { create: jest.fn() },
  }
  return { __esModule: true, default: mockClient }
})

jest.mock('@/lib/jwt', () => ({
  verifyAccessToken: jest.fn(),
}))

const originalFetch = global.fetch

import { GET as getTagSuggestions } from '@/app/api/prompts/[id]/tags-suggestions/route'

const authHeaders = { Authorization: 'Bearer valid_token' }
const mockWorkspace = { id: 'ws1', user_id: 'user123', name: 'Test' }
const mockPrompt = {
  id: 'p1',
  name: 'Test Prompt',
  description: 'A test prompt',
  workspace_id: 'ws1',
  versions: [{ id: 'v1', version_number: 1, template_body: 'Write a {{type}} about {{topic}}', is_active: true }],
}

describe('GET /api/prompts/[id]/tags-suggestions', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    const { verifyAccessToken } = require('@/lib/jwt')
    verifyAccessToken.mockReturnValue({ userId: 'user123' })
  })

  afterEach(() => {
    global.fetch = originalFetch
  })

  test('returns 401 without auth', async () => {
    const req = new NextRequest('http://localhost:3000/api/prompts/p1/tags-suggestions')
    const res = await getTagSuggestions(req, { params: { id: 'p1' } })
    expect(res.status).toBe(401)
  })

  test('returns 401 with invalid token', async () => {
    const { verifyAccessToken } = require('@/lib/jwt')
    verifyAccessToken.mockImplementation(() => { throw new Error('Invalid') })
    const req = new NextRequest('http://localhost:3000/api/prompts/p1/tags-suggestions', { headers: authHeaders })
    const res = await getTagSuggestions(req, { params: { id: 'p1' } })
    expect(res.status).toBe(401)
  })

  test('returns 404 if no workspace', async () => {
    const prisma = require('@/lib/prisma').default
    prisma.workspace.findFirst.mockResolvedValueOnce(null)
    const req = new NextRequest('http://localhost:3000/api/prompts/p1/tags-suggestions', { headers: authHeaders })
    const res = await getTagSuggestions(req, { params: { id: 'p1' } })
    expect(res.status).toBe(404)
  })

  test('returns 404 if prompt not found', async () => {
    const prisma = require('@/lib/prisma').default
    prisma.workspace.findFirst.mockResolvedValueOnce(mockWorkspace)
    prisma.prompt.findUnique.mockResolvedValueOnce(null)
    const req = new NextRequest('http://localhost:3000/api/prompts/p1/tags-suggestions', { headers: authHeaders })
    const res = await getTagSuggestions(req, { params: { id: 'p1' } })
    expect(res.status).toBe(404)
  })

  test('returns 404 if prompt belongs to different workspace', async () => {
    const prisma = require('@/lib/prisma').default
    prisma.workspace.findFirst.mockResolvedValueOnce(mockWorkspace)
    prisma.prompt.findUnique.mockResolvedValueOnce({ ...mockPrompt, workspace_id: 'ws-other' })
    const req = new NextRequest('http://localhost:3000/api/prompts/p1/tags-suggestions', { headers: authHeaders })
    const res = await getTagSuggestions(req, { params: { id: 'p1' } })
    expect(res.status).toBe(404)
  })

  test('returns tags from Ollama response', async () => {
    const prisma = require('@/lib/prisma').default
    prisma.workspace.findFirst.mockResolvedValueOnce(mockWorkspace)
    prisma.prompt.findUnique.mockResolvedValueOnce(mockPrompt)
    prisma.userSettings.findUnique.mockResolvedValueOnce({ default_model: 'llama3.2' })
    prisma.syncLog.create.mockResolvedValueOnce({})
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ response: '{"tags": ["writing", "creative", "storytelling"]}' }),
    })

    const req = new NextRequest('http://localhost:3000/api/prompts/p1/tags-suggestions', { headers: authHeaders })
    const res = await getTagSuggestions(req, { params: { id: 'p1' } })
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.tags).toEqual(['writing', 'creative', 'storytelling'])
  })

  test('returns 502 when Ollama is unreachable', async () => {
    const prisma = require('@/lib/prisma').default
    prisma.workspace.findFirst.mockResolvedValueOnce(mockWorkspace)
    prisma.prompt.findUnique.mockResolvedValueOnce(mockPrompt)
    prisma.userSettings.findUnique.mockResolvedValueOnce({ default_model: 'llama3.2' })
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: false,
      status: 503,
      text: async () => 'Service unavailable',
    })

    const req = new NextRequest('http://localhost:3000/api/prompts/p1/tags-suggestions', { headers: authHeaders })
    const res = await getTagSuggestions(req, { params: { id: 'p1' } })
    expect(res.status).toBe(502)
  })

  test('uses user default model when set', async () => {
    const prisma = require('@/lib/prisma').default
    prisma.workspace.findFirst.mockResolvedValueOnce(mockWorkspace)
    prisma.prompt.findUnique.mockResolvedValueOnce(mockPrompt)
    prisma.userSettings.findUnique.mockResolvedValueOnce({ default_model: 'mistral' })
    prisma.syncLog.create.mockResolvedValueOnce({})
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ response: '{"tags": ["code", "debug"]}' }),
    })

    const req = new NextRequest('http://localhost:3000/api/prompts/p1/tags-suggestions', { headers: authHeaders })
    const res = await getTagSuggestions(req, { params: { id: 'p1' } })
    expect(res.status).toBe(200)
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/generate'),
      expect.objectContaining({
        body: expect.stringContaining('"mistral"'),
      })
    )
  })

  test('falls back to line extraction when JSON parse fails', async () => {
    const prisma = require('@/lib/prisma').default
    prisma.workspace.findFirst.mockResolvedValueOnce(mockWorkspace)
    prisma.prompt.findUnique.mockResolvedValueOnce(mockPrompt)
    prisma.userSettings.findUnique.mockResolvedValueOnce({ default_model: 'llama3.2' })
    prisma.syncLog.create.mockResolvedValueOnce({})
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ response: 'Some text without JSON tags' }),
    })

    const req = new NextRequest('http://localhost:3000/api/prompts/p1/tags-suggestions', { headers: authHeaders })
    const res = await getTagSuggestions(req, { params: { id: 'p1' } })
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.tags).toBeDefined()
    expect(Array.isArray(data.tags)).toBe(true)
    expect(data.prompt_id).toBe('p1')
  })
})