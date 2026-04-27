'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/app/providers'
import { API_ENDPOINTS } from '@/lib/api-config'

interface AdminUser {
  id: string
  email: string
  name: string | null
  tier: string
  daily_tokens_used: number
  daily_tokens_limit: number
  default_model: string | null
  prompt_count: number
  created_at: string
}

const TIER_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  free: { bg: 'rgba(142, 192, 124, 0.15)', text: '#8ec07c', border: '#8ec07c' },
  pro: { bg: 'rgba(254, 128, 25, 0.15)', text: '#fe8019', border: '#fe8019' },
  enterprise: { bg: 'rgba(211, 134, 155, 0.15)', text: '#d3869b', border: '#d3869b' },
  admin: { bg: 'rgba(255, 107, 107, 0.15)', text: '#ff6b6b', border: '#ff6b6b' },
}

export default function AdminUsersPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [users, setUsers] = useState<AdminUser[]>([])
  const [filteredUsers, setFilteredUsers] = useState<AdminUser[]>([])
  const [loadingUsers, setLoadingUsers] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [tierFilter, setTierFilter] = useState('')
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<{ id: string; message: string } | null>(null)

  useEffect(() => {
    if (!loading && !user) router.push('/auth/login')
  }, [user, loading, router])

  useEffect(() => {
    if (!user) return
    const fetchUsers = async () => {
      try {
        const token = localStorage.getItem('auth-token')
        const params = new URLSearchParams()
        if (search) params.set('search', search)
        if (tierFilter) params.set('tier', tierFilter)
        const res = await fetch(`${API_ENDPOINTS.admin.users}?${params}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (res.ok) {
          const data = await res.json()
          setUsers(data.users || [])
          setFilteredUsers(data.users || [])
        } else if (res.status === 403) {
          setError('Access denied. Admin only.')
        } else {
          setError('Failed to load users')
        }
      } catch {
        setError('Failed to load users')
      } finally {
        setLoadingUsers(false)
      }
    }
    fetchUsers()
  }, [user])

  useEffect(() => {
    let result = users
    if (search) {
      result = result.filter(u =>
        u.email.toLowerCase().includes(search.toLowerCase()) ||
        (u.name && u.name.toLowerCase().includes(search.toLowerCase()))
      )
    }
    if (tierFilter) {
      result = result.filter(u => u.tier === tierFilter)
    }
    setFilteredUsers(result)
  }, [search, tierFilter, users])

  const handleTierChange = async (userId: string, newTier: string) => {
    setUpdatingId(userId)
    try {
      const token = localStorage.getItem('auth-token')
      const res = await fetch(API_ENDPOINTS.admin.updateUser(userId), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ subscription_tier: newTier }),
      })
      if (res.ok) {
        const data = await res.json()
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, tier: data.user.subscription_tier } : u))
        setFeedback({ id: userId, message: `Tier updated to ${newTier}` })
        setTimeout(() => setFeedback(null), 2000)
      } else {
        const err = await res.json()
        setError(err.error || 'Failed to update tier')
      }
    } catch {
      setError('Failed to update tier')
    } finally {
      setUpdatingId(null)
    }
  }

  if (loading || !user) return null

  if (error && !users.length) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--color-background)', color: 'var(--color-foreground)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '0.5rem' }}>Access Denied</h1>
          <p style={{ color: 'var(--color-foregroundAlt)' }}>{error}</p>
        </div>
      </div>
    )
  }

  const tierCounts = users.reduce((acc, u) => {
    acc[u.tier] = (acc[u.tier] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-background)', color: 'var(--color-foreground)' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: '800', letterSpacing: '-0.02em' }}>User Management</h1>
            <p style={{ color: 'var(--color-foregroundAlt)', fontSize: '0.9rem', marginTop: '0.25rem' }}>Elevate or downgrade user tiers</p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {Object.entries(tierCounts).map(([tier, count]) => {
                const colors = TIER_COLORS[tier] || TIER_COLORS.free
                return (
                  <span key={tier} style={{ fontSize: '0.75rem', padding: '0.25rem 0.625rem', borderRadius: '9999px', backgroundColor: colors.bg, color: colors.text, border: `1px solid ${colors.border}`, fontWeight: 600, textTransform: 'uppercase' }}>
                    {tier}: {count}
                  </span>
                )
              })}
            </div>
            <a href="/admin" style={{ padding: '0.5rem 1rem', backgroundColor: 'var(--color-backgroundAlt)', border: '1px solid var(--color-border)', borderRadius: '0.5rem', color: 'var(--color-foreground)', textDecoration: 'none', fontSize: '0.85rem' }}>
              Dashboard
            </a>
            <a href="/admin/models" style={{ padding: '0.5rem 1rem', backgroundColor: 'var(--color-backgroundAlt)', border: '1px solid var(--color-border)', borderRadius: '0.5rem', color: 'var(--color-foreground)', textDecoration: 'none', fontSize: '0.85rem' }}>
              Models
            </a>
            <a href="/dashboard" style={{ padding: '0.5rem 1rem', backgroundColor: 'var(--color-backgroundAlt)', border: '1px solid var(--color-border)', borderRadius: '0.5rem', color: 'var(--color-foreground)', textDecoration: 'none', fontSize: '0.85rem' }}>
              Back to App
            </a>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="Search by email or name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input"
            style={{ flex: 1, minWidth: '200px' }}
          />
          <select
            value={tierFilter}
            onChange={(e) => setTierFilter(e.target.value)}
            className="input"
            style={{ width: 'auto' }}
          >
            <option value="">All tiers</option>
            <option value="free">Free</option>
            <option value="pro">Pro</option>
            <option value="enterprise">Power</option>
            <option value="admin">Admin</option>
          </select>
        </div>

        {error && (
          <div style={{ padding: '0.75rem 1rem', backgroundColor: 'rgba(255,0,0,0.08)', borderLeft: '3px solid #ff6b6b', borderRadius: '0.5rem', marginBottom: '1rem', color: '#ff6b6b', fontSize: '0.85rem' }}>
            {error}
            <button onClick={() => setError('')} style={{ marginLeft: '0.5rem', background: 'none', border: 'none', color: '#ff6b6b', cursor: 'pointer', textDecoration: 'underline' }}>dismiss</button>
          </div>
        )}

        {loadingUsers ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--color-foregroundAlt)' }}>Loading users...</div>
        ) : (
          <div style={{ backgroundColor: 'var(--color-backgroundAlt)', borderRadius: '0.75rem', border: '1px solid var(--color-border)', overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <th style={{ padding: '0.75rem 1.25rem', textAlign: 'left', fontWeight: '600', color: 'var(--color-foregroundAlt)', fontSize: '0.75rem', textTransform: 'uppercase' }}>User</th>
                    <th style={{ padding: '0.75rem 1.25rem', textAlign: 'center', fontWeight: '600', color: 'var(--color-foregroundAlt)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Tier</th>
                    <th style={{ padding: '0.75rem 1.25rem', textAlign: 'right', fontWeight: '600', color: 'var(--color-foregroundAlt)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Tokens</th>
                    <th style={{ padding: '0.75rem 1.25rem', textAlign: 'center', fontWeight: '600', color: 'var(--color-foregroundAlt)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Joined</th>
                    <th style={{ padding: '0.75rem 1.25rem', textAlign: 'right', fontWeight: '600', color: 'var(--color-foregroundAlt)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Prompts</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map(u => {
                    const colors = TIER_COLORS[u.tier] || TIER_COLORS.free
                    const isUpdating = updatingId === u.id
                    const isFeedback = feedback?.id === u.id
                    return (
                      <tr key={u.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                        <td style={{ padding: '0.75rem 1.25rem' }}>
                          <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{u.name || u.email.split('@')[0]}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--color-foregroundAlt)' }}>{u.email}</div>
                        </td>
                        <td style={{ padding: '0.75rem 1.25rem', textAlign: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.375rem' }}>
                            {isFeedback ? (
                              <span style={{ fontSize: '0.72rem', color: '#8ec07c', fontWeight: 600 }}>{feedback.message}</span>
                            ) : (
                              <select
                                value={u.tier}
                                onChange={(e) => handleTierChange(u.id, e.target.value)}
                                disabled={isUpdating}
                                style={{
                                  fontSize: '0.72rem',
                                  fontWeight: 600,
                                  padding: '0.2rem 0.4rem',
                                  borderRadius: '0.25rem',
                                  border: `1px solid ${colors.border}`,
                                  backgroundColor: colors.bg,
                                  color: colors.text,
                                  cursor: isUpdating ? 'wait' : 'pointer',
                                  textTransform: 'uppercase',
                                }}
                              >
                                <option value="free">Free</option>
                                <option value="pro">Pro</option>
                                <option value="enterprise">Power</option>
                                <option value="admin">Admin</option>
                              </select>
                            )}
                          </div>
                        </td>
                        <td style={{ padding: '0.75rem 1.25rem', textAlign: 'right' }}>
                          <div style={{ fontSize: '0.8rem' }}>{u.daily_tokens_used?.toLocaleString() ?? 0} / {u.daily_tokens_limit?.toLocaleString() ?? '∞'}</div>
                          <div style={{ fontSize: '0.65rem', color: 'var(--color-foregroundAlt)' }}>tokens today</div>
                        </td>
                        <td style={{ padding: '0.75rem 1.25rem', textAlign: 'center', fontSize: '0.8rem', color: 'var(--color-foregroundAlt)' }}>
                          {new Date(u.created_at).toLocaleDateString()}
                        </td>
                        <td style={{ padding: '0.75rem 1.25rem', textAlign: 'right', fontSize: '0.85rem' }}>
                          {u.prompt_count}
                        </td>
                      </tr>
                    )
                  })}
                  {filteredUsers.length === 0 && (
                    <tr><td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-foregroundAlt)' }}>No users found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            <div style={{ padding: '0.75rem 1.25rem', borderTop: '1px solid var(--color-border)', fontSize: '0.75rem', color: 'var(--color-foregroundAlt)' }}>
              Showing {filteredUsers.length} of {users.length} users
            </div>
          </div>
        )}
      </div>
    </div>
  )
}