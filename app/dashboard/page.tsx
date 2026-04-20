'use client'

import { useAuth } from '@/app/providers'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { API_ENDPOINTS } from '@/lib/api-config'

interface DashboardStats {
  stats: {
    totalPrompts: number
    totalSnippets: number
    workspaceName: string
  }
  recent: {
    prompts: Array<{ id: string; name: string; createdAt: string; updatedAt: string }>
    snippets: Array<{ id: string; name: string; createdAt: string }>
  }
}

export default function DashboardPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [statsLoading, setStatsLoading] = useState(true)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user) {
      const fetchStats = async () => {
        try {
          const token = localStorage.getItem('auth-token')
          const res = await fetch(`${API_ENDPOINTS.dashboard.stats}`, {
            headers: { 'Authorization': `Bearer ${token}` },
          })
          if (res.ok) {
            const data = await res.json()
            // Transform backend response to match frontend interface
            setStats({
              stats: {
                totalPrompts: data.resources.prompts,
                totalSnippets: data.resources.snippets,
                workspaceName: data.workspace.name,
              },
              recent: {
                prompts: [],
                snippets: [],
              },
            })
          }
        } catch (error) {
          console.error('Failed to fetch dashboard stats:', error)
        } finally {
          setStatsLoading(false)
        }
      }
      fetchStats()
    }
  }, [user])

  if (!user || loading) {
    return null
  }

  return (
    <div style={{ padding: '2rem' }}>

      {/* Stats Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1.5rem',
        marginBottom: '3rem',
      }}>
        <div style={{
          backgroundColor: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: '8px',
          padding: '1.5rem',
        }}>
          <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
            Total Prompts
          </div>
          <div style={{ fontSize: '2.5rem', fontWeight: '700', color: 'var(--color-primary)' }}>
            {statsLoading ? '—' : stats?.stats.totalPrompts || 0}
          </div>
        </div>

        <div style={{
          backgroundColor: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: '8px',
          padding: '1.5rem',
        }}>
          <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
            Total Snippets
          </div>
          <div style={{ fontSize: '2.5rem', fontWeight: '700', color: 'var(--color-accent)' }}>
            {statsLoading ? '—' : stats?.stats.totalSnippets || 0}
          </div>
        </div>

        <div style={{
          backgroundColor: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: '8px',
          padding: '1.5rem',
        }}>
          <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
            Workspace
          </div>
          <div style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--color-text)', wordBreak: 'break-word' }}>
            {statsLoading ? '—' : stats?.stats.workspaceName || 'Loading...'}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div style={{ marginBottom: '3rem' }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: 'var(--color-text)' }}>
          Quick Actions
        </h2>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: '1rem',
        }}>
          <Link href="/prompts" style={{
            display: 'block',
            padding: '1rem',
            backgroundColor: 'var(--color-primary)',
            color: 'white',
            borderRadius: '4px',
            textDecoration: 'none',
            fontWeight: '600',
            textAlign: 'center',
            transition: 'opacity 0.2s',
          }}>
            ⚡ New Prompt
          </Link>
          <Link href="/snippets" style={{
            display: 'block',
            padding: '1rem',
            backgroundColor: 'var(--color-primary)',
            color: 'white',
            borderRadius: '4px',
            textDecoration: 'none',
            fontWeight: '600',
            textAlign: 'center',
            transition: 'opacity 0.2s',
          }}>
            📝 New Snippet
          </Link>
          <Link href="/library" style={{
            display: 'block',
            padding: '1rem',
            backgroundColor: 'var(--color-primary)',
            color: 'white',
            borderRadius: '4px',
            textDecoration: 'none',
            fontWeight: '600',
            textAlign: 'center',
            transition: 'opacity 0.2s',
          }}>
            🔍 Library
          </Link>
        </div>
      </div>

      {/* Recent Items */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(400px, 100%), 1fr))',
        gap: '2rem',
      }}>
        {/* Recent Prompts */}
        <div style={{
          backgroundColor: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: '8px',
          padding: '1.5rem',
        }}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: 'var(--color-text)', marginBottom: '1rem' }}>
            Recent Prompts
          </h3>
          {statsLoading ? (
            <p style={{ color: 'var(--color-text-secondary)' }}>Loading...</p>
          ) : stats?.recent.prompts && stats.recent.prompts.length > 0 ? (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {stats.recent.prompts.map((prompt) => (
                <li key={prompt.id} style={{
                  padding: '0.75rem',
                  borderBottom: '1px solid var(--color-border)',
                  fontSize: '0.875rem',
                }}>
                  <Link href={`/prompts?load=${prompt.id}`} style={{
                    color: 'var(--color-primary)',
                    textDecoration: 'none',
                    fontWeight: '500',
                  }}>
                    {prompt.name || 'Untitled'}
                  </Link>
                  <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                    Updated {new Date(prompt.updatedAt).toLocaleDateString()}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p style={{ color: 'var(--color-text-secondary)' }}>No prompts yet. <Link href="/prompts" style={{ color: 'var(--color-primary)' }}>Create one</Link></p>
          )}
        </div>

        {/* Recent Snippets */}
        <div style={{
          backgroundColor: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: '8px',
          padding: '1.5rem',
        }}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: 'var(--color-text)', marginBottom: '1rem' }}>
            Recent Snippets
          </h3>
          {statsLoading ? (
            <p style={{ color: 'var(--color-text-secondary)' }}>Loading...</p>
          ) : stats?.recent.snippets && stats.recent.snippets.length > 0 ? (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {stats.recent.snippets.map((snippet) => (
                <li key={snippet.id} style={{
                  padding: '0.75rem',
                  borderBottom: '1px solid var(--color-border)',
                  fontSize: '0.875rem',
                }}>
                  <Link href={`/snippets/${snippet.id}`} style={{
                    color: 'var(--color-primary)',
                    textDecoration: 'none',
                    fontWeight: '500',
                  }}>
                    {snippet.name || 'Untitled'}
                  </Link>
                  <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                    Created {new Date(snippet.createdAt).toLocaleDateString()}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p style={{ color: 'var(--color-text-secondary)' }}>No snippets yet. <Link href="/snippets" style={{ color: 'var(--color-primary)' }}>Create one</Link></p>
          )}
        </div>
      </div>
    </div>
  )
}
