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

jest.mock('@/lib/model-fallback', () => ({
  resolveAvailableModel: jest.fn().mockResolvedValue('llama3.2:3b'),
  cachedModelAvailable: jest.fn().mockReturnValue(true),
  setModelAvailability: jest.fn(),
  warmModelCache: jest.fn().mockResolvedValue(undefined),
}))

const originalFetch = global.fetch

import { GET as getSuggestions } from '@/app/api/prompts/[id]/suggestions/route'

const authHeaders = { Authorization: 'Bearer valid_token' }
const mockWorkspace = { id: 'ws1', user_id: 'user123', name: 'Test' }
const mockPrompt = {
  id: 'p1',
  name: 'Test Prompt',
  description: 'A test prompt',
  model: 'llama3.2:3b',
  workspace_id: 'ws1',
  versions: [{ id: 'v1', version_number: 1, template_body: 'Write about {{topic}}', is_active: true }],
}

describe('GET /api/prompts/[id]/suggestions', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    const { verifyAccessToken } = require('@/lib/jwt')
    verifyAccessToken.mockReturnValue({ userId: 'user123' })
  })

  afterEach(() => {
    global.fetch = originalFetch
  })

  test('returns 401 without auth', async () => {
    const req = new NextRequest('http://localhost:3000/api/prompts/p1/suggestions')
    const res = await getSuggestions(req, { params: { id: 'p1' } })
    expect(res.status).toBe(401)
  })

  test('returns 404 if prompt not found', async () => {
    const prisma = require('@/lib/prisma').default
    prisma.workspace.findFirst.mockResolvedValueOnce(mockWorkspace)
    prisma.prompt.findUnique.mockResolvedValueOnce(null)
    const req = new NextRequest('http://localhost:3000/api/prompts/p1/suggestions', { headers: authHeaders })
    const res = await getSuggestions(req, { params: { id: 'p1' } })
    expect(res.status).toBe(404)
  })

  test('returns 404 if prompt belongs to different workspace', async () => {
    const prisma = require('@/lib/prisma').default
    prisma.workspace.findFirst.mockResolvedValueOnce(mockWorkspace)
    prisma.prompt.findUnique.mockResolvedValueOnce({ ...mockPrompt, workspace_id: 'ws-other' })
    const req = new NextRequest('http://localhost:3000/api/prompts/p1/suggestions', { headers: authHeaders })
    const res = await getSuggestions(req, { params: { id: 'p1' } })
    expect(res.status).toBe(404)
  })

  test('returns suggestions from Ollama', async () => {
    const prisma = require('@/lib/prisma').default
    prisma.workspace.findFirst.mockResolvedValueOnce(mockWorkspace)
    prisma.prompt.findUnique.mockResolvedValueOnce(mockPrompt)
    prisma.userSettings.findUnique.mockResolvedValueOnce({ default_model: 'llama3.2' })
    prisma.syncLog.create.mockResolvedValueOnce({})
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        response: JSON.stringify({
          suggestions: [
            { title: 'Add specificity', description: 'Make the topic more concrete', priority: 'high', example: 'Replace {topic} with a specific subject' },
          ],
        }),
      }),
    })

    const req = new NextRequest('http://localhost:3000/api/prompts/p1/suggestions', { headers: authHeaders })
    const res = await getSuggestions(req, { params: { id: 'p1' } })
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.suggestions).toHaveLength(1)
    expect(data.suggestions[0].title).toBe('Add specificity')
    expect(data.prompt_id).toBe('p1')
  })

  test('returns 502 when Ollama returns error', async () => {
    const prisma = require('@/lib/prisma').default
    prisma.workspace.findFirst.mockResolvedValueOnce(mockWorkspace)
    prisma.prompt.findUnique.mockResolvedValueOnce(mockPrompt)
    prisma.userSettings.findUnique.mockResolvedValueOnce({ default_model: 'llama3.2' })
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: false,
      status: 500,
      text: async () => 'Internal server error',
    })

    const req = new NextRequest('http://localhost:3000/api/prompts/p1/suggestions', { headers: authHeaders })
    const res = await getSuggestions(req, { params: { id: 'p1' } })
    expect(res.status).toBe(502)
  })

  test('uses prompt model over user default model', async () => {
    const prisma = require('@/lib/prisma').default
    prisma.workspace.findFirst.mockResolvedValueOnce(mockWorkspace)
    prisma.prompt.findUnique.mockResolvedValueOnce(mockPrompt)
    prisma.userSettings.findUnique.mockResolvedValueOnce({ default_model: 'mistral' })
    prisma.syncLog.create.mockResolvedValueOnce({})
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        response: JSON.stringify({ suggestions: [] }),
      }),
    })

    const req = new NextRequest('http://localhost:3000/api/prompts/p1/suggestions', { headers: authHeaders })
    const res = await getSuggestions(req, { params: { id: 'p1' } })
    expect(res.status).toBe(200)
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/generate'),
      expect.objectContaining({
        body: expect.stringContaining('"llama3.2:3b"'),
      })
    )
  })

  test('falls back gracefully when Ollama response is not valid JSON', async () => {
    const prisma = require('@/lib/prisma').default
    prisma.workspace.findFirst.mockResolvedValueOnce(mockWorkspace)
    prisma.prompt.findUnique.mockResolvedValueOnce(mockPrompt)
    prisma.userSettings.findUnique.mockResolvedValueOnce({ default_model: 'llama3.2' })
    prisma.syncLog.create.mockResolvedValueOnce({})
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ response: 'Here are some suggestions: Add more details and be specific.' }),
    })

    const req = new NextRequest('http://localhost:3000/api/prompts/p1/suggestions', { headers: authHeaders })
    const res = await getSuggestions(req, { params: { id: 'p1' } })
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.suggestions).toBeDefined()
    expect(data.prompt_id).toBe('p1')
  })
})