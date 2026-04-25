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

function SkeletonCard() {
  return (
    <div style={{
      backgroundColor: 'var(--color-backgroundAlt)',
      borderRadius: '0.75rem',
      border: '1px solid var(--color-border)',
      padding: '1.25rem',
      animation: 'pulse 1.5s ease-in-out infinite',
    }}>
      <div style={{ height: '0.75rem', width: '40%', backgroundColor: 'var(--color-border)', borderRadius: '0.25rem', marginBottom: '0.75rem' }} />
      <div style={{ height: '2rem', width: '25%', backgroundColor: 'var(--color-border)', borderRadius: '0.25rem' }} />
    </div>
  )
}

function SkeletonLine() {
  return (
    <div style={{
      height: '0.875rem',
      width: '60%',
      backgroundColor: 'var(--color-border)',
      borderRadius: '0.25rem',
      marginBottom: '0.75rem',
      animation: 'pulse 1.5s ease-in-out infinite',
    }} />
  )
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
    if (!user) return
    let cancelled = false
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem('auth-token')
        const res = await fetch(`${API_ENDPOINTS.dashboard.stats}`, {
          headers: { 'Authorization': `Bearer ${token}` },
        })
        if (cancelled) return
        if (res.ok) {
          const data = await res.json()
          setStats({
            stats: {
              totalPrompts: data.resources.prompts,
              totalSnippets: data.resources.snippets,
              workspaceName: data.workspace.name,
            },
            recent: {
              prompts: data.recent?.prompts || [],
              snippets: data.recent?.snippets || [],
            },
          })
        }
      } catch (error) {
        console.error('Failed to fetch dashboard stats:', error)
      } finally {
        if (!cancelled) setStatsLoading(false)
      }
    }
    fetchStats()
    return () => { cancelled = true }
  }, [user])

  if (!user || loading) {
    return null
  }

  const statsData = stats?.stats
  const recentPrompts = stats?.recent?.prompts || []
  const recentSnippets = stats?.recent?.snippets || []

  return (
    <div style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto' }}>
      {/* Welcome */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: '800', marginBottom: '0.25rem', letterSpacing: '-0.02em' }}>
          Welcome back
        </h1>
        <p style={{ color: 'var(--color-foregroundAlt)', fontSize: '0.95rem' }}>
          {statsLoading ? 'Loading your workspace...' : `${statsData?.workspaceName || 'Your workspace'} — ${statsData?.totalPrompts || 0} prompts, ${statsData?.totalSnippets || 0} snippets`}
        </p>
      </div>

      {/* Quick Actions */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1rem',
        marginBottom: '2.5rem',
      }}>
        <Link href="/prompts" style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          padding: '1rem 1.25rem',
          backgroundColor: 'var(--color-backgroundAlt)',
          border: '1px solid var(--color-border)',
          borderRadius: '0.75rem',
          textDecoration: 'none',
          color: 'var(--color-foreground)',
          transition: 'border-color 0.2s, background-color 0.2s',
        }}>
          <span style={{ fontSize: '1.5rem' }}>⚡</span>
          <div>
            <div style={{ fontWeight: '700', fontSize: '0.9rem' }}>New Prompt</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-foregroundAlt)' }}>Write &amp; test</div>
          </div>
        </Link>
        <Link href="/snippets" style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          padding: '1rem 1.25rem',
          backgroundColor: 'var(--color-backgroundAlt)',
          border: '1px solid var(--color-border)',
          borderRadius: '0.75rem',
          textDecoration: 'none',
          color: 'var(--color-foreground)',
          transition: 'border-color 0.2s, background-color 0.2s',
        }}>
          <span style={{ fontSize: '1.5rem' }}>📝</span>
          <div>
            <div style={{ fontWeight: '700', fontSize: '0.9rem' }}>New Snippet</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-foregroundAlt)' }}>Reuse &amp; compose</div>
          </div>
        </Link>
        <Link href="/library" style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          padding: '1rem 1.25rem',
          backgroundColor: 'var(--color-backgroundAlt)',
          border: '1px solid var(--color-border)',
          borderRadius: '0.75rem',
          textDecoration: 'none',
          color: 'var(--color-foreground)',
          transition: 'border-color 0.2s, background-color 0.2s',
        }}>
          <span style={{ fontSize: '1.5rem' }}>📚</span>
          <div>
            <div style={{ fontWeight: '700', fontSize: '0.9rem' }}>Library</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-foregroundAlt)' }}>Browse &amp; search</div>
          </div>
        </Link>
        <Link href="/test" style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          padding: '1rem 1.25rem',
          backgroundColor: 'var(--color-backgroundAlt)',
          border: '1px solid var(--color-border)',
          borderRadius: '0.75rem',
          textDecoration: 'none',
          color: 'var(--color-foreground)',
          transition: 'border-color 0.2s, background-color 0.2s',
        }}>
          <span style={{ fontSize: '1.5rem' }}>🧪</span>
          <div>
            <div style={{ fontWeight: '700', fontSize: '0.9rem' }}>Test Runner</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-foregroundAlt)' }}>Run &amp; compare</div>
          </div>
        </Link>
      </div>

      {/* Stats + Recent */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(400px, 100%), 1fr))',
        gap: '2rem',
      }}>
        {/* Recent Prompts */}
        <div style={{
          backgroundColor: 'var(--color-backgroundAlt)',
          borderRadius: '0.75rem',
          border: '1px solid var(--color-border)',
          overflow: 'hidden',
        }}>
          <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--color-border)' }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: '700', margin: 0 }}>Recent Prompts</h3>
          </div>
          <div style={{ padding: '0.5rem 0' }}>
            {statsLoading ? (
              <div style={{ padding: '0.75rem 1.25rem' }}>
                <SkeletonLine />
                <SkeletonLine />
                <SkeletonLine />
              </div>
            ) : recentPrompts.length > 0 ? (
              recentPrompts.map((prompt) => (
                <Link key={prompt.id} href={`/prompts?load=${prompt.id}`} style={{
                  display: 'block',
                  padding: '0.75rem 1.25rem',
                  textDecoration: 'none',
                  color: 'var(--color-foreground)',
                  transition: 'background-color 0.15s',
                }}>
                  <div style={{ fontWeight: '600', fontSize: '0.875rem' }}>{prompt.name || 'Untitled'}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--color-foregroundAlt)', marginTop: '0.125rem' }}>
                    Updated {new Date(prompt.updatedAt).toLocaleDateString()}
                  </div>
                </Link>
              ))
            ) : (
              <div style={{ padding: '1rem 1.25rem', color: 'var(--color-foregroundAlt)', fontSize: '0.85rem' }}>
                No prompts yet. <Link href="/prompts" style={{ color: 'var(--color-accent)' }}>Create one</Link>
              </div>
            )}
          </div>
        </div>

        {/* Recent Snippets */}
        <div style={{
          backgroundColor: 'var(--color-backgroundAlt)',
          borderRadius: '0.75rem',
          border: '1px solid var(--color-border)',
          overflow: 'hidden',
        }}>
          <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--color-border)' }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: '700', margin: 0 }}>Recent Snippets</h3>
          </div>
          <div style={{ padding: '0.5rem 0' }}>
            {statsLoading ? (
              <div style={{ padding: '0.75rem 1.25rem' }}>
                <SkeletonLine />
                <SkeletonLine />
                <SkeletonLine />
              </div>
            ) : recentSnippets.length > 0 ? (
              recentSnippets.map((snippet) => (
                <Link key={snippet.id} href={`/snippets/${snippet.id}`} style={{
                  display: 'block',
                  padding: '0.75rem 1.25rem',
                  textDecoration: 'none',
                  color: 'var(--color-foreground)',
                  transition: 'background-color 0.15s',
                }}>
                  <div style={{ fontWeight: '600', fontSize: '0.875rem' }}>{snippet.name || 'Untitled'}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--color-foregroundAlt)', marginTop: '0.125rem' }}>
                    Created {new Date(snippet.createdAt).toLocaleDateString()}
                  </div>
                </Link>
              ))
            ) : (
              <div style={{ padding: '1rem 1.25rem', color: 'var(--color-foregroundAlt)', fontSize: '0.85rem' }}>
                No snippets yet. <Link href="/snippets" style={{ color: 'var(--color-accent)' }}>Create one</Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Pulse animation for skeletons */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  )
}