import { NextRequest } from 'next/server'

jest.mock('@/lib/prisma', () => {
  const client = {
    $transaction: jest.fn(),
    user: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    workspace: {
      findFirst: jest.fn(),
    },
    promptVersion: {
      findUnique: jest.fn(),
    },
    testRun: {
      create: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
    },
    userSettings: {
      findUnique: jest.fn(),
    },
    syncLog: {
      create: jest.fn(),
    },
  }
  return { __esModule: true, default: client }
})

jest.mock('@/lib/jwt', () => ({
  verifyAccessToken: jest.fn(),
}))

jest.mock('@/lib/rate-limit', () => ({
  __esModule: true,
  default: () => Promise.resolve({ allowed: true, remaining: 10, resetAt: Date.now() + 60000 }),
}))

const mockFetch = jest.fn()
global.fetch = mockFetch as any

import { GET as getQuota } from '@/app/api/quota/route'
import { verifyAccessToken } from '@/lib/jwt'
import prisma from '@/lib/prisma'

describe('Token Quota API', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockFetch.mockReset()
  })

  test('GET /api/quota returns current usage and limit', async () => {
    ;(verifyAccessToken as jest.Mock).mockReturnValue({ userId: 'user-1', email: 'test@test.com' })
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
      daily_tokens_used: 1200,
      daily_tokens_limit: 5000,
      last_token_reset_at: new Date(),
    })

    const req = new NextRequest('http://localhost:3000/api/quota', {
      headers: { Authorization: 'Bearer valid-token' },
    })

    const res = await getQuota(req)
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.used).toBe(1200)
    expect(data.limit).toBe(5000)
    expect(data.remaining).toBe(3800)
  })

  test('GET /api/quota resets counter when new UTC day', async () => {
    ;(verifyAccessToken as jest.Mock).mockReturnValue({ userId: 'user-1', email: 'test@test.com' })
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
      daily_tokens_used: 4900,
      daily_tokens_limit: 5000,
      last_token_reset_at: new Date('2024-01-01'), // old day
    })

    const req = new NextRequest('http://localhost:3000/api/quota', {
      headers: { Authorization: 'Bearer valid-token' },
    })

    const res = await getQuota(req)
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.used).toBe(0)
    expect(data.remaining).toBe(5000)
  })

  test('GET /api/quota returns 401 without auth', async () => {
    const req = new NextRequest('http://localhost:3000/api/quota')
    const res = await getQuota(req)
    expect(res.status).toBe(401)
  })
})