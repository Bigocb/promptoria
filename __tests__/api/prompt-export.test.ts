import { NextRequest } from 'next/server'

jest.mock('@/lib/prisma', () => {
  const mockClient = {
    workspace: { findFirst: jest.fn() },
    prompt: { findFirst: jest.fn() },
  }
  return { __esModule: true, default: mockClient }
})

jest.mock('@/lib/jwt', () => ({
  verifyAccessToken: jest.fn(),
}))

import { GET as exportPrompt } from '@/app/api/prompts/[id]/export/route'

const authHeaders = { Authorization: 'Bearer valid_token' }
const mockWorkspace = { id: 'ws1', user_id: 'user123' }

const makePrompt = (id: string) => ({
  id,
  name: 'Test Prompt',
  description: 'A test',
  model: 'llama3.2:3b',
  tags: ['test', 'demo'],
  created_at: new Date('2026-04-20T10:00:00Z'),
  workspace_id: 'ws1',
  versions: [
    {
      id: 'v1',
      version_number: 2,
      template_body: 'Hello {name}, welcome to {place}!',
      model_config: null,
      change_log: 'Updated greeting',
      created_at: new Date('2026-04-20T11:00:00Z'),
    },
    {
      id: 'v2',
      version_number: 1,
      template_body: 'Hi {name}',
      model_config: null,
      change_log: 'Initial version',
      created_at: new Date('2026-04-20T10:00:00Z'),
    },
  ],
  category: { id: 'c1', name: 'Greetings' },
})

describe('GET /api/prompts/[id]/export', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    const { verifyAccessToken } = require('@/lib/jwt')
    verifyAccessToken.mockReturnValue({ userId: 'user123' })
  })

  test('returns 401 without auth', async () => {
    const req = new NextRequest('http://localhost:3000/api/prompts/p1/export')
    const res = await exportPrompt(req, { params: { id: 'p1' } })
    expect(res.status).toBe(401)
  })

  test('returns 404 if workspace not found', async () => {
    const prisma = require('@/lib/prisma').default
    prisma.workspace.findFirst.mockResolvedValueOnce(null)
    const req = new NextRequest('http://localhost:3000/api/prompts/p1/export', { headers: authHeaders })
    const res = await exportPrompt(req, { params: { id: 'p1' } })
    expect(res.status).toBe(404)
  })

  test('returns 404 if prompt does not exist in workspace', async () => {
    const prisma = require('@/lib/prisma').default
    prisma.workspace.findFirst.mockResolvedValueOnce(mockWorkspace)
    prisma.prompt.findFirst.mockResolvedValueOnce(null)
    const req = new NextRequest('http://localhost:3000/api/prompts/p1/export', { headers: authHeaders })
    const res = await exportPrompt(req, { params: { id: 'p1' } })
    expect(res.status).toBe(404)
  })

  test('exports JSON with correct headers', async () => {
    const prisma = require('@/lib/prisma').default
    prisma.workspace.findFirst.mockResolvedValueOnce(mockWorkspace)
    prisma.prompt.findFirst.mockResolvedValueOnce(makePrompt('p1'))

    const req = new NextRequest('http://localhost:3000/api/prompts/p1/export?format=json', { headers: authHeaders })
    const res = await exportPrompt(req, { params: { id: 'p1' } })
    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toBe('application/json')
    expect(res.headers.get('content-disposition')).toContain('test_prompt.json')

    const body = await res.json()
    expect(body.name).toBe('Test Prompt')
    expect(body.model).toBe('llama3.2:3b')
    expect(body.tags).toEqual(['test', 'demo'])
    expect(body.versions).toHaveLength(2)
    expect(body.versions[0].version_number).toBe(2)
    expect(body.variables).toContain('name')
    expect(body.variables).toContain('place')
    expect(body.category).toBe('Greetings')
  })

  test('exports Markdown with correct headers', async () => {
    const prisma = require('@/lib/prisma').default
    prisma.workspace.findFirst.mockResolvedValueOnce(mockWorkspace)
    prisma.prompt.findFirst.mockResolvedValueOnce(makePrompt('p1'))

    const req = new NextRequest('http://localhost:3000/api/prompts/p1/export?format=markdown', { headers: authHeaders })
    const res = await exportPrompt(req, { params: { id: 'p1' } })
    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toContain('text/markdown')
    expect(res.headers.get('content-disposition')).toContain('test_prompt.md')

    const body = await res.text()
    expect(body).toContain('# Test Prompt')
    expect(body).toContain('## Metadata')
    expect(body).toContain('**Model**')
    expect(body).toContain('llama3.2:3b')
    expect(body).toContain('**Tags**')
    expect(body).toContain('test')
    expect(body).toContain('## Prompt Template')
    expect(body).toContain('Hello {name}, welcome to {place}!')
    expect(body).toContain('## Variables')
    expect(body).toContain('`{name}`')
    expect(body).toContain('`{place}`')
    expect(body).toContain('## Version History')
    expect(body).toContain('v2')
    expect(body).toContain('v1')
  })

  test('defaults to JSON when no format specified', async () => {
    const prisma = require('@/lib/prisma').default
    prisma.workspace.findFirst.mockResolvedValueOnce(mockWorkspace)
    prisma.prompt.findFirst.mockResolvedValueOnce(makePrompt('p1'))

    const req = new NextRequest('http://localhost:3000/api/prompts/p1/export', { headers: authHeaders })
    const res = await exportPrompt(req, { params: { id: 'p1' } })
    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toBe('application/json')
  })

  test('escapes special chars in filename for markdown export', async () => {
    const prisma = require('@/lib/prisma').default
    const prompt = makePrompt('p2')
    prompt.name = 'My Prompt: v1.0!'
    prisma.workspace.findFirst.mockResolvedValueOnce(mockWorkspace)
    prisma.prompt.findFirst.mockResolvedValueOnce(prompt)

    const req = new NextRequest('http://localhost:3000/api/prompts/p2/export?format=markdown', { headers: authHeaders })
    const res = await exportPrompt(req, { params: { id: 'p2' } })
    expect(res.headers.get('content-disposition')).toContain('my_prompt__v1_0_.md')
  })
})
