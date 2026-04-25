'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

export default function ResetPasswordPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (!token) {
      setError('Invalid or missing reset token')
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to reset password')
      }

      setSuccess(true)
      setTimeout(() => router.push('/auth/login'), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  if (!token) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--color-background)', color: 'var(--color-foreground)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '1rem' }}>Invalid Reset Link</h1>
          <p style={{ color: 'var(--color-foregroundAlt)', marginBottom: '1.5rem' }}>This password reset link is invalid or has expired.</p>
          <Link href="/auth/forgot-password" style={{ color: 'var(--color-accent)' }}>Request a new reset link</Link>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-background)', color: 'var(--color-foreground)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: '100%', maxWidth: '400px', padding: '2rem' }}>
        <div style={{ backgroundColor: 'var(--color-backgroundAlt)', borderRadius: '0.75rem', border: '1px solid var(--color-border)', padding: '2rem' }}>
          <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <img src="/logo.svg" alt="" style={{ width: '28px', height: '28px' }} />
              <h1 style={{ fontSize: '1.125rem', fontWeight: '700', margin: 0 }}>Promptoria</h1>
            </div>
            <p style={{ color: 'var(--color-foregroundAlt)', fontSize: '0.9rem' }}>
              {success ? 'Password reset successfully! Redirecting to login...' : 'Enter your new password.'}
            </p>
          </div>

          {success ? (
            <div style={{ textAlign: 'center' }}>
              <Link href="/auth/login" style={{ color: 'var(--color-accent)', fontSize: '0.9rem' }}>
                Go to login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {error && <div style={{ color: 'var(--color-error, #ef4444)', fontSize: '0.85rem' }}>{error}</div>}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                <label htmlFor="password" style={{ fontSize: '0.85rem', fontWeight: '600' }}>New Password</label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  required
                  disabled={loading}
                  style={{ padding: '0.75rem', background: 'var(--color-background)', border: '1px solid var(--color-border)', borderRadius: '0.5rem', color: 'var(--color-foreground)', fontSize: '0.9rem' }}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                <label htmlFor="confirmPassword" style={{ fontSize: '0.85rem', fontWeight: '600' }}>Confirm Password</label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter your password"
                  required
                  disabled={loading}
                  style={{ padding: '0.75rem', background: 'var(--color-background)', border: '1px solid var(--color-border)', borderRadius: '0.5rem', color: 'var(--color-foreground)', fontSize: '0.9rem' }}
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                style={{ padding: '0.75rem', backgroundColor: 'var(--color-accent)', color: 'var(--color-background)', border: 'none', borderRadius: '0.5rem', fontSize: '0.9rem', fontWeight: '600', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1 }}
              >
                {loading ? 'Resetting...' : 'Reset Password'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}