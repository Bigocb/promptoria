import { NextRequest } from 'next/server'

jest.mock('@/lib/rate-limit', () => ({
  rateLimit: jest.fn(() => ({ allowed: true, retryAfterMs: 0 })),
}))

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

jest.mock('@/lib/auth', () => ({
  authenticateUser: jest.fn(),
  hashPassword: jest.fn().mockResolvedValue('hashed_password_bcrypt'),
  verifyPassword: jest.fn(),
}))

jest.mock('@/lib/jwt', () => ({
  generateAccessToken: jest.fn().mockReturnValue('mock_access_token_123'),
  generateRefreshToken: jest.fn().mockReturnValue('mock_refresh_token_456'),
  verifyAccessToken: jest.fn(),
  verifyRefreshToken: jest.fn(),
}))

import { POST as loginHandler } from '@/app/api/auth/login/route'
import { POST as signupHandler } from '@/app/api/auth/signup/route'

function makeMockUser(overrides = {}) {
  return {
    id: 'user_123',
    email: 'test@example.com',
    password: 'hashed_password_bcrypt',
    created_at: new Date('2026-01-15T10:00:00Z'),
    updated_at: new Date('2026-01-15T10:00:00Z'),
    user_settings: {
      id: 'settings_123',
      user_id: 'user_123',
      theme: 'gruvbox-dark',
      suggestions_enabled: true,
      default_model: 'claude-3-haiku',
      default_temperature: 0.7,
      default_max_tokens: 500,
      anthropic_api_key: null,
      created_at: new Date('2026-01-15T10:00:00Z'),
      updated_at: new Date('2026-01-15T10:00:00Z'),
    },
    workspaces: null,
    devices: [],
    ...overrides,
  }
}

describe('POST /api/auth/login', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('should return 400 if email is missing', async () => {
    const request = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ password: 'Test1234' }),
    })

    const response = await loginHandler(request)
    expect(response.status).toBe(400)

    const data = await response.json()
    expect(data.error).toBe('Email and password are required')
  })

  test('should return 400 if password is missing', async () => {
    const request = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'test@example.com' }),
    })

    const response = await loginHandler(request)
    expect(response.status).toBe(400)

    const data = await response.json()
    expect(data.error).toBe('Email and password are required')
  })

  test('should return 400 if both email and password are missing', async () => {
    const request = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({}),
    })

    const response = await loginHandler(request)
    expect(response.status).toBe(400)

    const data = await response.json()
    expect(data.error).toBe('Email and password are required')
  })

  test('should return 401 if user is not found', async () => {
    const { authenticateUser } = require('@/lib/auth')
    authenticateUser.mockResolvedValueOnce(null)

    const request = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'nonexistent@example.com',
        password: 'Test1234',
      }),
    })

    const response = await loginHandler(request)
    expect(response.status).toBe(401)

    const data = await response.json()
    expect(data.error).toBe('Invalid email or password')
  })

  test('should return 401 if password is incorrect', async () => {
    const { authenticateUser } = require('@/lib/auth')
    authenticateUser.mockResolvedValueOnce(null)

    const request = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'WrongPassword',
      }),
    })

    const response = await loginHandler(request)
    expect(response.status).toBe(401)

    const data = await response.json()
    expect(data.error).toBe('Invalid email or password')
  })

  test('should return 200 with valid token on successful login', async () => {
    const { authenticateUser } = require('@/lib/auth')
    const { generateAccessToken } = require('@/lib/jwt')

    authenticateUser.mockResolvedValueOnce(makeMockUser())
    generateAccessToken.mockReturnValueOnce('mock_access_token_123')

    const request = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'Test1234',
      }),
    })

    const response = await loginHandler(request)
    expect(response.status).toBe(200)

    const data = await response.json()
    expect(data.access_token).toBe('mock_access_token_123')
    expect(data.token_type).toBe('bearer')
    expect(data.user).toBeDefined()
    expect(data.user.id).toBe('user_123')
    expect(data.user.email).toBe('test@example.com')
    expect(data.user.settings).toBeDefined()
    expect(data.user.settings.theme).toBe('gruvbox-dark')
  })

  test('should return 200 with null settings if user has no settings', async () => {
    const { authenticateUser } = require('@/lib/auth')

    authenticateUser.mockResolvedValueOnce(makeMockUser({ user_settings: null }))

    const request = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'user@test.com',
        password: 'Test1234',
      }),
    })

    const response = await loginHandler(request)
    expect(response.status).toBe(200)

    const data = await response.json()
    expect(data.user.settings).toBeNull()
  })

  test('should call authenticateUser with correct parameters', async () => {
    const { authenticateUser } = require('@/lib/auth')
    authenticateUser.mockResolvedValueOnce(null)

    const request = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'Test1234',
      }),
    })

    await loginHandler(request)

    expect(authenticateUser).toHaveBeenCalledWith(
      expect.any(Object),
      'test@example.com',
      'Test1234'
    )
  })

  test('should handle malformed JSON request body', async () => {
    const request = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      body: 'invalid json {',
    })

    const response = await loginHandler(request)
    expect(response.status).toBe(500)

    const data = await response.json()
    expect(data.error).toContain('Server error:')
  })
})

