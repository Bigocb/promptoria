import { API_ENDPOINTS, API_BASE_URL } from '@/lib/api-config'

describe('API Configuration', () => {
  test('API_BASE_URL is a non-empty string', () => {
    expect(typeof API_BASE_URL).toBe('string')
    expect(API_BASE_URL.length).toBeGreaterThan(0)
  })

  test('API_ENDPOINTS has auth endpoints', () => {
    expect(API_ENDPOINTS.auth.login).toContain('/auth/login')
    expect(API_ENDPOINTS.auth.signup).toContain('/auth/signup')
    expect(API_ENDPOINTS.auth.refresh).toContain('/auth/refresh')
  })

  test('API_ENDPOINTS has prompt endpoints', () => {
    expect(API_ENDPOINTS.prompts.list).toContain('/prompts')
    expect(API_ENDPOINTS.prompts.create).toContain('/prompts')
    expect(API_ENDPOINTS.prompts.detail('123')).toContain('/prompts/123')
    expect(API_ENDPOINTS.prompts.update('456')).toContain('/prompts/456')
    expect(API_ENDPOINTS.prompts.delete('789')).toContain('/prompts/789')
    expect(API_ENDPOINTS.prompts.clone('abc')).toContain('/prompts/abc/clone')
  })

  test('API_ENDPOINTS has snippet endpoints', () => {
    expect(API_ENDPOINTS.snippets.list).toContain('/snippets')
    expect(API_ENDPOINTS.snippets.create).toContain('/snippets')
    expect(API_ENDPOINTS.snippets.update('123')).toContain('/snippets/123')
    expect(API_ENDPOINTS.snippets.delete('456')).toContain('/snippets/456')
  })

  test('API_ENDPOINTS has category endpoints', () => {
    expect(API_ENDPOINTS.categories.interactions.list).toBeDefined()
    expect(API_ENDPOINTS.categories.interactions.create).toBeDefined()
  })

  test('API_ENDPOINTS has test-runs endpoints', () => {
    expect(API_ENDPOINTS.testRuns.list).toContain('/test-runs')
    expect(API_ENDPOINTS.testRuns.create).toContain('/test-runs')
  })

  test('API_ENDPOINTS has dashboard endpoint', () => {
    expect(API_ENDPOINTS.dashboard.stats).toContain('/dashboard')
  })

  test('API_ENDPOINTS has models endpoint', () => {
    expect(API_ENDPOINTS.models).toContain('/models')
  })

  test('dynamic endpoints return correct URLs', () => {
    const id = 'test-id-123'
    expect(API_ENDPOINTS.prompts.detail(id)).toMatch(new RegExp(id))
    expect(API_ENDPOINTS.prompts.clone(id)).toMatch(new RegExp(id))
    expect(API_ENDPOINTS.prompts.update(id)).toMatch(new RegExp(id))
  })
})