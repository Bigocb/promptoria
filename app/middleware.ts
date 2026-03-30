import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, extractToken } from '@/lib/auth'

// Public routes that don't require authentication
const PUBLIC_ROUTES = [
  '/',
  '/auth/login',
  '/auth/signup',
]

// Protected routes that require authentication
const PROTECTED_ROUTES = [
  '/prompts',
  '/snippets',
  '/library',
  '/history',
  '/test',
  '/settings',
  '/dashboard',
]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Check if route is public
  const isPublicRoute = PUBLIC_ROUTES.some(route => pathname === route || pathname.startsWith(route + '/'))
  if (isPublicRoute) {
    return NextResponse.next()
  }

  // Check if route is protected
  const isProtectedRoute = PROTECTED_ROUTES.some(route => pathname === route || pathname.startsWith(route + '/'))

  if (isProtectedRoute) {
    // Extract token from cookie or Authorization header
    const tokenFromCookie = request.cookies.get('auth-token')?.value
    const tokenFromHeader = extractToken(request.headers.get('authorization'))
    const token = tokenFromCookie || tokenFromHeader

    // Verify token
    if (!token || !verifyToken(token)) {
      // Redirect to login
      return NextResponse.redirect(new URL('/auth/login', request.url))
    }

    // Token is valid, continue
    return NextResponse.next()
  }

  // Allow all other routes
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
}