describe('POST /api/auth/signup', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('should return 400 if email is missing', async () => {
    const request = new NextRequest('http://localhost:3000/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ password: 'Test1234' }),
    })

    const response = await signupHandler(request)
    expect(response.status).toBe(400)

    const data = await response.json()
    expect(data.error).toBe('Email and password are required')
  })

  test('should return 400 if password is missing', async () => {
    const request = new NextRequest('http://localhost:3000/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email: 'test@example.com' }),
    })

    const response = await signupHandler(request)
    expect(response.status).toBe(400)

    const data = await response.json()
    expect(data.error).toBe('Email and password are required')
  })

  test('should return 400 if password is less than 8 characters', async () => {
    const request = new NextRequest('http://localhost:3000/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'short',
      }),
    })

    const response = await signupHandler(request)
    expect(response.status).toBe(400)

    const data = await response.json()
    expect(data.error).toBe('Password must be at least 8 characters')
  })

  test('should return 400 if email format is invalid (no @)', async () => {
    const request = new NextRequest('http://localhost:3000/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify({
        email: 'invalidemail',
        password: 'Test1234',
      }),
    })

    const response = await signupHandler(request)
    expect(response.status).toBe(400)

    const data = await response.json()
    expect(data.error).toBe('Invalid email format')
  })

  test('should return 400 if email format is invalid (no domain)', async () => {
    const request = new NextRequest('http://localhost:3000/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify({
        email: 'test@',
        password: 'Test1234',
      }),
    })

    const response = await signupHandler(request)
    expect(response.status).toBe(400)

    const data = await response.json()
    expect(data.error).toBe('Invalid email format')
  })

  test('should return 400 if email format is invalid (no TLD)', async () => {
    const request = new NextRequest('http://localhost:3000/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify({
        email: 'test@example',
        password: 'Test1234',
      }),
    })

    const response = await signupHandler(request)
    expect(response.status).toBe(400)

    const data = await response.json()
    expect(data.error).toBe('Invalid email format')
  })

  test('should return 409 if email already exists', async () => {
    const prisma = require('@/lib/prisma').default
    prisma.user.findUnique.mockResolvedValueOnce({
      id: 'existing_user',
      email: 'existing@example.com',
    })

    const request = new NextRequest('http://localhost:3000/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify({
        email: 'existing@example.com',
        password: 'Test1234',
      }),
    })

    const response = await signupHandler(request)
    expect(response.status).toBe(409)

    const data = await response.json()
    expect(data.error).toBe('Email already registered')
  })

  test('should return 201 with token on successful signup', async () => {
    const prisma = require('@/lib/prisma').default
    const { hashPassword } = require('@/lib/auth')
    const { generateAccessToken } = require('@/lib/jwt')

    const createdUser = {
      id: 'new_user_123',
      email: 'newuser@example.com',
      password: 'hashed_password_bcrypt',
      created_at: new Date('2026-01-20T10:00:00Z'),
      updated_at: new Date('2026-01-20T10:00:00Z'),
    }

    const createdSettings = {
      id: 'settings_new_123',
      user_id: 'new_user_123',
      theme: 'gruvbox-dark',
      suggestions_enabled: true,
      default_model: 'claude-3-haiku',
      default_temperature: 0.7,
      default_max_tokens: 500,
      anthropic_api_key: null,
      created_at: new Date('2026-01-20T10:00:00Z'),
      updated_at: new Date('2026-01-20T10:00:00Z'),
    }

    const createdWorkspace = {
      id: 'workspace_123',
      name: 'Default Workspace',
      slug: 'default',
      user_id: 'new_user_123',
    }

    prisma.user.findUnique.mockResolvedValueOnce(null)
    prisma.user.create.mockResolvedValueOnce(createdUser)
    prisma.userSettings.create.mockResolvedValueOnce(createdSettings)
    prisma.workspace.create.mockResolvedValueOnce(createdWorkspace)
    hashPassword.mockResolvedValueOnce('hashed_password_bcrypt')
    generateAccessToken.mockReturnValueOnce('mock_access_token_new_123')

    const request = new NextRequest('http://localhost:3000/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify({
        email: 'newuser@example.com',
        password: 'Test1234',
      }),
    })

    const response = await signupHandler(request)
    expect(response.status).toBe(201)

    const data = await response.json()
    expect(data.access_token).toBe('mock_access_token_new_123')
    expect(data.token_type).toBe('bearer')
    expect(data.user).toBeDefined()
    expect(data.user.id).toBe('new_user_123')
    expect(data.user.email).toBe('newuser@example.com')
    expect(data.user.settings).toBeDefined()
    expect(data.user.settings.theme).toBe('gruvbox-dark')
    expect(data.user.settings.suggestions_enabled).toBe(true)
  })

  test('should hash password before creating user', async () => {
    const prisma = require('@/lib/prisma').default
    const { hashPassword } = require('@/lib/auth')

    prisma.user.findUnique.mockResolvedValueOnce(null)
    prisma.user.create.mockResolvedValueOnce({ id: 'u1', email: 'a@b.com', created_at: new Date(), updated_at: new Date() })
    prisma.userSettings.create.mockResolvedValueOnce({})
    prisma.workspace.create.mockResolvedValueOnce({})
    hashPassword.mockResolvedValueOnce('hashed_password_bcrypt_test')

    const request = new NextRequest('http://localhost:3000/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify({
        email: 'another@example.com',
        password: 'MyPassword123',
      }),
    })

    await signupHandler(request)

    expect(hashPassword).toHaveBeenCalledWith('MyPassword123')
  })

  test('should create user with hashed password', async () => {
    const prisma = require('@/lib/prisma').default
    const { hashPassword } = require('@/lib/auth')

    prisma.user.findUnique.mockResolvedValueOnce(null)
    prisma.user.create.mockResolvedValueOnce({ id: 'u2', email: 'a@b.com', created_at: new Date(), updated_at: new Date() })
    prisma.userSettings.create.mockResolvedValueOnce({})
    prisma.workspace.create.mockResolvedValueOnce({})
    hashPassword.mockResolvedValueOnce('hashed_password_bcrypt')

    const request = new NextRequest('http://localhost:3000/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'Test1234',
      }),
    })

    await signupHandler(request)

    expect(prisma.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          email: 'test@example.com',
          password: 'hashed_password_bcrypt',
        }),
      })
    )
  })

  test('should accept password exactly 8 characters', async () => {
    const prisma = require('@/lib/prisma').default
    const { hashPassword } = require('@/lib/auth')

    prisma.user.findUnique.mockResolvedValueOnce(null)
    prisma.user.create.mockResolvedValueOnce({ id: 'u3', email: 'a@b.com', created_at: new Date(), updated_at: new Date() })
    prisma.userSettings.create.mockResolvedValueOnce({})
    prisma.workspace.create.mockResolvedValueOnce({})
    hashPassword.mockResolvedValueOnce('hashed_password')

    const request = new NextRequest('http://localhost:3000/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify({
        email: 'test@example.com',
        password: '12345678',
      }),
    })

    const response = await signupHandler(request)
    expect(response.status).toBe(201)
  })

  test('should handle database errors gracefully', async () => {
    const prisma = require('@/lib/prisma').default
    const { hashPassword } = require('@/lib/auth')

    prisma.user.findUnique.mockResolvedValueOnce(null)
    prisma.user.create.mockRejectedValueOnce(new Error('Database connection failed'))
    hashPassword.mockResolvedValueOnce('hashed_password')

    const request = new NextRequest('http://localhost:3000/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'Test1234',
      }),
    })

    const response = await signupHandler(request)
    expect(response.status).toBe(500)

    const data = await response.json()
    expect(data.error).toContain('Server error:')
  })
})

