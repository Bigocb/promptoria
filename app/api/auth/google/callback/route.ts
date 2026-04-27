import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { generateAccessToken, generateRefreshToken } from '@/lib/jwt'
import { exchangeCodeForTokens, getGoogleUserInfo, type GoogleUserInfo } from '@/lib/google-oauth'
import { seedWorkspaceTemplates } from '@/lib/prompt-templates'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://promptoria.me'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const storedState = request.cookies.get('oauth_state')?.value

  if (!code) {
    return NextResponse.redirect(new URL('/auth/login?error=no_code', APP_URL))
  }

  if (!state || state !== storedState) {
    return NextResponse.redirect(new URL('/auth/login?error=invalid_oauth_state', APP_URL))
  }

  // Exchange code for tokens
  let tokens: { access_token: string; id_token: string }
  try {
    tokens = await exchangeCodeForTokens(code)
  } catch (error: any) {
    console.error('Google OAuth token exchange failed:', error.message)
    return NextResponse.redirect(new URL(`/auth/login?error=${encodeURIComponent('token_exchange_failed: ' + error.message)}`, APP_URL))
  }

  // Fetch user info from Google
  let googleUser: GoogleUserInfo
  try {
    googleUser = await getGoogleUserInfo(tokens.access_token)
  } catch (error: any) {
    console.error('Google OAuth user info failed:', error.message)
    return NextResponse.redirect(new URL(`/auth/login?error=${encodeURIComponent('user_info_failed: ' + error.message)}`, APP_URL))
  }

  if (!googleUser.email) {
    return NextResponse.redirect(new URL('/auth/login?error=google_no_email', APP_URL))
  }

  // Find or create user
  let user: { id: string; email: string; name: string | null; image: string | null; subscription_tier: string | null }
  try {
    // Check if OAuth account already exists
    const oauthAccount = await prisma.oAuthAccount.findUnique({
      where: { provider_provider_id: { provider: 'google', provider_id: googleUser.id } },
      include: { user: true },
    })

    if (oauthAccount) {
      // Existing OAuth user — log them in
      user = oauthAccount.user

      await prisma.oAuthAccount.update({
        where: { id: oauthAccount.id },
        data: {
          access_token: tokens.access_token,
          refresh_token: tokens.id_token,
        },
      })

      if (googleUser.name || googleUser.picture) {
        await prisma.user.update({
          where: { id: user.id },
          data: {
            ...(googleUser.name ? { name: googleUser.name } : {}),
            ...(googleUser.picture ? { image: googleUser.picture } : {}),
          },
        })
        user = { ...user, name: googleUser.name || user.name, image: googleUser.picture || user.image }
      }
    } else {
      // Check if user with this email already exists
      const existingUser = await prisma.user.findUnique({
        where: { email: googleUser.email },
      })

      if (existingUser) {
        user = existingUser

        await prisma.oAuthAccount.create({
          data: {
            provider: 'google',
            provider_id: googleUser.id,
            user_id: user.id,
            access_token: tokens.access_token,
            refresh_token: tokens.id_token,
          },
        })

        await prisma.user.update({
          where: { id: user.id },
          data: {
            ...(googleUser.name && !existingUser.name ? { name: googleUser.name } : {}),
            ...(googleUser.picture && !existingUser.image ? { image: googleUser.picture } : {}),
          },
        })
      } else {
        // Brand new user
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
            provider_id: googleUser.id,
            user_id: user.id,
            access_token: tokens.access_token,
            refresh_token: tokens.id_token,
          },
        })

        await prisma.userSettings.create({
          data: {
            user_id: user.id,
            theme: 'gruvbox-dark',
            suggestions_enabled: true,
            default_model: 'qwen3.5:2b',
            default_temperature: 0.7,
            default_max_tokens: 500,
          },
        })

        const workspace = await prisma.workspace.create({
          data: {
            name: 'Default Workspace',
            slug: `workspace-${user.id.substring(0, 8)}`,
            user_id: user.id,
          },
        })

        // Seed starter templates (non-blocking, best-effort)
        try {
          await seedWorkspaceTemplates(workspace.id, prisma)
        } catch (seedErr: any) {
          console.error('Template seed error:', seedErr)
        }
      }
    }
  } catch (error: any) {
    console.error('Google OAuth database error:', error.message, error.stack)
    return NextResponse.redirect(new URL(`/auth/login?error=${encodeURIComponent('db_error: ' + error.message)}`, APP_URL))
  }

  // Generate JWT tokens
  const accessToken = generateAccessToken(user.id, user.email, user.subscription_tier)
  const refreshToken = generateRefreshToken(user.id)

  // Redirect to frontend callback page
  const redirectUrl = new URL('/auth/google/callback', APP_URL)
  redirectUrl.searchParams.set('access_token', accessToken)
  redirectUrl.searchParams.set('refresh_token', refreshToken)
  redirectUrl.searchParams.set('user', JSON.stringify({ id: user.id, email: user.email, tier: user.subscription_tier }))

  const res = NextResponse.redirect(redirectUrl)
  res.cookies.set('oauth_state', '', { maxAge: 0, path: '/' })
  return res
}