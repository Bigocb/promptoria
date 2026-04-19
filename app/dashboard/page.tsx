'use client'

import { useAuth } from '@/app/providers'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { API_ENDPOINTS } from '@/lib/api-config'

interface DashboardStats {
  workspace: {
    id: string
    name: string
  }
  resources: {
    prompts: number
    prompt_versions: number
    snippets: number
    interaction_types: number
    categories: number
  }
  testing: {
    total_test_runs: number
    successful_runs: number
    failed_runs: number
    success_rate: string | number
    average_duration_ms: number
    recent_runs: Array<{
      id: string
      status: string
      created_at: string
      duration_ms: number | null
    }>
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
            const data: DashboardStats = await res.json()
            setStats(data)
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
            {statsLoading ? '—' : stats?.resources.prompts || 0}
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
            {statsLoading ? '—' : stats?.resources.snippets || 0}
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
            {statsLoading ? '—' : stats?.workspace.name || 'Loading...'}
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

      {/* Testing Stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(400px, 100%), 1fr))',
        gap: '2rem',
      }}>
        {/* Test Results Summary */}
        <div style={{
          backgroundColor: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: '8px',
          padding: '1.5rem',
        }}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: 'var(--color-text)', marginBottom: '1rem' }}>
            Test Results
          </h3>
          {statsLoading ? (
            <p style={{ color: 'var(--color-text-secondary)' }}>Loading...</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--color-text-secondary)' }}>Total Runs:</span>
                <span style={{ fontWeight: '600', color: 'var(--color-text)' }}>{stats?.testing.total_test_runs || 0}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--color-text-secondary)' }}>Successful:</span>
                <span style={{ fontWeight: '600', color: '#10b981' }}>{stats?.testing.successful_runs || 0}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--color-text-secondary)' }}>Failed:</span>
                <span style={{ fontWeight: '600', color: '#ef4444' }}>{stats?.testing.failed_runs || 0}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--color-text-secondary)' }}>Success Rate:</span>
                <span style={{ fontWeight: '600', color: 'var(--color-primary)' }}>{stats?.testing.success_rate || 0}%</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--color-text-secondary)' }}>Avg Duration:</span>
                <span style={{ fontWeight: '600', color: 'var(--color-text)' }}>{Math.round((stats?.testing.average_duration_ms || 0) / 1000)}s</span>
              </div>
            </div>
          )}
        </div>

        {/* Recent Test Runs */}
        <div style={{
          backgroundColor: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: '8px',
          padding: '1.5rem',
        }}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: 'var(--color-text)', marginBottom: '1rem' }}>
            Recent Test Runs
          </h3>
          {statsLoading ? (
            <p style={{ color: 'var(--color-text-secondary)' }}>Loading...</p>
          ) : stats?.testing.recent_runs && stats.testing.recent_runs.length > 0 ? (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {stats.testing.recent_runs.map((run) => (
                <li key={run.id} style={{
                  padding: '0.75rem',
                  borderBottom: '1px solid var(--color-border)',
                  fontSize: '0.875rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}>
                  <div>
                    <span style={{
                      display: 'inline-block',
                      padding: '0.25rem 0.5rem',
                      borderRadius: '4px',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      backgroundColor: run.status === 'success' ? '#dbeafe' : '#fee2e2',
                      color: run.status === 'success' ? '#0369a1' : '#991b1b',
                    }}>
                      {run.status}
                    </span>
                  </div>
                  <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.75rem' }}>
                    {new Date(run.created_at).toLocaleDateString()}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p style={{ color: 'var(--color-text-secondary)' }}>No test runs yet. <Link href="/test" style={{ color: 'var(--color-primary)' }}>Run tests</Link></p>
          )}
        </div>
      </div>
    </div>
  )
}