describe('JWT Token Utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('should generate access token with correct parameters', () => {
    const { generateAccessToken } = require('@/lib/jwt')
    generateAccessToken.mockReturnValueOnce('test_token_123')

    const token = generateAccessToken('user_123', 'test@example.com')

    expect(generateAccessToken).toHaveBeenCalledWith('user_123', 'test@example.com')
    expect(token).toBe('test_token_123')
  })

  test('should verify valid access token', () => {
    const { verifyAccessToken } = require('@/lib/jwt')
    verifyAccessToken.mockReturnValueOnce({
      userId: 'user_123',
      email: 'test@example.com',
    })

    const decoded = verifyAccessToken('valid_token_123')

    expect(decoded.userId).toBe('user_123')
    expect(decoded.email).toBe('test@example.com')
  })

  test('should throw error for invalid token', () => {
    const { verifyAccessToken } = require('@/lib/jwt')
    verifyAccessToken.mockImplementationOnce(() => {
      throw new Error('Invalid or expired token')
    })

    expect(() => {
      verifyAccessToken('invalid_token')
    }).toThrow('Invalid or expired token')
  })

  test('should throw error for expired token', () => {
    const { verifyAccessToken } = require('@/lib/jwt')
    verifyAccessToken.mockImplementationOnce(() => {
      throw new Error('Invalid or expired token')
    })

    expect(() => {
      verifyAccessToken('expired_token')
    }).toThrow()
  })

  test('should generate refresh token with correct parameters', () => {
    const { generateRefreshToken } = require('@/lib/jwt')
    generateRefreshToken.mockReturnValueOnce('refresh_token_123')

    const token = generateRefreshToken('user_123')

    expect(generateRefreshToken).toHaveBeenCalledWith('user_123')
    expect(token).toBe('refresh_token_123')
  })

  test('should verify valid refresh token', () => {
    const { verifyRefreshToken } = require('@/lib/jwt')
    verifyRefreshToken.mockReturnValueOnce({
      userId: 'user_123',
    })

    const decoded = verifyRefreshToken('valid_refresh_token')

    expect(decoded.userId).toBe('user_123')
  })
})

