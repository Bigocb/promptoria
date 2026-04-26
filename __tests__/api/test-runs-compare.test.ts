import { NextRequest } from 'next/server'

jest.mock('@/lib/prisma', () => {
  const mockClient = {
    workspace: { findFirst: jest.fn() },
    testRun: { findUnique: jest.fn() },
    testComparison: { create: jest.fn() },
  }
  return { __esModule: true, default: mockClient }
})

jest.mock('@/lib/jwt', () => ({
  verifyAccessToken: jest.fn(),
}))

const originalFetch = global.fetch

import { POST as compareTestRuns } from '@/app/api/test-runs/compare/route'

const authHeaders = { Authorization: 'Bearer valid_token' }
const mockWorkspace = { id: 'ws1', user_id: 'user123', name: 'Test' }

const mockRunA = {
  id: 'run_a',
  workspace_id: 'ws1',
  test_case_input: 'Hello world',
  output: 'Hello! How can I help you?',
  model: 'llama3.2:3b',
  prompt_version: {
    id: 'pv1',
    version_number: 1,
    prompt: { id: 'p1', workspace_id: 'ws1' },
  },
}

const mockRunB = {
  id: 'run_b',
  workspace_id: 'ws1',
  test_case_input: 'Hello world',
  output: 'Greetings! What can I do for you today?',
  model: 'llama3.2:3b',
  prompt_version: {
    id: 'pv1',
    version_number: 1,
    prompt: { id: 'p1', workspace_id: 'ws1' },
  },
}

