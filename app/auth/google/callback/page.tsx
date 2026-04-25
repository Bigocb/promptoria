'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/app/providers'

export default function GoogleCallbackPage() {
  const router = useRouter()
  const { login } = useAuth()

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const accessToken = params.get('access_token')
    const refreshToken = params.get('refresh_token')
    const userStr = params.get('user')

    if (accessToken && userStr) {
      try {
        const user = JSON.parse(userStr)
        localStorage.setItem('auth-token', accessToken)
        if (refreshToken) {
          localStorage.setItem('auth-refresh-token', refreshToken)
        }
        localStorage.setItem('auth-user', JSON.stringify(user))
        window.dispatchEvent(new Event('auth-state-changed'))
        router.push('/dashboard')
      } catch {
        router.push('/auth/login?error=google_auth_failed')
      }
    } else {
      router.push('/auth/login?error=google_auth_failed')
    }
  }, [router])

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--color-background)',
      color: 'var(--color-foreground)',
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '0.5rem' }}>Signing in with Google...</div>
        <div style={{ color: 'var(--color-foregroundAlt)' }}>Please wait while we set up your account.</div>
      </div>
    </div>
  )
}