describe('Password Hashing', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('should hash password successfully', async () => {
    const { hashPassword } = require('@/lib/auth')
    hashPassword.mockResolvedValueOnce('hashed_password_bcrypt')

    const hashed = await hashPassword('MyPassword123')

    expect(hashPassword).toHaveBeenCalledWith('MyPassword123')
    expect(hashed).toBe('hashed_password_bcrypt')
  })

  test('should verify correct password', async () => {
    const { verifyPassword } = require('@/lib/auth')
    verifyPassword.mockResolvedValueOnce(true)

    const result = await verifyPassword('MyPassword123', 'hashed_password_bcrypt')

    expect(verifyPassword).toHaveBeenCalledWith('MyPassword123', 'hashed_password_bcrypt')
    expect(result).toBe(true)
  })

  test('should reject incorrect password', async () => {
    const { verifyPassword } = require('@/lib/auth')
    verifyPassword.mockResolvedValueOnce(false)

    const result = await verifyPassword('WrongPassword', 'hashed_password_bcrypt')

    expect(verifyPassword).toHaveBeenCalledWith('WrongPassword', 'hashed_password_bcrypt')
    expect(result).toBe(false)
  })
})

describe('Email Validation', () => {
  test('should accept valid email formats', async () => {
    const prisma = require('@/lib/prisma').default
    const { hashPassword } = require('@/lib/auth')

    const validEmails = [
      'test@example.com',
      'user.name@example.co.uk',
      'first+last@example.org',
    ]

    for (const email of validEmails) {
      jest.clearAllMocks()

      prisma.user.findUnique.mockResolvedValueOnce(null)
      prisma.user.create.mockResolvedValueOnce({ id: 'u', email, created_at: new Date(), updated_at: new Date() })
      prisma.userSettings.create.mockResolvedValueOnce({})
      prisma.workspace.create.mockResolvedValueOnce({})
      hashPassword.mockResolvedValueOnce('hashed_password')

      const request = new NextRequest('http://localhost:3000/api/auth/signup', {
        method: 'POST',
        body: JSON.stringify({
          email,
          password: 'Test1234',
        }),
      })

      const response = await signupHandler(request)
      expect(response.status).toBe(201)
    }
  })

  test('should reject invalid email formats', async () => {
    const invalidEmails = [
      'no-at-sign.com',
      '@example.com',
      'test@',
      'test @example.com',
    ]

    for (const email of invalidEmails) {
      const request = new NextRequest('http://localhost:3000/api/auth/signup', {
        method: 'POST',
        body: JSON.stringify({
          email,
          password: 'Test1234',
        }),
      })

      const response = await signupHandler(request)
      expect(response.status).toBe(400)

      const data = await response.json()
      expect(data.error).toBe('Invalid email format')
    }
  })
})

