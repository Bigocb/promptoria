'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [resetUrl, setResetUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Something went wrong')
      }

      setSuccess(true)
      if (data.resetUrl) {
        setResetUrl(data.resetUrl)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
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
              {success ? 'Check your email for a reset link.' : 'Enter your email and we\'ll send you a reset link.'}
            </p>
          </div>

          {success ? (
            <div style={{ textAlign: 'center' }}>
              {resetUrl && (
                <p style={{ fontSize: '0.8rem', color: 'var(--color-foregroundAlt)', marginBottom: '1rem', wordBreak: 'break-all' }}>
                  Dev mode — <a href={resetUrl} style={{ color: 'var(--color-accent)' }}>Click here to reset</a>
                </p>
              )}
              <Link href="/auth/login" style={{ color: 'var(--color-accent)', fontSize: '0.9rem' }}>
                Back to login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {error && <div style={{ color: 'var(--color-error, #ef4444)', fontSize: '0.85rem' }}>{error}</div>}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                <label htmlFor="email" style={{ fontSize: '0.85rem', fontWeight: '600' }}>Email</label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
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
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>
            </form>
          )}

          {!success && (
            <div style={{ textAlign: 'center', marginTop: '1rem' }}>
              <Link href="/auth/login" style={{ color: 'var(--color-accent)', fontSize: '0.85rem' }}>
                Back to login
              </Link>
            </div>
          )}
        </div>
        <div style={{ textAlign: 'center', marginTop: '1rem', color: 'var(--color-foregroundAlt)', fontSize: '0.8rem' }}>
          Save prompts you love. Test, tweak, and reuse them.
        </div>
      </div>
    </div>
  )
}