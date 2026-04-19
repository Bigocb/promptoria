'use client'

import { useAuth } from './providers'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import Link from 'next/link'

export default function Home() {
  const { user, loading } = useAuth()
  const router = useRouter()

  // Redirect authenticated users to dashboard
  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard')
    }
  }, [user, loading, router])

  // Show landing page for unauthenticated users
  if (loading) {
    return null // Loading state
  }

  if (user) {
    return null // Redirecting to app
  }

  // Landing page for unauthenticated users
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, var(--color-bg) 0%, var(--color-backgroundAlt) 100%)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      padding: '2rem',
    }}>
      {/* Header with Login/Signup buttons */}
      <header style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '4rem',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <img src="/logo.svg" alt="Promptoria" style={{ width: '40px', height: '40px' }} />
          <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--color-text)', margin: 0 }}>
            Promptoria
          </h1>
        </div>

        <div style={{ display: 'flex', gap: '1rem' }}>
          <Link href="/auth/login" style={{
            padding: '0.75rem 1.5rem',
            border: '1px solid var(--color-border)',
            borderRadius: '4px',
            textDecoration: 'none',
            color: 'var(--color-text)',
            fontWeight: '500',
            transition: 'background 0.2s',
          }}>
            Login
          </Link>
          <Link href="/auth/signup" style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: 'var(--color-primary)',
            color: 'white',
            borderRadius: '4px',
            textDecoration: 'none',
            fontWeight: '500',
            transition: 'opacity 0.2s',
          }}>
            Sign Up
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        textAlign: 'center',
        marginBottom: '4rem',
      }}>
        <h2 style={{
          fontSize: '3.5rem',
          fontWeight: '700',
          color: 'var(--color-text)',
          marginBottom: '1rem',
          maxWidth: '900px',
        }}>
          Modular, Versioned Prompt Management
        </h2>

        <p style={{
          fontSize: '1.25rem',
          color: 'var(--color-text-secondary)',
          marginBottom: '3rem',
          maxWidth: '600px',
          lineHeight: '1.6',
        }}>
          Build, test, and manage your AI prompts with version control, team collaboration, and real-time suggestions.
        </p>

        <Link href="/auth/signup" style={{
          padding: '1rem 2.5rem',
          backgroundColor: 'var(--color-primary)',
          color: 'white',
          borderRadius: '4px',
          textDecoration: 'none',
          fontWeight: '600',
          fontSize: '1.125rem',
          transition: 'opacity 0.2s',
          display: 'inline-block',
        }}>
          Get Started Free
        </Link>
      </main>

      {/* Features Grid */}
      <section style={{ marginBottom: '4rem' }}>
        <h3 style={{
          fontSize: '2rem',
          fontWeight: '700',
          color: 'var(--color-text)',
          textAlign: 'center',
          marginBottom: '3rem',
        }}>
          Core Features
        </h3>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '2rem',
          maxWidth: '1200px',
          margin: '0 auto',
        }}>
          {[
            {
              icon: '📝',
              title: 'Snippet Library',
              description: 'Create and manage reusable text blocks for your prompts',
            },
            {
              icon: '⚡',
              title: 'Prompt Workspace',
              description: 'Build and refine prompts with AI-powered suggestions',
            },
            {
              icon: '🔍',
              title: 'Smart Library',
              description: 'Organize and discover your prompts with powerful search',
            },
            {
              icon: '📊',
              title: 'Version History',
              description: 'Track changes and compare prompt versions over time',
            },
            {
              icon: '▶️',
              title: 'Test Runner',
              description: 'Execute and test prompts with multiple APIs',
            },
            {
              icon: '⚙️',
              title: 'Settings',
              description: 'Configure your workspace and preferences',
            },
          ].map((feature, idx) => (
            <div
              key={idx}
              style={{
                backgroundColor: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: '8px',
                padding: '1.5rem',
              }}
            >
              <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>{feature.icon}</div>
              <h4 style={{ fontSize: '1.125rem', fontWeight: '600', color: 'var(--color-text)', marginBottom: '0.5rem' }}>
                {feature.title}
              </h4>
              <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', margin: 0 }}>
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        textAlign: 'center',
        color: 'var(--color-text-secondary)',
        fontSize: '0.875rem',
        borderTop: '1px solid var(--color-border)',
        paddingTop: '2rem',
      }}>
        <p>© 2026 Promptoria. All rights reserved.</p>
      </footer>
    </div>
  )
}
