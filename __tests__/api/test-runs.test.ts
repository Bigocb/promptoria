import { NextRequest } from 'next/server'

jest.mock('@/lib/prisma', () => {
  const mockClient = {
    workspace: { findFirst: jest.fn() },
    promptVersion: { findUnique: jest.fn() },
    testRun: { create: jest.fn(), findMany: jest.fn(), update: jest.fn() },
    userSettings: { findUnique: jest.fn() },
    syncLog: { create: jest.fn() },
  }
  return { __esModule: true, default: mockClient }
})

jest.mock('@/lib/jwt', () => ({
  verifyAccessToken: jest.fn(),
}))

const originalFetch = global.fetch

import { POST as runTest, GET as listTestRuns } from '@/app/api/test-runs/route'

const authHeaders = { Authorization: 'Bearer valid_token' }
const mockWorkspace = { id: 'ws1', user_id: 'user123', name: 'Test' }

describe('POST /api/test-runs', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    const { verifyAccessToken } = require('@/lib/jwt')
    verifyAccessToken.mockReturnValue({ userId: 'user123' })
  })

  afterEach(() => {
    global.fetch = originalFetch
  })

  test('returns 401 without auth', async () => {
    const req = new NextRequest('http://localhost:3000/api/test-runs', {
      method: 'POST',
      body: JSON.stringify({ prompt_version_id: 'v1' }),
    })
    const res = await runTest(req)
    expect(res.status).toBe(401)
  })

  test('returns 404 if prompt version not found', async () => {
    const prisma = require('@/lib/prisma').default
    prisma.workspace.findFirst.mockResolvedValueOnce(mockWorkspace)
    prisma.promptVersion.findUnique.mockResolvedValueOnce(null)
    const req = new NextRequest('http://localhost:3000/api/test-runs', {
      method: 'POST',
      headers: { ...authHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt_version_id: 'v1' }),
    })
    const res = await runTest(req)
    expect(res.status).toBe(404)
  })

  test('returns 400 if no input provided', async () => {
    const prisma = require('@/lib/prisma').default
    prisma.workspace.findFirst.mockResolvedValueOnce(mockWorkspace)
    prisma.promptVersion.findUnique.mockResolvedValueOnce({
      id: 'v1', template_body: 'Hello', prompt: { model: 'llama3.2', workspace_id: 'ws1' },
    })
    const req = new NextRequest('http://localhost:3000/api/test-runs', {
      method: 'POST',
      headers: { ...authHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt_version_id: 'v1', model: 'llama3.2' }),
    })
    const res = await runTest(req)
    expect(res.status).toBe(400)
  })

  test('returns error if Ollama returns error', async () => {
    const prisma = require('@/lib/prisma').default
    prisma.workspace.findFirst.mockResolvedValueOnce(mockWorkspace)
    prisma.promptVersion.findUnique.mockResolvedValueOnce({
      id: 'v1', template_body: 'Hello {{name}}', prompt: { model: 'llama3.2', workspace_id: 'ws1' },
    })
    prisma.userSettings.findUnique.mockResolvedValueOnce({ default_model: 'llama3.2', default_temperature: 0.7, default_max_tokens: 500 })
    prisma.testRun.create.mockResolvedValueOnce({ id: 'tr1', status: 'pending' })
    global.fetch = jest.fn().mockResolvedValueOnce({ ok: false, status: 500, json: async () => ({ error: 'Server error' }) })
    prisma.testRun.update.mockResolvedValueOnce({ id: 'tr1', status: 'error' })

    const req = new NextRequest('http://localhost:3000/api/test-runs', {
      method: 'POST',
      headers: { ...authHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt_version_id: 'v1', test_case_input: 'Hello', model: 'llama3.2' }),
    })
    const res = await runTest(req)
    expect([500, 502]).toContain(res.status)
  })
})

describe('GET /api/test-runs', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    const { verifyAccessToken } = require('@/lib/jwt')
    verifyAccessToken.mockReturnValue({ userId: 'user123' })
  })

  test('returns 401 without auth', async () => {
    const req = new NextRequest('http://localhost:3000/api/test-runs')
    const res = await listTestRuns(req)
    expect(res.status).toBe(401)
  })

  test('returns test runs list', async () => {
    const prisma = require('@/lib/prisma').default
    prisma.workspace.findFirst.mockResolvedValueOnce(mockWorkspace)
    prisma.testRun.findMany.mockResolvedValueOnce([
      { id: 'tr1', status: 'success', model: 'llama3.2', created_at: new Date(), duration_ms: 1200 },
    ])
    const req = new NextRequest('http://localhost:3000/api/test-runs', { headers: authHeaders })
    const res = await listTestRuns(req)
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.test_runs).toHaveLength(1)
  })
})