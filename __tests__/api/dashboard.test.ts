import { NextRequest } from 'next/server'

jest.mock('@/lib/prisma', () => {
  const mockClient = {
    workspace: { findFirst: jest.fn() },
    prompt: { count: jest.fn(), findMany: jest.fn() },
    promptVersion: { count: jest.fn() },
    snippet: { count: jest.fn(), findMany: jest.fn() },
    agentInteractionType: { count: jest.fn() },
    promptCategory: { count: jest.fn() },
    testRun: { count: jest.fn(), findMany: jest.fn(), aggregate: jest.fn() },
    $transaction: jest.fn(),
  }
  return { __esModule: true, default: mockClient }
})

jest.mock('@/lib/jwt', () => ({
  verifyAccessToken: jest.fn(),
}))

import { GET as getStats } from '@/app/api/dashboard/stats/route'

const authHeaders = { Authorization: 'Bearer valid_token' }
const mockWorkspace = { id: 'ws1', user_id: 'user123', name: 'Test Workspace' }

describe('GET /api/dashboard/stats', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    const { verifyAccessToken } = require('@/lib/jwt')
    verifyAccessToken.mockReturnValue({ userId: 'user123' })
  })

  test('returns 401 without auth', async () => {
    const req = new NextRequest('http://localhost:3000/api/dashboard/stats')
    const res = await getStats(req)
    expect(res.status).toBe(401)
  })

  test('returns 401 with invalid token', async () => {
    const { verifyAccessToken } = require('@/lib/jwt')
    verifyAccessToken.mockImplementation(() => { throw new Error('Invalid') })
    const req = new NextRequest('http://localhost:3000/api/dashboard/stats', { headers: authHeaders })
    const res = await getStats(req)
    expect(res.status).toBe(401)
  })

  test('returns 404 if no workspace', async () => {
    const prisma = require('@/lib/prisma').default
    prisma.workspace.findFirst.mockResolvedValueOnce(null)
    const req = new NextRequest('http://localhost:3000/api/dashboard/stats', { headers: authHeaders })
    const res = await getStats(req)
    expect(res.status).toBe(404)
  })

  test('returns dashboard stats', async () => {
    const prisma = require('@/lib/prisma').default
    prisma.workspace.findFirst.mockResolvedValueOnce(mockWorkspace)
    prisma.prompt.count.mockResolvedValue(5)
    prisma.promptVersion.count.mockResolvedValue(12)
    prisma.snippet.count.mockResolvedValue(3)
    prisma.agentInteractionType.count.mockResolvedValue(2)
    prisma.promptCategory.count.mockResolvedValue(4)
    prisma.testRun.count
      .mockResolvedValueOnce(10)
      .mockResolvedValueOnce(8)
      .mockResolvedValueOnce(2)
    prisma.testRun.findMany
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
    prisma.prompt.findMany.mockResolvedValueOnce([
      { id: 'p1', name: 'Prompt 1', created_at: new Date(), updated_at: new Date() },
    ])
    prisma.snippet.findMany.mockResolvedValueOnce([
      { id: 's1', name: 'Snippet 1', created_at: new Date() },
    ])
    prisma.testRun.aggregate.mockResolvedValueOnce({ _avg: { duration_ms: 1500 } })

    const req = new NextRequest('http://localhost:3000/api/dashboard/stats', { headers: authHeaders })
    const res = await getStats(req)
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.workspace.name).toBe('Test Workspace')
    expect(data.resources.prompts).toBe(5)
    expect(data.resources.snippets).toBe(3)
    expect(data.testing.total_test_runs).toBe(10)
    expect(data.testing.successful_runs).toBe(8)
    expect(data.testing.failed_runs).toBe(2)
    expect(data.recent.prompts).toHaveLength(1)
    expect(data.recent.snippets).toHaveLength(1)
  })
})