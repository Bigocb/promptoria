import { NextRequest } from 'next/server'

jest.mock('@/lib/prisma', () => {
  const mockClient = {
    workspace: { findFirst: jest.fn() },
    testRun: { findMany: jest.fn() },
  }
  return { __esModule: true, default: mockClient }
})

jest.mock('@/lib/jwt', () => ({
  verifyAccessToken: jest.fn(),
}))

import { GET as getPromptTestRuns } from '@/app/api/prompts/[id]/test-runs/route'

const authHeaders = { Authorization: 'Bearer valid_token' }
const mockWorkspace = { id: 'ws1', user_id: 'user123', name: 'Test' }

describe('GET /api/prompts/[id]/test-runs', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    const { verifyAccessToken } = require('@/lib/jwt')
    verifyAccessToken.mockReturnValue({ userId: 'user123' })
  })

  test('returns 401 without auth', async () => {
    const req = new NextRequest('http://localhost:3000/api/prompts/p1/test-runs')
    const res = await getPromptTestRuns(req, { params: { id: 'p1' } })
    expect(res.status).toBe(401)
  })

  test('returns 404 if workspace not found', async () => {
    const prisma = require('@/lib/prisma').default
    prisma.workspace.findFirst.mockResolvedValueOnce(null)

    const req = new NextRequest('http://localhost:3000/api/prompts/p1/test-runs', {
      headers: authHeaders,
    })
    const res = await getPromptTestRuns(req, { params: { id: 'p1' } })
    expect(res.status).toBe(404)
  })

  test('returns empty test_runs array when none exist', async () => {
    const prisma = require('@/lib/prisma').default
    prisma.workspace.findFirst.mockResolvedValueOnce(mockWorkspace)
    prisma.testRun.findMany.mockResolvedValueOnce([])

    const req = new NextRequest('http://localhost:3000/api/prompts/p1/test-runs', {
      headers: authHeaders,
    })
    const res = await getPromptTestRuns(req, { params: { id: 'p1' } })
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.test_runs).toEqual([])
    expect(prisma.testRun.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          workspace_id: 'ws1',
          prompt_id: 'p1',
          status: 'success',
        }),
        orderBy: { created_at: 'desc' },
        take: 50,
      })
    )
  })

  test('returns test runs with version_number included', async () => {
    const prisma = require('@/lib/prisma').default
    prisma.workspace.findFirst.mockResolvedValueOnce(mockWorkspace)
    prisma.testRun.findMany.mockResolvedValueOnce([
      {
        id: 'tr1',
        prompt_version_id: 'pv1',
        model: 'llama3.2:3b',
        temperature: 0.7,
        max_tokens: 1024,
        test_case_input: 'Hello world',
        output: 'Hi there!',
        total_tokens: 256,
        duration_ms: 1200,
        completed_at: new Date('2026-04-25T12:00:00Z'),
        created_at: new Date('2026-04-25T12:00:00Z'),
        prompt_version: {
          id: 'pv1',
          version_number: 3,
          template_body: 'Say hello to {name}',
        },
      },
      {
        id: 'tr2',
        prompt_version_id: 'pv2',
        model: 'mistral:7b',
        temperature: 0.5,
        max_tokens: 512,
        test_case_input: 'Hello world',
        output: 'Greetings!',
        total_tokens: 128,
        duration_ms: 800,
        completed_at: new Date('2026-04-24T10:00:00Z'),
        created_at: new Date('2026-04-24T10:00:00Z'),
        prompt_version: {
          id: 'pv2',
          version_number: 2,
          template_body: 'Say hello to {name}',
        },
      },
    ])

    const req = new NextRequest('http://localhost:3000/api/prompts/p1/test-runs', {
      headers: authHeaders,
    })
    const res = await getPromptTestRuns(req, { params: { id: 'p1' } })
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.test_runs).toHaveLength(2)
    expect(data.test_runs[0].version_number).toBe(3)
    expect(data.test_runs[1].version_number).toBe(2)
    expect(data.test_runs[0].model).toBe('llama3.2:3b')
    expect(data.test_runs[0].total_tokens).toBe(256)
    expect(data.test_runs[0].duration_ms).toBe(1200)
  })

  test('filters by workspace and prompt id only', async () => {
    const prisma = require('@/lib/prisma').default
    prisma.workspace.findFirst.mockResolvedValueOnce(mockWorkspace)
    prisma.testRun.findMany.mockResolvedValueOnce([])

    const req = new NextRequest('http://localhost:3000/api/prompts/p2/test-runs', {
      headers: authHeaders,
    })
    const res = await getPromptTestRuns(req, { params: { id: 'p2' } })
    expect(res.status).toBe(200)
    expect(prisma.testRun.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ prompt_id: 'p2' }),
      })
    )
  })

  test('limits results to 50 most recent', async () => {
    const prisma = require('@/lib/prisma').default
    prisma.workspace.findFirst.mockResolvedValueOnce(mockWorkspace)
    prisma.testRun.findMany.mockResolvedValueOnce([])

    const req = new NextRequest('http://localhost:3000/api/prompts/p1/test-runs', {
      headers: authHeaders,
    })
    await getPromptTestRuns(req, { params: { id: 'p1' } })
    expect(prisma.testRun.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 50 })
    )
  })
})
