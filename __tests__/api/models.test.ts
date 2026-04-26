import { NextRequest } from 'next/server'
import { GET as getModels } from '@/app/api/models/route'

describe('GET /api/models', () => {
  test('returns static models for unauthenticated user (free tier default)', async () => {
    const req = new NextRequest('http://localhost:3000/api/models')
    const res = await getModels(req)
    expect(res.status).toBe(200)

    const data = await res.json()
    expect(data.models).toBeDefined()
    expect(Array.isArray(data.models)).toBe(true)
    expect(data.models.length).toBeGreaterThanOrEqual(4) // free tier models
    expect(data.user_tier).toBe('free')
  })

  test('pro tier via JWT payload returns more models', async () => {
    const payload = Buffer.from(JSON.stringify({ sub: 'user-1', email: 'test@test.com', tier: 'pro' })).toString('base64')
    const fakeToken = `header.${payload}.signature`

    const req = new NextRequest('http://localhost:3000/api/models', {
      headers: { Authorization: `Bearer ${fakeToken}` },
    })
    const res = await getModels(req)
    const data = await res.json()

    expect(data.user_tier).toBe('pro')
    expect(data.models.length).toBeGreaterThanOrEqual(7) // free + pro models
  })

  test('enterprise tier returns all models', async () => {
    const payload = Buffer.from(JSON.stringify({ sub: 'user-1', email: 'test@test.com', tier: 'enterprise' })).toString('base64')
    const fakeToken = `header.${payload}.signature`

    const req = new NextRequest('http://localhost:3000/api/models', {
      headers: { Authorization: `Bearer ${fakeToken}` },
    })
    const res = await getModels(req)
    const data = await res.json()

    expect(data.user_tier).toBe('enterprise')
    expect(data.models.length).toBeGreaterThanOrEqual(7)
  })

  test('each model has required fields', async () => {
    const req = new NextRequest('http://localhost:3000/api/models')
    const res = await getModels(req)
    const data = await res.json()

    data.models.forEach((m: any) => {
      expect(m).toHaveProperty('id')
      expect(m).toHaveProperty('name')
      expect(m).toHaveProperty('description')
      expect(m).toHaveProperty('family')
      expect(m).toHaveProperty('contextWindow')
      expect(m).toHaveProperty('maxTokens')
      expect(m).toHaveProperty('tier_required')
    })
  })
})
