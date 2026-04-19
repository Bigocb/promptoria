import { NextRequest, NextResponse } from 'next/server'
import { verifyAccessToken } from '@/lib/jwt'

// Routes that don't require authentication (public endpoints)
const PUBLIC_ROUTES = [
  '/api/auth/login',
  '/api/auth/signup',
]

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // Only apply to /api/* routes
  if (!pathname.startsWith('/api/')) {
    return NextResponse.next()
  }

  // Check if this is a public route (no auth required)
  if (PUBLIC_ROUTES.includes(pathname)) {
    return NextResponse.next()
  }

  // For all other /api/* routes, require JWT token
  const authHeader = request.headers.get('Authorization')

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json(
      { error: 'Unauthorized - missing or invalid token' },
      { status: 401 }
    )
  }

  const token = authHeader.substring(7)  // Remove 'Bearer ' prefix

  try {
    const decoded = verifyAccessToken(token)
    // Token is valid - create new request headers with decoded user info
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set('x-user-id', decoded.userId)
    requestHeaders.set('x-user-email', decoded.email)

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Unauthorized - invalid or expired token' },
      { status: 401 }
    )
  }
}

// Configure which routes to apply middleware to
export const config = {
  matcher: ['/api/:path*'],
}
