import { NextRequest } from 'next/server'

jest.mock('@/lib/prisma', () => {
  const mockClient = {
    user: { findUnique: jest.fn(), findFirst: jest.fn() },
    userSettings: { findUnique: jest.fn(), create: jest.fn(), update: jest.fn() },
    workspace: { findFirst: jest.fn() },
    $transaction: jest.fn(),
  }
  return { __esModule: true, default: mockClient }
})

jest.mock('@/lib/jwt', () => ({
  verifyAccessToken: jest.fn(),
}))

import { GET as getSettings, PUT as updateSettings } from '@/app/api/user/settings/route'

const authHeaders = { Authorization: 'Bearer valid_token' }

describe('GET /api/user/settings', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    const { verifyAccessToken } = require('@/lib/jwt')
    verifyAccessToken.mockReturnValue({ userId: 'user123' })
  })

  test('returns 401 without auth', async () => {
    const req = new NextRequest('http://localhost:3000/api/user/settings')
    const res = await getSettings(req)
    expect(res.status).toBe(401)
  })

  test('returns 401 with invalid token', async () => {
    const { verifyAccessToken } = require('@/lib/jwt')
    verifyAccessToken.mockImplementation(() => { throw new Error('Invalid') })
    const req = new NextRequest('http://localhost:3000/api/user/settings', { headers: authHeaders })
    const res = await getSettings(req)
    expect(res.status).toBe(401)
  })

  test('returns default settings when none exist', async () => {
    const prisma = require('@/lib/prisma').default
    prisma.userSettings.findUnique.mockResolvedValueOnce(null)
    const req = new NextRequest('http://localhost:3000/api/user/settings', { headers: authHeaders })
    const res = await getSettings(req)
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.defaultModel).toBe('llama3.2')
    expect(data.suggestionsEnabled).toBe(true)
    expect(data.theme).toBe('light')
  })

  test('returns existing settings in camelCase', async () => {
    const prisma = require('@/lib/prisma').default
    prisma.userSettings.findUnique.mockResolvedValueOnce({
      theme: 'gruvbox-dark',
      suggestions_enabled: true,
      default_model: 'mistral',
      default_temperature: 0.9,
      default_max_tokens: 1024,
    })
    const req = new NextRequest('http://localhost:3000/api/user/settings', { headers: authHeaders })
    const res = await getSettings(req)
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.defaultModel).toBe('mistral')
    expect(data.defaultTemperature).toBe(0.9)
    expect(data.defaultMaxTokens).toBe(1024)
    expect(data.suggestionsEnabled).toBe(true)
    expect(data.theme).toBe('gruvbox-dark')
  })
})

describe('PUT /api/user/settings', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    const { verifyAccessToken } = require('@/lib/jwt')
    verifyAccessToken.mockReturnValue({ userId: 'user123' })
  })

  test('returns 401 without auth', async () => {
    const req = new NextRequest('http://localhost:3000/api/user/settings', {
      method: 'PUT',
      body: JSON.stringify({ defaultModel: 'llama3.2' }),
    })
    const res = await updateSettings(req)
    expect(res.status).toBe(401)
  })

  test('creates settings when none exist', async () => {
    const prisma = require('@/lib/prisma').default
    prisma.userSettings.findUnique.mockResolvedValueOnce(null)
    prisma.userSettings.create.mockResolvedValueOnce({ id: 's1', user_id: 'user123' })
    prisma.userSettings.update.mockResolvedValueOnce({
      theme: 'gruvbox-dark',
      suggestions_enabled: true,
      default_model: 'llama3.2',
      default_temperature: 0.7,
      default_max_tokens: 500,
    })
    const req = new NextRequest('http://localhost:3000/api/user/settings', {
      method: 'PUT',
      headers: { ...authHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ defaultModel: 'llama3.2' }),
    })
    const res = await updateSettings(req)
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.defaultModel).toBe('llama3.2')
  })

  test('updates individual setting', async () => {
    const prisma = require('@/lib/prisma').default
    prisma.userSettings.findUnique.mockResolvedValueOnce({
      theme: 'gruvbox-dark',
      suggestions_enabled: true,
      default_model: 'llama3.2',
      default_temperature: 0.7,
      default_max_tokens: 500,
    })
    prisma.userSettings.update.mockResolvedValueOnce({
      theme: 'gruvbox-dark',
      suggestions_enabled: true,
      default_model: 'mistral',
      default_temperature: 0.7,
      default_max_tokens: 500,
    })
    const req = new NextRequest('http://localhost:3000/api/user/settings', {
      method: 'PUT',
      headers: { ...authHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ defaultModel: 'mistral' }),
    })
    const res = await updateSettings(req)
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.defaultModel).toBe('mistral')
  })

  test('accepts camelCase keys from client', async () => {
    const prisma = require('@/lib/prisma').default
    prisma.userSettings.findUnique.mockResolvedValueOnce({
      theme: 'light',
      suggestions_enabled: true,
      default_model: 'llama3.2',
      default_temperature: 0.7,
      default_max_tokens: 500,
    })
    prisma.userSettings.update.mockResolvedValueOnce({
      theme: 'light',
      suggestions_enabled: false,
      default_model: 'llama3.2',
      default_temperature: 0.5,
      default_max_tokens: 256,
    })
    const req = new NextRequest('http://localhost:3000/api/user/settings', {
      method: 'PUT',
      headers: { ...authHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ suggestionsEnabled: false, defaultTemperature: 0.5, defaultMaxTokens: 256 }),
    })
    const res = await updateSettings(req)
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.suggestionsEnabled).toBe(false)
    expect(data.defaultTemperature).toBe(0.5)
    expect(data.defaultMaxTokens).toBe(256)
  })
})