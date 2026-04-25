import { generateAccessToken, generateRefreshToken, verifyAccessToken, verifyRefreshToken } from '@/lib/jwt'

describe('JWT Utilities', () => {
  const originalSecret = process.env.JWT_SECRET

  beforeAll(() => {
    process.env.JWT_SECRET = 'test-jwt-secret-for-testing'
  })

  afterAll(() => {
    process.env.JWT_SECRET = originalSecret
  })

  describe('generateAccessToken', () => {
    test('generates a non-empty string token', () => {
      const token = generateAccessToken('user123', 'test@example.com')
      expect(typeof token).toBe('string')
      expect(token.length).toBeGreaterThan(0)
    })

    test('generates different tokens for different users', () => {
      const token1 = generateAccessToken('user1', 'a@b.com')
      const token2 = generateAccessToken('user2', 'b@c.com')
      expect(token1).not.toBe(token2)
    })

    test('includes user ID and email in payload', () => {
      const token = generateAccessToken('user123', 'test@example.com')
      const decoded = verifyAccessToken(token)
      expect(decoded.userId).toBe('user123')
      expect(decoded.email).toBe('test@example.com')
    })
  })

  describe('generateRefreshToken', () => {
    test('generates a non-empty string token', () => {
      const token = generateRefreshToken('user123')
      expect(typeof token).toBe('string')
      expect(token.length).toBeGreaterThan(0)
    })

    test('includes user ID in payload', () => {
      const token = generateRefreshToken('user123')
      const decoded = verifyRefreshToken(token)
      expect(decoded.userId).toBe('user123')
    })
  })

  describe('verifyAccessToken', () => {
    test('verifies a valid token', () => {
      const token = generateAccessToken('user123', 'test@example.com')
      const decoded = verifyAccessToken(token)
      expect(decoded.userId).toBe('user123')
      expect(decoded.email).toBe('test@example.com')
    })

    test('throws for invalid token', () => {
      expect(() => verifyAccessToken('invalid-token')).toThrow('Invalid or expired token')
    })

    test('throws for empty string', () => {
      expect(() => verifyAccessToken('')).toThrow()
    })

    test('throws for token signed with wrong secret', () => {
      const jwt = require('jsonwebtoken')
      const wrongToken = jwt.sign({ sub: 'user123', email: 'test@example.com' }, 'wrong-secret', { algorithm: 'HS256' })
      expect(() => verifyAccessToken(wrongToken)).toThrow()
    })
  })

  describe('verifyRefreshToken', () => {
    test('verifies a valid refresh token', () => {
      const token = generateRefreshToken('user123')
      const decoded = verifyRefreshToken(token)
      expect(decoded.userId).toBe('user123')
    })

    test('throws for invalid refresh token', () => {
      expect(() => verifyRefreshToken('invalid-token')).toThrow('Invalid or expired refresh token')
    })
  })
})