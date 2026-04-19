import { NextRequest, NextResponse } from 'next/server'

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

  // For all other /api/* routes, just pass through
  // Individual endpoints handle JWT verification
  return NextResponse.next()
}

// Configure which routes to apply middleware to
export const config = {
  matcher: ['/api/:path*'],
}
