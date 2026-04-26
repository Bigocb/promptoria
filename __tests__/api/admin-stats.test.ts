import { NextRequest } from 'next/server'

jest.mock('@/lib/prisma', () => {
  const mockClient = {
    user: {
      count: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
    prompt: {
      count: jest.fn(),
      groupBy: jest.fn(),
      findMany: jest.fn(),
    },
    snippet: { count: jest.fn() },
    testRun: {
      count: jest.fn(),
      groupBy: jest.fn(),
    },
    promptVersion: { count: jest.fn() },
    userSettings: { findMany: jest.fn() },
  }
  return { __esModule: true, default: mockClient }
})

jest.mock('@/lib/jwt', () => ({
  verifyAccessToken: jest.fn(),
}))

const adminEmail = 'bobby.cloutier@gmail.com'

import { GET as getAdminStats } from '@/app/api/admin/stats/route'

describe('GET /api/admin/stats', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    const { verifyAccessToken } = require('@/lib/jwt')
    verifyAccessToken.mockReturnValue({ userId: 'admin1', email: adminEmail })
  })

  test('returns 401 without auth', async () => {
    const req = new NextRequest('http://localhost:3000/api/admin/stats')
    const res = await getAdminStats(req)
    expect(res.status).toBe(401)
  })

  test('returns 403 for non-admin user', async () => {
    const prisma = require('@/lib/prisma').default
    const { verifyAccessToken } = require('@/lib/jwt')
    verifyAccessToken.mockReturnValue({ userId: 'user1', email: 'regular@example.com' })
    prisma.user.findUnique.mockResolvedValue({ email: 'regular@example.com', subscription_tier: 'free' })
    const req = new NextRequest('http://localhost:3000/api/admin/stats', {
      headers: { Authorization: 'Bearer valid_token' },
    })
    const res = await getAdminStats(req)
    expect(res.status).toBe(403)
  })

  test('returns stats for admin user', async () => {
    const prisma = require('@/lib/prisma').default
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    prisma.user.count.mockResolvedValue(42)
    prisma.user.findUnique.mockResolvedValue({ email: adminEmail, subscription_tier: 'admin' })
    prisma.prompt.count.mockResolvedValue(200)
    prisma.snippet.count.mockResolvedValue(80)
    prisma.testRun.count.mockResolvedValue(500)
    prisma.promptVersion.count.mockResolvedValue(350)
    prisma.user.findMany
      .mockResolvedValueOnce([{
        id: 'u1', email: adminEmail, created_at: new Date(),
        workspaces: { id: 'ws1', _count: { prompts: 10, snippets: 5 } },
      }])
      .mockResolvedValueOnce([{ created_at: new Date() }])
    prisma.prompt.groupBy.mockResolvedValue([{ model: 'llama3.2', _count: { id: 150 } }])
    prisma.testRun.groupBy.mockResolvedValue([{ status: 'success', _count: { id: 400 } }])
    prisma.userSettings.findMany.mockResolvedValue([{ default_model: 'llama3.2' }, { default_model: 'mistral' }])
    prisma.prompt.findMany.mockResolvedValue([{ created_at: new Date() }])

    const req = new NextRequest('http://localhost:3000/api/admin/stats', {
      headers: { Authorization: 'Bearer admin_token' },
    })
    const res = await getAdminStats(req)
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.totals.users).toBe(42)
    expect(data.totals.prompts).toBe(200)
    expect(data.totals.snippets).toBe(80)
    expect(data.totals.testRuns).toBe(500)
    expect(data.modelsUsed).toHaveLength(1)
    expect(data.modelsUsed[0].model).toBe('llama3.2')
  })

  test('returns 401 with invalid token', async () => {
    const { verifyAccessToken } = require('@/lib/jwt')
    verifyAccessToken.mockImplementation(() => { throw new Error('Invalid') })
    const req = new NextRequest('http://localhost:3000/api/admin/stats', {
      headers: { Authorization: 'Bearer invalid_token' },
    })
    const res = await getAdminStats(req)
    expect(res.status).toBe(401)
  })
})