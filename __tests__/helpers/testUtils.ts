import { NextRequest } from 'next/server'

export function makeAuthRequest(url: string, options: Record<string, any> = {}) {
  const headers = {
    Authorization: 'Bearer valid_token',
    ...(options.headers || {}),
  }
  return new NextRequest(url, {
    ...options,
    headers,
  })
}

export function setupAuthMock(userId = 'user123') {
  const { verifyAccessToken } = require('@/lib/jwt')
  verifyAccessToken.mockReturnValue({ userId, email: 'test@example.com' })
}

export function setupWorkspaceMock(workspaceId = 'workspace123', userId = 'user123') {
  const prisma = require('@/lib/prisma').default
  prisma.workspace.findFirst.mockResolvedValueOnce({
    id: workspaceId,
    user_id: userId,
    name: 'Test Workspace',
    slug: 'test',
  })
}

export function setupPrismaMock() {
  jest.mock('@/lib/prisma', () => {
    const mockClient = {
      user: { findUnique: jest.fn(), findFirst: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn() },
      userSettings: { findUnique: jest.fn(), create: jest.fn(), update: jest.fn() },
      workspace: { findUnique: jest.fn(), findFirst: jest.fn(), create: jest.fn(), update: jest.fn() },
      prompt: { findUnique: jest.fn(), findFirst: jest.fn(), findMany: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn(), count: jest.fn() },
      promptVersion: { findUnique: jest.fn(), findFirst: jest.fn(), findMany: jest.fn(), create: jest.fn(), update: jest.fn() },
      promptComposition: { findMany: jest.fn(), create: jest.fn(), update: jest.fn(), updateMany: jest.fn(), delete: jest.fn() },
      snippet: { findUnique: jest.fn(), findFirst: jest.fn(), findMany: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn(), count: jest.fn() },
      promptCategory: { findUnique: jest.fn(), findFirst: jest.fn(), findMany: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn() },
      agentInteractionType: { findUnique: jest.fn(), findFirst: jest.fn(), findMany: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn() },
      testRun: { findUnique: jest.fn(), findFirst: jest.fn(), findMany: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn(), count: jest.fn() },
      syncLog: { findMany: jest.fn(), create: jest.fn(), count: jest.fn(), deleteMany: jest.fn(), groupBy: jest.fn() },
      device: { findUnique: jest.fn(), create: jest.fn(), update: jest.fn() },
      $transaction: jest.fn((fn) => typeof fn === 'function' ? fn(mockClient) : Promise.resolve()),
    }
    return { __esModule: true, default: mockClient }
  })

  jest.mock('@/lib/jwt', () => ({
    generateAccessToken: jest.fn().mockReturnValue('mock_access_token'),
    generateRefreshToken: jest.fn().mockReturnValue('mock_refresh_token'),
    verifyAccessToken: jest.fn(),
    verifyRefreshToken: jest.fn(),
  }))

  jest.mock('@/lib/auth', () => ({
    authenticateUser: jest.fn(),
    hashPassword: jest.fn().mockResolvedValue('hashed_password'),
    verifyPassword: jest.fn(),
  }))
}

export const mockPrompt = {
  id: 'prompt1',
  name: 'Test Prompt',
  description: 'A test prompt',
  workspace_id: 'workspace123',
  category_id: null,
  tags: ['test'],
  model: 'claude-3-haiku',
  created_at: new Date('2026-04-20T10:00:00Z'),
  updated_at: new Date('2026-04-20T10:00:00Z'),
  versions: [{
    id: 'version1',
    version_number: 1,
    prompt_id: 'prompt1',
    template_body: 'Hello {{name}}',
    model_config: { temperature: 0.7, maxTokens: 500 },
    change_log: 'Initial version',
    created_by: 'user123',
    is_active: true,
    created_at: new Date('2026-04-20T10:00:00Z'),
  }],
}

export const mockSnippet = {
  id: 'snippet1',
  name: 'Test Snippet',
  description: 'A test snippet',
  content: 'You are a helpful assistant.',
  workspace_id: 'workspace123',
  created_at: new Date('2026-04-20T10:00:00Z'),
  updated_at: new Date('2026-04-20T10:00:00Z'),
}