describe('POST /api/test-runs/compare', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    const { verifyAccessToken } = require('@/lib/jwt')
    verifyAccessToken.mockReturnValue({ userId: 'user123' })
  })

  afterEach(() => {
    global.fetch = originalFetch
  })

  test('returns 401 without auth', async () => {
    const req = new NextRequest('http://localhost:3000/api/test-runs/compare', {
      method: 'POST',
      body: JSON.stringify({ test_run_a_id: 'run_a', test_run_b_id: 'run_b' }),
    })
    const res = await compareTestRuns(req)
    expect(res.status).toBe(401)
  })

  test('returns 400 if ids missing', async () => {
    const req = new NextRequest('http://localhost:3000/api/test-runs/compare', {
      method: 'POST',
      headers: { ...authHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    })
    const res = await compareTestRuns(req)
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toMatch(/required/)
  })

  test('returns 404 if one or both test runs not found', async () => {
    const prisma = require('@/lib/prisma').default
    prisma.testRun.findUnique.mockResolvedValueOnce(null).mockResolvedValueOnce(null)

    const req = new NextRequest('http://localhost:3000/api/test-runs/compare', {
      method: 'POST',
      headers: { ...authHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ test_run_a_id: 'run_a', test_run_b_id: 'run_b' }),
    })
    const res = await compareTestRuns(req)
    expect(res.status).toBe(404)
    const data = await res.json()
    expect(data.error).toMatch(/not found/)
  })

  test('returns 403 if workspace does not belong to user', async () => {
    const prisma = require('@/lib/prisma').default
    prisma.testRun.findUnique
      .mockResolvedValueOnce(mockRunA)
      .mockResolvedValueOnce(mockRunB)
    prisma.workspace.findFirst.mockResolvedValueOnce(null)

    const req = new NextRequest('http://localhost:3000/api/test-runs/compare', {
      method: 'POST',
      headers: { ...authHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ test_run_a_id: 'run_a', test_run_b_id: 'run_b' }),
    })
    const res = await compareTestRuns(req)
    expect(res.status).toBe(403)
  })

  test('returns 502 if judge model fails', async () => {
    const prisma = require('@/lib/prisma').default
    prisma.testRun.findUnique
      .mockResolvedValueOnce(mockRunA)
      .mockResolvedValueOnce(mockRunB)
    prisma.workspace.findFirst.mockResolvedValueOnce(mockWorkspace)
    global.fetch = jest.fn().mockResolvedValueOnce({ ok: false, status: 500, text: async () => 'Internal error' })

    const req = new NextRequest('http://localhost:3000/api/test-runs/compare', {
      method: 'POST',
      headers: { ...authHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ test_run_a_id: 'run_a', test_run_b_id: 'run_b' }),
    })
    const res = await compareTestRuns(req)
    expect(res.status).toBe(502)
    const data = await res.json()
    expect(data.error).toMatch(/Judge model failed/)
  })

  test('returns 500 if judge returns invalid JSON', async () => {
    const prisma = require('@/lib/prisma').default
    prisma.testRun.findUnique
      .mockResolvedValueOnce(mockRunA)
      .mockResolvedValueOnce(mockRunB)
    prisma.workspace.findFirst.mockResolvedValueOnce(mockWorkspace)
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ response: 'not valid json' }),
    })

    const req = new NextRequest('http://localhost:3000/api/test-runs/compare', {
      method: 'POST',
      headers: { ...authHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ test_run_a_id: 'run_a', test_run_b_id: 'run_b' }),
    })
    const res = await compareTestRuns(req)
    expect(res.status).toBe(500)
    const data = await res.json()
    expect(data.error).toMatch(/invalid format/)
  })

  test('returns 200 with comparison when A wins', async () => {
    const judgeResponse = {
      response: JSON.stringify({
        winner: 'A',
        scores: {
          A: { clarity: 5, completeness: 4, accuracy: 5, tone: 4, helpfulness: 5 },
          B: { clarity: 4, completeness: 3, accuracy: 4, tone: 3, helpfulness: 4 },
        },
        explanation: 'Version A is more helpful and accurate.',
      }),
    }

    const prisma = require('@/lib/prisma').default
    prisma.testRun.findUnique
      .mockResolvedValueOnce(mockRunA)
      .mockResolvedValueOnce(mockRunB)
    prisma.workspace.findFirst.mockResolvedValueOnce(mockWorkspace)
    prisma.testComparison.create.mockResolvedValueOnce({
      id: 'tc1',
      winner_id: 'run_a',
    })
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => judgeResponse,
    })

    const req = new NextRequest('http://localhost:3000/api/test-runs/compare', {
      method: 'POST',
      headers: { ...authHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ test_run_a_id: 'run_a', test_run_b_id: 'run_b' }),
    })
    const res = await compareTestRuns(req)
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.comparison.winner).toBe('A')
    expect(data.comparison.winner_id).toBe('run_a')
    expect(data.comparison.scores.A.clarity).toBe(5)
    expect(data.comparison.explanation).toBe('Version A is more helpful and accurate.')
    expect(prisma.testComparison.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          winner_id: 'run_a',
          judge_result: expect.any(Object),
        }),
      })
    )
  })

  test('returns 200 with comparison when B wins', async () => {
    const judgeResponse = {
      response: JSON.stringify({
        winner: 'B',
        scores: {
          A: { clarity: 3, completeness: 3, accuracy: 3, tone: 3, helpfulness: 3 },
          B: { clarity: 5, completeness: 5, accuracy: 5, tone: 5, helpfulness: 5 },
        },
        explanation: 'Version B is superior in every dimension.',
      }),
    }

    const prisma = require('@/lib/prisma').default
    prisma.testRun.findUnique
      .mockResolvedValueOnce(mockRunA)
      .mockResolvedValueOnce(mockRunB)
    prisma.workspace.findFirst.mockResolvedValueOnce(mockWorkspace)
    prisma.testComparison.create.mockResolvedValueOnce({
      id: 'tc2',
      winner_id: 'run_b',
    })
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => judgeResponse,
    })

    const req = new NextRequest('http://localhost:3000/api/test-runs/compare', {
      method: 'POST',
      headers: { ...authHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ test_run_a_id: 'run_a', test_run_b_id: 'run_b' }),
    })
    const res = await compareTestRuns(req)
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.comparison.winner).toBe('B')
    expect(data.comparison.winner_id).toBe('run_b')
  })

  test('returns 200 with tie and null winner_id', async () => {
    const judgeResponse = {
      response: JSON.stringify({
        winner: 'tie',
        scores: {
          A: { clarity: 4, completeness: 4, accuracy: 4, tone: 4, helpfulness: 4 },
          B: { clarity: 4, completeness: 4, accuracy: 4, tone: 4, helpfulness: 4 },
        },
        explanation: 'Both versions are essentially equivalent.',
      }),
    }

    const prisma = require('@/lib/prisma').default
    prisma.testRun.findUnique
      .mockResolvedValueOnce(mockRunA)
      .mockResolvedValueOnce(mockRunB)
    prisma.workspace.findFirst.mockResolvedValueOnce(mockWorkspace)
    prisma.testComparison.create.mockResolvedValueOnce({
      id: 'tc3',
      winner_id: null,
    })
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => judgeResponse,
    })

    const req = new NextRequest('http://localhost:3000/api/test-runs/compare', {
      method: 'POST',
      headers: { ...authHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ test_run_a_id: 'run_a', test_run_b_id: 'run_b' }),
    })
    const res = await compareTestRuns(req)
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.comparison.winner).toBe('tie')
    expect(data.comparison.winner_id).toBeNull()
  })

  test('extracts JSON from markdown code blocks if direct parse fails', async () => {
    const judgeResponse = {
      response: '```json\n' + JSON.stringify({
        winner: 'A',
        scores: { A: { clarity: 5, completeness: 5, accuracy: 5, tone: 5, helpfulness: 5 }, B: { clarity: 3, completeness: 3, accuracy: 3, tone: 3, helpfulness: 3 } },
        explanation: 'A is much better.',
      }) + '\n```',
    }

    const prisma = require('@/lib/prisma').default
    prisma.testRun.findUnique
      .mockResolvedValueOnce(mockRunA)
      .mockResolvedValueOnce(mockRunB)
    prisma.workspace.findFirst.mockResolvedValueOnce(mockWorkspace)
    prisma.testComparison.create.mockResolvedValueOnce({ id: 'tc4', winner_id: 'run_a' })
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => judgeResponse,
    })

    const req = new NextRequest('http://localhost:3000/api/test-runs/compare', {
      method: 'POST',
      headers: { ...authHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ test_run_a_id: 'run_a', test_run_b_id: 'run_b' }),
    })
    const res = await compareTestRuns(req)
    expect(res.status).toBe(200)
  })
})