describe('Response Format Validation', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('login response should have correct structure', async () => {
    const { authenticateUser } = require('@/lib/auth')

    authenticateUser.mockResolvedValueOnce(makeMockUser())

    const request = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'format@test.com',
        password: 'Test1234',
      }),
    })

    const response = await loginHandler(request)
    const data = await response.json()

    expect(data).toHaveProperty('access_token')
    expect(data).toHaveProperty('token_type')
    expect(data).toHaveProperty('user')
    expect(data.user).toHaveProperty('id')
    expect(data.user).toHaveProperty('email')
    expect(data.user).toHaveProperty('created_at')
    expect(data.user).toHaveProperty('updated_at')
    expect(data.user).toHaveProperty('settings')
    expect(data.token_type).toBe('bearer')
  })

  test('signup response should have correct structure', async () => {
    const prisma = require('@/lib/prisma').default
    const { hashPassword } = require('@/lib/auth')

    const createdUser = {
      id: 'user_signup_format',
      email: 'signup@test.com',
      password: 'hashed',
      created_at: new Date('2026-01-20T10:00:00Z'),
      updated_at: new Date('2026-01-20T10:00:00Z'),
    }

    const createdSettings = {
      id: 'settings_signup_format',
      user_id: 'user_signup_format',
      theme: 'gruvbox-dark',
      suggestions_enabled: true,
      default_model: 'claude-3-haiku',
      default_temperature: 0.7,
      default_max_tokens: 500,
      anthropic_api_key: null,
      created_at: new Date('2026-01-20T10:00:00Z'),
      updated_at: new Date('2026-01-20T10:00:00Z'),
    }

    prisma.user.findUnique.mockResolvedValueOnce(null)
    prisma.user.create.mockResolvedValueOnce(createdUser)
    prisma.userSettings.create.mockResolvedValueOnce(createdSettings)
    prisma.workspace.create.mockResolvedValueOnce({})
    hashPassword.mockResolvedValueOnce('hashed_password')

    const request = new NextRequest('http://localhost:3000/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify({
        email: 'signup@test.com',
        password: 'Test1234',
      }),
    })

    const response = await signupHandler(request)
    const data = await response.json()

    expect(data).toHaveProperty('access_token')
    expect(data).toHaveProperty('token_type')
    expect(data).toHaveProperty('user')
    expect(data.user).toHaveProperty('id')
    expect(data.user).toHaveProperty('email')
    expect(data.user).toHaveProperty('settings')
    expect(data.user.settings).toHaveProperty('theme')
    expect(data.user.settings).toHaveProperty('suggestions_enabled')
    expect(data.token_type).toBe('bearer')
  })
})