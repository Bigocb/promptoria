import { NextResponse } from 'next/server'
import { getGoogleAuthUrl, generateState } from '@/lib/google-oauth'

export async function GET() {
  try {
    const state = generateState()
    const url = getGoogleAuthUrl(state)

    const res = NextResponse.redirect(url)
    res.cookies.set('oauth_state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 600,
      path: '/',
    })
    return res
  } catch (error: any) {
    console.error('Google auth redirect error:', error)
    return NextResponse.redirect(new URL('/auth/login?error=google_auth_failed', process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'))
  }
}