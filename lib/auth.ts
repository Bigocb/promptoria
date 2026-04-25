import bcrypt from 'bcryptjs'
import { PrismaClient } from '@prisma/client'

const SALT_ROUNDS = 10

// 1. Hash password using bcrypt (for storing in database)
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS)
}

// 2. Verify plaintext password against hash
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

// 3. Authenticate user by email and password
// Returns user object if valid, null if invalid credentials
export async function authenticateUser(
  db: PrismaClient,
  email: string,
  password: string
): Promise<any | null> {
  // Find user by email
  const user = await db.user.findUnique({
    where: { email },
    include: {
      user_settings: true,  // Include user settings
    },
  })

  if (!user) {
    return null  // User not found
  }

  // Verify password (skip for OAuth users without password)
  if (!user.password) {
    return null  // OAuth-only user, cannot login with password
  }
  const isPasswordValid = await verifyPassword(password, user.password)
  if (!isPasswordValid) {
    return null  // Password incorrect
  }

  return user  // Password correct, return user object
}
