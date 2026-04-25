import { NextRequest } from 'next/server'

jest.mock('@/lib/prisma', () => {
  const mockClient = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    oAuthAccount: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    userSettings: { create: jest.fn() },
    workspace: { create: jest.fn() },
  }
  return { __esModule: true, default: mockClient }
})

jest.mock('@/lib/jwt', () => ({
  generateAccessToken: jest.fn(() => 'mock-access-token'),
  generateRefreshToken: jest.fn(() => 'mock-refresh-token'),
}))

jest.mock('@/lib/google-oauth', () => ({
  getGoogleAuthUrl: jest.fn(() => 'https://accounts.google.com/o/oauth2/v2/auth?mock=true'),
  generateState: jest.fn(() => 'test-state-123'),
  exchangeCodeForTokens: jest.fn(),
  getGoogleUserInfo: jest.fn(),
}))

import { GET as googleRedirect } from '@/app/api/auth/google/route'
import { GET as googleCallback } from '@/app/api/auth/google/callback/route'
import { exchangeCodeForTokens, getGoogleUserInfo } from '@/lib/google-oauth'

describe('GET /api/auth/google', () => {
  test('redirects to Google auth URL with state cookie', async () => {
    const res = await googleRedirect()
    expect(res.status).toBe(307)
    const location = res.headers.get('location') || res.headers.get('Location')
    expect(location).toContain('accounts.google.com')
    expect(res.cookies.get('oauth_state')?.value).toBe('test-state-123')
  })
})

describe('GET /api/auth/google/callback', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('redirects to login with error if state mismatch', async () => {
    const req = new NextRequest('http://localhost:3000/api/auth/google/callback?code=abc&state=wrong')
    const res = await googleCallback(req)
    expect(res.status).toBe(307)
    const location = res.headers.get('location') || res.headers.get('Location') || ''
    expect(location).toContain('error=invalid_oauth_state')
  })

  test('creates new user from Google signup', async () => {
    const prisma = require('@/lib/prisma').default

    ;(exchangeCodeForTokens as jest.Mock).mockResolvedValueOnce({
      access_token: 'google-access-token',
      id_token: 'google-id-token',
    })
    ;(getGoogleUserInfo as jest.Mock).mockResolvedValueOnce({
      id: 'google-123',
      email: 'newuser@gmail.com',
      name: 'New User',
      picture: 'https://avatar.url/pic.jpg',
    })

    prisma.oAuthAccount.findUnique.mockResolvedValueOnce(null)
    prisma.user.findUnique.mockResolvedValueOnce(null)
    prisma.user.create.mockResolvedValueOnce({
      id: 'new-user-id',
      email: 'newuser@gmail.com',
      name: 'New User',
      image: 'https://avatar.url/pic.jpg',
    })
    prisma.oAuthAccount.create.mockResolvedValueOnce({ id: 'oauth-id' })
    prisma.userSettings.create.mockResolvedValueOnce({})
    prisma.workspace.create.mockResolvedValueOnce({})

    const req = new NextRequest('http://localhost:3000/api/auth/google/callback?code=abc&state=test-state-123')
    
    // Mock the cookie
    req.cookies.set('oauth_state', 'test-state-123')

    const res = await googleCallback(req)
    expect(res.status).toBe(307)
    const location = res.headers.get('location') || res.headers.get('Location') || ''
    expect(location).toContain('access_token')
    expect(location).toContain('mock-access-token')

    expect(prisma.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          email: 'newuser@gmail.com',
          password: null,
          name: 'New User',
        }),
      })
    )
    expect(prisma.oAuthAccount.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          provider: 'google',
          provider_id: 'google-123',
        }),
      })
    )
  })

  test('links existing user by email', async () => {
    const prisma = require('@/lib/prisma').default

    ;(exchangeCodeForTokens as jest.Mock).mockResolvedValueOnce({
      access_token: 'google-access-token',
      id_token: 'google-id-token',
    })
    ;(getGoogleUserInfo as jest.Mock).mockResolvedValueOnce({
      sub: 'google-456',
      email: 'existing@example.com',
      name: 'Existing User',
    })

    prisma.oAuthAccount.findUnique.mockResolvedValueOnce(null)
    prisma.user.findUnique.mockResolvedValueOnce({
      id: 'existing-user-id',
      email: 'existing@example.com',
      name: null,
      image: null,
    })
    prisma.oAuthAccount.create.mockResolvedValueOnce({ id: 'oauth-id' })
    prisma.user.update.mockResolvedValueOnce({})

    const req = new NextRequest('http://localhost:3000/api/auth/google/callback?code=abc&state=test-state-123')
    req.cookies.set('oauth_state', 'test-state-123')

    const res = await googleCallback(req)
    expect(res.status).toBe(307)

    expect(prisma.oAuthAccount.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          user_id: 'existing-user-id',
          provider: 'google',
        }),
      })
    )
    expect(prisma.user.create).not.toHaveBeenCalled()
  })

  test('logs in existing OAuth user', async () => {
    const prisma = require('@/lib/prisma').default

    ;(exchangeCodeForTokens as jest.Mock).mockResolvedValueOnce({
      access_token: 'google-access-token',
      id_token: 'google-id-token',
    })
    ;(getGoogleUserInfo as jest.Mock).mockResolvedValueOnce({
      id: 'google-123',
      email: 'existing@gmail.com',
      name: 'Updated Name',
    })

    prisma.oAuthAccount.findUnique.mockResolvedValueOnce({
      id: 'oauth-id',
      provider: 'google',
      provider_id: 'google-123',
      user_id: 'existing-user-id',
      user: {
        id: 'existing-user-id',
        email: 'existing@gmail.com',
        name: 'Old Name',
      },
    })
    prisma.oAuthAccount.update.mockResolvedValueOnce({})
    prisma.user.update.mockResolvedValueOnce({})

    const req = new NextRequest('http://localhost:3000/api/auth/google/callback?code=abc&state=test-state-123')
    req.cookies.set('oauth_state', 'test-state-123')

    const res = await googleCallback(req)
    expect(res.status).toBe(307)

    expect(prisma.oAuthAccount.update).toHaveBeenCalled()
    expect(prisma.user.update).toHaveBeenCalled()
  })
})