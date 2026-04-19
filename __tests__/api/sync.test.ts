import { NextRequest } from 'next/server'

// Mock Prisma and JWT BEFORE importing route handler
jest.mock('@/lib/prisma', () => {
  const mockClient = {
    user: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    userSettings: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    workspace: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
    },
    device: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    syncLog: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
    $transaction: jest.fn(),
  }
  return {
    __esModule: true,
    default: mockClient,
  }
})

jest.mock('@/lib/jwt', () => ({
  verifyAccessToken: jest.fn(),
}))

import { GET as syncHandler } from '@/app/api/sync/route'

describe('GET /api/sync', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  const mockWorkspace = {
    id: 'workspace123',
    userId: 'user123',
  }

  const mockChanges = [
    {
      id: 'change1',
      action: 'create',
      entityType: 'prompt',
      entityId: 'prompt123',
      changedAt: new Date('2026-04-18T10:00:00Z'),
      data: { name: 'New Prompt', content: '...' },
    },
    {
      id: 'change2',
      action: 'update',
      entityType: 'snippet',
      entityId: 'snippet456',
      changedAt: new Date('2026-04-18T11:00:00Z'),
      data: { name: 'Updated Snippet' },
    },
  ]

  describe('Authentication', () => {
    test('returns 401 if Authorization header missing', async () => {
      const request = new NextRequest('http://localhost:3000/api/sync?lastSync=2026-04-18T00:00:00Z')
      const response = await syncHandler(request)
      expect(response.status).toBe(401)

      const data = await response.json()
      expect(data.error).toBeDefined()
    })

    test('returns 401 if Bearer token invalid', async () => {
      const { verifyAccessToken } = require('@/lib/jwt')
      verifyAccessToken.mockImplementationOnce(() => {
        throw new Error('Invalid token')
      })

      const request = new NextRequest('http://localhost:3000/api/sync?lastSync=2026-04-18T00:00:00Z', {
        headers: { Authorization: 'Bearer invalid_token' },
      })
      const response = await syncHandler(request)
      expect(response.status).toBe(401)

      const data = await response.json()
      expect(data.error).toBeDefined()
    })

    test('returns 401 if Bearer prefix missing', async () => {
      const request = new NextRequest('http://localhost:3000/api/sync?lastSync=2026-04-18T00:00:00Z', {
        headers: { Authorization: 'invalid_token' },
      })
      const response = await syncHandler(request)
      expect(response.status).toBe(401)

      const data = await response.json()
      expect(data.error).toBeDefined()
    })

    test('returns 401 if Authorization header is empty', async () => {
      const request = new NextRequest('http://localhost:3000/api/sync?lastSync=2026-04-18T00:00:00Z', {
        headers: { Authorization: '' },
      })
      const response = await syncHandler(request)
      expect(response.status).toBe(401)
    })

    test('returns 401 if Bearer token verification fails', async () => {
      const { verifyAccessToken } = require('@/lib/jwt')
      verifyAccessToken.mockImplementationOnce(() => {
        throw new Error('Token expired')
      })

      const request = new NextRequest('http://localhost:3000/api/sync?lastSync=2026-04-18T00:00:00Z', {
        headers: { Authorization: 'Bearer expired_token' },
      })
      const response = await syncHandler(request)
      expect(response.status).toBe(401)
    })
  })

  describe('Parameter Validation', () => {
    beforeEach(() => {
      const { verifyAccessToken } = require('@/lib/jwt')
      verifyAccessToken.mockReturnValue({ userId: 'user123', email: 'test@example.com' })
    })

    test('returns 400 if lastSync parameter missing', async () => {
      const request = new NextRequest('http://localhost:3000/api/sync', {
        headers: { Authorization: 'Bearer valid_token' },
      })
      const response = await syncHandler(request)
      expect(response.status).toBe(400)

      const data = await response.json()
      expect(data.error).toBeDefined()
    })

    test('returns 400 if lastSync timestamp invalid format', async () => {
      const request = new NextRequest('http://localhost:3000/api/sync?lastSync=not-a-timestamp', {
        headers: { Authorization: 'Bearer valid_token' },
      })
      const response = await syncHandler(request)
      expect(response.status).toBe(400)

      const data = await response.json()
      expect(data.error).toBeDefined()
    })

    test('returns 400 if lastSync is empty string', async () => {
      const request = new NextRequest('http://localhost:3000/api/sync?lastSync=', {
        headers: { Authorization: 'Bearer valid_token' },
      })
      const response = await syncHandler(request)
      expect(response.status).toBe(400)
    })

    test('accepts valid ISO 8601 timestamp format', async () => {
      const prisma = require('@/lib/prisma').default
      prisma.workspace.findFirst.mockResolvedValueOnce(mockWorkspace)
      prisma.syncLog.findMany.mockResolvedValueOnce([])

      const request = new NextRequest('http://localhost:3000/api/sync?lastSync=2026-04-18T00:00:00Z', {
        headers: { Authorization: 'Bearer valid_token' },
      })
      const response = await syncHandler(request)
      expect(response.status).toBe(200)
    })
  })

  describe('Workspace Validation', () => {
    beforeEach(() => {
      const { verifyAccessToken } = require('@/lib/jwt')
      verifyAccessToken.mockReturnValue({ userId: 'user123', email: 'test@example.com' })
    })

    test('returns 404 if user workspace not found', async () => {
      const prisma = require('@/lib/prisma').default
      prisma.workspace.findFirst.mockResolvedValueOnce(null)

      const request = new NextRequest('http://localhost:3000/api/sync?lastSync=2026-04-18T00:00:00Z', {
        headers: { Authorization: 'Bearer valid_token' },
      })
      const response = await syncHandler(request)
      expect(response.status).toBe(404)

      const data = await response.json()
      expect(data.error).toBeDefined()
    })
  })

  describe('Successful Sync Response', () => {
    beforeEach(() => {
      const { verifyAccessToken } = require('@/lib/jwt')
      verifyAccessToken.mockReturnValue({ userId: 'user123', email: 'test@example.com' })
    })

    test('returns 200 with changes array on success', async () => {
      const prisma = require('@/lib/prisma').default
      prisma.workspace.findFirst.mockResolvedValueOnce(mockWorkspace)
      prisma.syncLog.findMany.mockResolvedValueOnce(mockChanges)

      const request = new NextRequest('http://localhost:3000/api/sync?lastSync=2026-04-18T00:00:00Z', {
        headers: { Authorization: 'Bearer valid_token' },
      })
      const response = await syncHandler(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.synced_at).toBeDefined()
      expect(Array.isArray(data.changes)).toBe(true)
      expect(Array.isArray(data.conflicts)).toBe(true)
    })

    test('returns correct response structure', async () => {
      const prisma = require('@/lib/prisma').default
      prisma.workspace.findFirst.mockResolvedValueOnce(mockWorkspace)
      prisma.syncLog.findMany.mockResolvedValueOnce(mockChanges)

      const request = new NextRequest('http://localhost:3000/api/sync?lastSync=2026-04-18T00:00:00Z', {
        headers: { Authorization: 'Bearer valid_token' },
      })
      const response = await syncHandler(request)
      const data = await response.json()

      expect(data).toHaveProperty('synced_at')
      expect(data).toHaveProperty('changes')
      expect(data).toHaveProperty('conflicts')
      expect(typeof data.synced_at).toBe('string')
      expect(Array.isArray(data.changes)).toBe(true)
      expect(Array.isArray(data.conflicts)).toBe(true)
    })

    test('returns empty changes array if no changes since lastSync', async () => {
      const prisma = require('@/lib/prisma').default
      prisma.workspace.findFirst.mockResolvedValueOnce(mockWorkspace)
      prisma.syncLog.findMany.mockResolvedValueOnce([])

      const request = new NextRequest('http://localhost:3000/api/sync?lastSync=2026-04-18T00:00:00Z', {
        headers: { Authorization: 'Bearer valid_token' },
      })
      const response = await syncHandler(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.changes).toEqual([])
    })
  })

  describe('Error Handling', () => {
    beforeEach(() => {
      const { verifyAccessToken } = require('@/lib/jwt')
      verifyAccessToken.mockReturnValue({ userId: 'user123', email: 'test@example.com' })
    })

    test('handles database connection errors gracefully', async () => {
      const prisma = require('@/lib/prisma').default
      prisma.workspace.findFirst.mockRejectedValueOnce(new Error('Database connection failed'))

      const request = new NextRequest('http://localhost:3000/api/sync?lastSync=2026-04-18T00:00:00Z', {
        headers: { Authorization: 'Bearer valid_token' },
      })
      const response = await syncHandler(request)
      expect(response.status).toBe(500)
    })

    test('handles invalid lastSync with non-ISO format gracefully', async () => {
      const request = new NextRequest('http://localhost:3000/api/sync?lastSync=definitely-not-a-date', {
        headers: { Authorization: 'Bearer valid_token' },
      })
      const response = await syncHandler(request)
      expect(response.status).toBe(400)
    })

    test('returns error message in JSON format', async () => {
      const request = new NextRequest('http://localhost:3000/api/sync?lastSync=invalid', {
        headers: { Authorization: 'Bearer valid_token' },
      })
      const response = await syncHandler(request)
      const data = await response.json()

      expect(data).toHaveProperty('error')
      expect(typeof data.error).toBe('string')
    })
  })
})
