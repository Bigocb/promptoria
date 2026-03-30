import jwt from 'jsonwebtoken'
import bcryptjs from 'bcryptjs'

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key-change-in-production'
const JWT_EXPIRY = '7d'

export interface JwtPayload {
  userId: string
  email: string
  iat?: number
  exp?: number
}

/**
 * Hash a password using bcryptjs
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcryptjs.genSalt(10)
  return bcryptjs.hash(password, salt)
}

/**
 * Verify a password against its hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcryptjs.compare(password, hash)
}

/**
 * Generate a JWT token
 */
export function generateToken(userId: string, email: string): string {
  return jwt.sign({ userId, email }, JWT_SECRET, { expiresIn: JWT_EXPIRY })
}

/**
 * Verify and decode a JWT token
 */
export function verifyToken(token: string): JwtPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET)
    return decoded as JwtPayload
  } catch (error) {
    return null
  }
}

/**
 * Extract token from Authorization header
 */
export function extractToken(authHeader?: string): string | null {
  if (!authHeader) return null
  const parts = authHeader.split(' ')
  if (parts.length !== 2 || parts[0] !== 'Bearer') return null
  return parts[1]
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Validate password strength
 * Minimum 8 characters, at least one uppercase, one lowercase, one number
 */
export function isStrongPassword(password: string): boolean {
  return (
    password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /[0-9]/.test(password)
  )
}
