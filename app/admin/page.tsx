'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/app/providers'

interface ModelPreset {
  id: string
  ollama_id: string
  display_name: string
  family: string
  parameter_size: string | null
  context_window: string | null
  max_tokens: number | null
  tier_required: string
  cost_estimate: string | null
  is_active: boolean
  sort_order: number
}

interface AdminStats {
  totals: {
    users: number
    prompts: number
    snippets: number
    testRuns: number
    versions: number
  }
  recentSignups: Array<{
    id: string
    email: string
    joinedAt: string
    promptCount: number
    snippetCount: number
  }>
  modelsUsed: Array<{ model: string; count: number }>
  modelPreferences: Array<{ model: string; count: number }>
  testStatusCounts: Array<{ status: string; count: number }>
  signupsByDay: Array<{ date: string; count: number }>
  promptsByDay: Array<{ date: string; count: number }>
}

export default function AdminPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [error, setError] = useState('')
  const [statsLoading, setStatsLoading] = useState(true)
  const [models, setModels] = useState<ModelPreset[]>([])
  const [modelsLoading, setModelsLoading] = useState(true)
  const [saveFeedback, setSaveFeedback] = useState('')

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
        const res = await fetch('/api/admin/stats', {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (cancelled) return
        if (res.ok) {
          const data = await res.json()
          setStats(data)
        } else if (res.status === 403) {
          setError('Access denied. Admin only.')
        } else {
          setError('Failed to load stats')
        }
      } catch {
        if (!cancelled) setError('Failed to load stats')
      } finally {
        if (!cancelled) setStatsLoading(false)
      }
    }
    fetchStats()
    return () => { cancelled = true }
  }, [user])

  if (loading || !user) return null

  if (error) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--color-background)', color: 'var(--color-foreground)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '0.5rem' }}>Access Denied</h1>
          <p style={{ color: 'var(--color-foregroundAlt)' }}>{error}</p>
        </div>
      </div>
    )
  }

  const t = stats?.totals

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-background)', color: 'var(--color-foreground)' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: '800', letterSpacing: '-0.02em' }}>Admin Dashboard</h1>
            <p style={{ color: 'var(--color-foregroundAlt)', fontSize: '0.9rem', marginTop: '0.25rem' }}>Promptoria metrics &amp; usage</p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <a href="/admin/models" style={{ padding: '0.5rem 1rem', backgroundColor: 'var(--color-backgroundAlt)', border: '1px solid var(--color-border)', borderRadius: '0.5rem', color: 'var(--color-foreground)', textDecoration: 'none', fontSize: '0.85rem' }}>
              Model Config
            </a>
            <a href="/dashboard" style={{ padding: '0.5rem 1rem', backgroundColor: 'var(--color-backgroundAlt)', border: '1px solid var(--color-border)', borderRadius: '0.5rem', color: 'var(--color-foreground)', textDecoration: 'none', fontSize: '0.85rem' }}>
              Back to App
            </a>
          </div>
        </div>

        {statsLoading ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--color-foregroundAlt)' }}>Loading...</div>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
              <StatCard label="Users" value={t?.users ?? 0} />
              <StatCard label="Prompts" value={t?.prompts ?? 0} />
              <StatCard label="Versions" value={t?.versions ?? 0} />
              <StatCard label="Snippets" value={t?.snippets ?? 0} />
              <StatCard label="Test Runs" value={t?.testRuns ?? 0} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
              <ChartCard title="Signups (Last 30 Days)" data={stats?.signupsByDay ?? []} />
              <ChartCard title="Prompts Created (Last 30 Days)" data={stats?.promptsByDay ?? []} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
              <TableCard title="Models Used in Prompts" rows={stats?.modelsUsed ?? []} columns={['Model', 'Count']} />
              <TableCard title="Model Preferences (Settings)" rows={stats?.modelPreferences ?? []} columns={['Model', 'Users']} />
              <TableCard title="Test Run Status" rows={stats?.testStatusCounts ?? []} columns={['Status', 'Count']} />
            </div>

            <div style={{ backgroundColor: 'var(--color-backgroundAlt)', borderRadius: '0.75rem', border: '1px solid var(--color-border)', overflow: 'hidden' }}>
              <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--color-border)' }}>
                <h3 style={{ fontSize: '0.95rem', fontWeight: '700', margin: 0 }}>Recent Signups</h3>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <th style={{ padding: '0.75rem 1.25rem', textAlign: 'left', fontWeight: '600', color: 'var(--color-foregroundAlt)' }}>Email</th>
                      <th style={{ padding: '0.75rem 1.25rem', textAlign: 'left', fontWeight: '600', color: 'var(--color-foregroundAlt)' }}>Joined</th>
                      <th style={{ padding: '0.75rem 1.25rem', textAlign: 'right', fontWeight: '600', color: 'var(--color-foregroundAlt)' }}>Prompts</th>
                      <th style={{ padding: '0.75rem 1.25rem', textAlign: 'right', fontWeight: '600', color: 'var(--color-foregroundAlt)' }}>Snippets</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(stats?.recentSignups ?? []).map(u => (
                      <tr key={u.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                        <td style={{ padding: '0.75rem 1.25rem' }}>{u.email}</td>
                        <td style={{ padding: '0.75rem 1.25rem', color: 'var(--color-foregroundAlt)' }}>{new Date(u.joinedAt).toLocaleDateString()}</td>
                        <td style={{ padding: '0.75rem 1.25rem', textAlign: 'right' }}>{u.promptCount}</td>
                        <td style={{ padding: '0.75rem 1.25rem', textAlign: 'right' }}>{u.snippetCount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div style={{ backgroundColor: 'var(--color-backgroundAlt)', borderRadius: '0.75rem', border: '1px solid var(--color-border)', padding: '1.25rem' }}>
      <div style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--color-foregroundAlt)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>{label}</div>
      <div style={{ fontSize: '2rem', fontWeight: '800', letterSpacing: '-0.02em' }}>{value.toLocaleString()}</div>
    </div>
  )
}

function ChartCard({ title, data }: { title: string; data: Array<{ date: string; count: number }> }) {
  const max = Math.max(...data.map(d => d.count), 1)
  return (
    <div style={{ backgroundColor: 'var(--color-backgroundAlt)', borderRadius: '0.75rem', border: '1px solid var(--color-border)', padding: '1.25rem' }}>
      <h3 style={{ fontSize: '0.95rem', fontWeight: '700', marginBottom: '1rem' }}>{title}</h3>
      {data.length === 0 ? (
        <p style={{ color: 'var(--color-foregroundAlt)', fontSize: '0.85rem' }}>No data</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
          {data.slice(-14).map(d => (
            <div key={d.date} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.7rem', color: 'var(--color-foregroundAlt)', width: '5ch', textAlign: 'right', flexShrink: 0 }}>
                {d.date.slice(5)}
              </span>
              <div style={{ flex: 1, height: '1.25rem', position: 'relative', borderRadius: '0.25rem', overflow: 'hidden' }}>
                <div style={{
                  position: 'absolute', inset: 0,
                  backgroundColor: 'var(--color-border)', opacity: 0.3,
                  borderRadius: '0.25rem',
                }} />
                <div style={{
                  position: 'absolute', top: 0, bottom: 0, left: 0,
                  width: `${(d.count / max) * 100}%`,
                  backgroundColor: 'var(--color-accent)',
                  borderRadius: '0.25rem',
                  minWidth: d.count > 0 ? '2px' : '0',
                }} />
              </div>
              <span style={{ fontSize: '0.7rem', fontWeight: '600', width: '2ch' }}>{d.count}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function TableCard({ title, rows, columns }: { title: string; rows: Array<Record<string, string | number>>; columns: string[] }) {
  const keys = Object.keys(rows[0] || {})
  return (
    <div style={{ backgroundColor: 'var(--color-backgroundAlt)', borderRadius: '0.75rem', border: '1px solid var(--color-border)', overflow: 'hidden' }}>
      <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--color-border)' }}>
        <h3 style={{ fontSize: '0.95rem', fontWeight: '700', margin: 0 }}>{title}</h3>
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
            {columns.map((col, i) => (
              <th key={col} style={{ padding: '0.5rem 1.25rem', textAlign: i === 0 ? 'left' : 'right', fontWeight: '600', color: 'var(--color-foregroundAlt)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{col}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} style={{ borderBottom: '1px solid var(--color-border)' }}>
              {keys.map((key, j) => (
                <td key={key} style={{ padding: '0.5rem 1.25rem', textAlign: j === 0 ? 'left' : 'right' }}>{row[key]}</td>
              ))}
            </tr>
          ))}
          {rows.length === 0 && (
            <tr><td colSpan={columns.length} style={{ padding: '1rem 1.25rem', textAlign: 'center', color: 'var(--color-foregroundAlt)' }}>No data</td></tr>
          )}
        </tbody>
      </table>
    </div>
  )
}