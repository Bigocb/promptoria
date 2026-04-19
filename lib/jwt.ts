import * as jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key-change-in-production'
const ALGORITHM = 'HS256'
const ACCESS_TOKEN_EXPIRY = '7d'
const REFRESH_TOKEN_EXPIRY = '30d'

/**
 * Generate access token (7 day expiry, for API access)
 * @param userId - The user ID
 * @param email - The user email
 * @returns JWT access token string
 */
export function generateAccessToken(userId: string, email: string): string {
  return jwt.sign(
    { sub: userId, email },
    JWT_SECRET,
    { algorithm: ALGORITHM, expiresIn: ACCESS_TOKEN_EXPIRY }
  )
}

/**
 * Generate refresh token (30 day expiry, for token refresh)
 * @param userId - The user ID
 * @returns JWT refresh token string
 */
export function generateRefreshToken(userId: string): string {
  return jwt.sign(
    { sub: userId },
    JWT_SECRET,
    { algorithm: ALGORITHM, expiresIn: REFRESH_TOKEN_EXPIRY }
  )
}

/**
 * Verify and decode access token
 * @param token - The JWT access token to verify
 * @returns Object containing userId and email
 * @throws Error if token is invalid or expired
 */
export function verifyAccessToken(token: string): { userId: string; email: string } {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, { algorithms: [ALGORITHM] }) as any
    return { userId: decoded.sub, email: decoded.email }
  } catch (error) {
    throw new Error('Invalid or expired token')
  }
}

/**
 * Verify and decode refresh token
 * @param token - The JWT refresh token to verify
 * @returns Object containing userId
 * @throws Error if token is invalid or expired
 */
export function verifyRefreshToken(token: string): { userId: string } {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, { algorithms: [ALGORITHM] }) as any
    return { userId: decoded.sub }
  } catch (error) {
    throw new Error('Invalid or expired refresh token')
  }
}
