import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { generateAccessToken, generateRefreshToken } from '@/lib/jwt'
import { exchangeCodeForTokens, getGoogleUserInfo } from '@/lib/google-oauth'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://promptoria.me'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const storedState = request.cookies.get('oauth_state')?.value

    if (!code || !state || state !== storedState) {
      const res = NextResponse.redirect(new URL('/auth/login?error=invalid_oauth_state', APP_URL))
      res.cookies.set('oauth_state', '', { maxAge: 0, path: '/' })
      return res
    }

    console.log('Google OAuth: Exchanging code for tokens...')
    const tokens = await exchangeCodeForTokens(code)
    console.log('Google OAuth: Tokens received, fetching user info...')
    const googleUser = await getGoogleUserInfo(tokens.access_token)
    console.log('Google OAuth: User info received:', googleUser.email)

    if (!googleUser.email) {
      const res = NextResponse.redirect(new URL('/auth/login?error=google_no_email', APP_URL))
      res.cookies.set('oauth_state', '', { maxAge: 0, path: '/' })
      return res
    }

    // Check if OAuth account already exists
    let oauthAccount = await prisma.oAuthAccount.findUnique({
      where: { provider_provider_id: { provider: 'google', provider_id: googleUser.sub } },
      include: { user: true },
    })

    let user

    if (oauthAccount) {
      // Existing OAuth user — log them in
      user = oauthAccount.user

      // Update tokens and profile info
      await prisma.oAuthAccount.update({
        where: { id: oauthAccount.id },
        data: {
          access_token: tokens.access_token,
          refresh_token: tokens.id_token,
        },
      })

      // Update name/image if Google provided them
      if (googleUser.name || googleUser.picture) {
        await prisma.user.update({
          where: { id: user.id },
          data: {
            ...(googleUser.name ? { name: googleUser.name } : {}),
            ...(googleUser.picture ? { image: googleUser.picture } : {}),
          },
        })
      }
    } else {
      // Check if user with this email already exists (password user)
      const existingUser = await prisma.user.findUnique({
        where: { email: googleUser.email },
      })

      if (existingUser) {
        // Link existing user to Google OAuth
        user = existingUser

        await prisma.oAuthAccount.create({
          data: {
            provider: 'google',
            provider_id: googleUser.sub,
            user_id: user.id,
            access_token: tokens.access_token,
            refresh_token: tokens.id_token,
          },
        })

        // Update name/image if not already set
        await prisma.user.update({
          where: { id: user.id },
          data: {
            ...(googleUser.name && !existingUser.name ? { name: googleUser.name } : {}),
            ...(googleUser.picture && !existingUser.image ? { image: googleUser.picture } : {}),
          },
        })
      } else {
        // Brand new user — create account
        user = await prisma.user.create({
          data: {
            email: googleUser.email,
            password: null,
            name: googleUser.name || null,
            image: googleUser.picture || null,
          },
        })

        await prisma.oAuthAccount.create({
          data: {
            provider: 'google',
            provider_id: googleUser.sub,
            user_id: user.id,
            access_token: tokens.access_token,
            refresh_token: tokens.id_token,
          },
        })

        // Create settings + workspace (same as password signup)
        await prisma.userSettings.create({
          data: {
            user_id: user.id,
            theme: 'gruvbox-dark',
            suggestions_enabled: true,
            default_model: 'llama3.2',
            default_temperature: 0.7,
            default_max_tokens: 500,
          },
        })

        await prisma.workspace.create({
          data: {
            name: 'Default Workspace',
            slug: `workspace-${user.id.substring(0, 8)}`,
            user_id: user.id,
          },
        })
      }
    }

    // Generate our own JWT tokens
    const accessToken = generateAccessToken(user.id, user.email)
    const refreshToken = generateRefreshToken(user.id)

    // Clear the oauth_state cookie and redirect to frontend callback page
    const redirectUrl = new URL('/auth/google/callback', APP_URL)
    redirectUrl.searchParams.set('access_token', accessToken)
    redirectUrl.searchParams.set('refresh_token', refreshToken)
    redirectUrl.searchParams.set('user', JSON.stringify({ id: user.id, email: user.email }))

    const res = NextResponse.redirect(redirectUrl)
    res.cookies.set('oauth_state', '', { maxAge: 0, path: '/' })
    return res
  } catch (error: any) {
    console.error('Google OAuth callback error:', error.message, error.stack)
    const res = NextResponse.redirect(new URL(`/auth/login?error=${encodeURIComponent('google_auth_failed')}`, APP_URL))
    res.cookies.set('oauth_state', '', { maxAge: 0, path: '/' })
    return res
  }
}