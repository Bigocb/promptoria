'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/app/providers'
import { API_ENDPOINTS } from '@/lib/api-config'

interface ModelPreset {
  id: string
  ollama_id: string
  display_name: string
  family: string
  parameter_size: string | null
  context_window: string | null
  max_tokens: number | null
  description: string | null
  tier_required: string
  cost_estimate: string | null
  is_active: boolean
  admin_overridden: boolean
  is_byok: boolean
  sort_order: number
}

const TIER_OPTIONS = ['free', 'pro', 'enterprise', 'byok']
const COST_OPTIONS = ['cheap', 'medium', 'expensive', 'bring-your-own']

export default function AdminModelsPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [models, setModels] = useState<ModelPreset[]>([])
  const [error, setError] = useState('')
  const [loadingModels, setLoadingModels] = useState(true)
  const [saveFeedback, setSaveFeedback] = useState('')
  const [availableModels, setAvailableModels] = useState<any[]>([])
  const [showAvailable, setShowAvailable] = useState(false)
  const [addingModel, setAddingModel] = useState<string | null>(null)

  useEffect(() => {
    if (!loading && !user) router.push('/auth/login')
  }, [user, loading, router])

  useEffect(() => {
    if (!user) return
    fetchModels()
  }, [user])

  const fetchModels = async () => {
    try {
      const token = localStorage.getItem('auth-token')
      const res = await fetch(API_ENDPOINTS.admin.models, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setModels(data.models)
      } else if (res.status === 403) {
        setError('Access denied. Admin only.')
      } else {
        setError('Failed to load models')
      }
    } catch {
      setError('Failed to load models')
    } finally {
      setLoadingModels(false)
    }
  }

  const updateModel = async (id: string, updates: Partial<ModelPreset>) => {
    try {
      const token = localStorage.getItem('auth-token')
      const res = await fetch(API_ENDPOINTS.admin.model(id), {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      })
      if (!res.ok) throw new Error('Update failed')
      setModels((prev) =>
        prev.map((m) => (m.id === id ? { ...m, ...updates } : m))
      )
      setSaveFeedback('Saved')
      setTimeout(() => setSaveFeedback(''), 1500)
    } catch {
      setSaveFeedback('Error')
      setTimeout(() => setSaveFeedback(''), 2000)
    }
  }

  const addModel = async (model: any) => {
    setAddingModel(model.id)
    try {
      const token = localStorage.getItem('auth-token')
      const res = await fetch(API_ENDPOINTS.admin.models, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ollama_id: model.id,
          display_name: model.name,
          family: model.family,
          parameter_size: model.parameter_size,
          tier_required: 'free',
          cost_estimate: 'medium',
          sort_order: models.length + 1,
        }),
      })
      if (!res.ok) throw new Error('Failed to add')
      await fetchModels()
      setAvailableModels((prev) => prev.filter((m) => m.id !== model.id))
      setSaveFeedback('Added')
      setTimeout(() => setSaveFeedback(''), 1500)
    } catch {
      setSaveFeedback('Error adding')
      setTimeout(() => setSaveFeedback(''), 2000)
    } finally {
      setAddingModel(null)
    }
  }

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

  const grouped = {
    free: models.filter((m) => m.tier_required === 'free'),
    pro: models.filter((m) => m.tier_required === 'pro'),
    enterprise: models.filter((m) => m.tier_required === 'enterprise'),
    byok: models.filter((m) => m.tier_required === 'byok'),
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-background)', color: 'var(--color-foreground)' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: '800', letterSpacing: '-0.02em' }}>Model Config</h1>
            <p style={{ color: 'var(--color-foregroundAlt)', fontSize: '0.9rem', marginTop: '0.25rem' }}>Manage tier assignments, activation, and sort order</p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={async () => {
                if (showAvailable) { setShowAvailable(false); return }
                setShowAvailable(true)
                try {
                  const token = localStorage.getItem('auth-token')
                  const res = await fetch(API_ENDPOINTS.admin.availableModels, { headers: { Authorization: `Bearer ${token}` } })
                  if (res.ok) {
                    const data = await res.json()
                    setAvailableModels(data.unassigned || [])
                  }
                } catch {
                  setAvailableModels([])
                }
              }}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: showAvailable ? 'var(--color-accent)' : 'var(--color-backgroundAlt)',
                border: `1px solid ${showAvailable ? 'var(--color-accent)' : 'var(--color-border)'}`,
                borderRadius: '0.5rem',
                color: showAvailable ? '#1d2021' : 'var(--color-foreground)',
                textDecoration: 'none',
                fontSize: '0.85rem',
                cursor: 'pointer',
                fontWeight: '500',
              }}
            >
              {showAvailable ? '↑ Hide' : '↓ Browse'} Unassigned Models ({availableModels.length})
            </button>
            {saveFeedback && (
              <span style={{
                fontSize: '0.8rem',
                padding: '0.25rem 0.75rem',
                borderRadius: '0.25rem',
                backgroundColor: saveFeedback === 'Saved' ? 'var(--color-success)' : '#cc241d',
                color: '#1d2021',
                fontWeight: '600',
              }}>{saveFeedback}</span>
            )}
            <a href="/admin" style={{ padding: '0.5rem 1rem', backgroundColor: 'var(--color-backgroundAlt)', border: '1px solid var(--color-border)', borderRadius: '0.5rem', color: 'var(--color-foreground)', textDecoration: 'none', fontSize: '0.85rem' }}>
              Admin Dashboard
            </a>
            <a href="/dashboard" style={{ padding: '0.5rem 1rem', backgroundColor: 'var(--color-backgroundAlt)', border: '1px solid var(--color-border)', borderRadius: '0.5rem', color: 'var(--color-foreground)', textDecoration: 'none', fontSize: '0.85rem' }}>
              Back to App
            </a>
          </div>
        </div>

        {loadingModels ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--color-foregroundAlt)' }}>Loading...</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {(Object.entries(grouped) as [string, ModelPreset[]][]).map(([tier, tierModels]) => (
              <div key={tier} style={{ backgroundColor: 'var(--color-backgroundAlt)', borderRadius: '0.75rem', border: '1px solid var(--color-border)', overflow: 'hidden' }}>
                <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: '700', margin: 0, textTransform: 'capitalize' }}>{tier} Models</h3>
                    <span style={{
                      fontSize: '0.7rem',
                      padding: '0.15rem 0.5rem',
                      borderRadius: '0.2rem',
                      backgroundColor: tier === 'free' ? '#b8bb26' : tier === 'pro' ? '#fe8019' : tier === 'byok' ? '#83a598' : '#d3869b',
                      color: '#1d2021',
                      fontWeight: '600',
                      textTransform: 'uppercase',
                    }}>{tierModels.length}</span>
                  </div>
                </div>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                    <thead>
                        <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                        <th style={{ padding: '0.75rem 1.25rem', textAlign: 'left', fontWeight: '600', color: 'var(--color-foregroundAlt)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Model</th>
                        <th style={{ padding: '0.75rem 1.25rem', textAlign: 'left', fontWeight: '600', color: 'var(--color-foregroundAlt)', fontSize: '0.75rem', textTransform: 'uppercase' }}>ID</th>
                        <th style={{ padding: '0.75rem 1.25rem', textAlign: 'center', fontWeight: '600', color: 'var(--color-foregroundAlt)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Size</th>
                        <th style={{ padding: '0.75rem 1.25rem', textAlign: 'center', fontWeight: '600', color: 'var(--color-foregroundAlt)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Tier</th>
                        <th style={{ padding: '0.75rem 1.25rem', textAlign: 'center', fontWeight: '600', color: 'var(--color-foregroundAlt)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Cost</th>
                        <th style={{ padding: '0.75rem 1.25rem', textAlign: 'center', fontWeight: '600', color: 'var(--color-foregroundAlt)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Active</th>
                        <th style={{ padding: '0.75rem 1.25rem', textAlign: 'center', fontWeight: '600', color: 'var(--color-foregroundAlt)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Auto</th>
                        <th style={{ padding: '0.75rem 1.25rem', textAlign: 'center', fontWeight: '600', color: 'var(--color-foregroundAlt)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Sort</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tierModels.map((m) => (
                        <tr key={m.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                          <td style={{ padding: '0.75rem 1.25rem' }}>
                            <div>{m.display_name}</div>
                            {m.description && <div style={{ fontSize: '0.75rem', color: 'var(--color-foregroundAlt)' }}>{m.description}</div>}
                          </td>
                          <td style={{ padding: '0.75rem 1.25rem', fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--color-foregroundAlt)' }}>{m.ollama_id}</td>
                          <td style={{ padding: '0.75rem 1.25rem', textAlign: 'center' }}>
                            <span style={{ fontSize: '0.75rem', fontWeight: '600' }}>{m.parameter_size || '—'}</span>
                          </td>
                          <td style={{ padding: '0.75rem 1.25rem', textAlign: 'center' }}>
                            <select
                              value={m.tier_required}
                              onChange={(e) => updateModel(m.id, { tier_required: e.target.value })}
                              style={{
                                padding: '0.35rem 0.5rem',
                                fontSize: '0.8rem',
                                borderRadius: '0.25rem',
                                border: '1px solid var(--color-border)',
                                backgroundColor: 'var(--color-background)',
                                color: 'var(--color-foreground)',
                              }}
                            >
                              {TIER_OPTIONS.map((t) => (
                                <option key={t} value={t}>{t}</option>
                              ))}
                            </select>
                          </td>
                          <td style={{ padding: '0.75rem 1.25rem', textAlign: 'center' }}>
                            <select
                              value={m.cost_estimate || ''}
                              onChange={(e) => updateModel(m.id, { cost_estimate: e.target.value || null })}
                              style={{
                                padding: '0.35rem 0.5rem',
                                fontSize: '0.8rem',
                                borderRadius: '0.25rem',
                                border: '1px solid var(--color-border)',
                                backgroundColor: 'var(--color-background)',
                                color: 'var(--color-foreground)',
                              }}
                            >
                              <option value="">-</option>
                              {COST_OPTIONS.map((c) => (
                                <option key={c} value={c}>{c}</option>
                              ))}
                            </select>
                          </td>
                          <td style={{ padding: '0.75rem 1.25rem', textAlign: 'center' }}>
                            <button
                              onClick={() => updateModel(m.id, { is_active: !m.is_active, admin_overridden: true })}
                              style={{
                                padding: '0.35rem 0.75rem',
                                borderRadius: '0.25rem',
                                border: 'none',
                                cursor: 'pointer',
                                fontSize: '0.75rem',
                                fontWeight: '600',
                                backgroundColor: m.is_active ? 'var(--color-success)' : '#cc241d',
                                color: '#1d2021',
                              }}
                            >
                              {m.is_active ? 'Active' : 'Inactive'}
                            </button>
                          </td>
                          <td style={{ padding: '0.75rem 1.25rem', textAlign: 'center' }}>
                            <button
                              onClick={() => updateModel(m.id, { admin_overridden: !m.admin_overridden })}
                              style={{
                                padding: '0.35rem 0.75rem',
                                borderRadius: '0.25rem',
                                border: 'none',
                                cursor: 'pointer',
                                fontSize: '0.75rem',
                                fontWeight: '600',
                                backgroundColor: m.admin_overridden ? '#fe8019' : 'var(--color-success)',
                                color: '#1d2021',
                              }}
                              title={m.admin_overridden ? 'Auto-sync is locked — click to let Ollama Cloud control this model\'s active state' : 'Auto-sync is on — Ollama Cloud can toggle this model\'s active state'}
                            >
                              {m.admin_overridden ? 'Manual' : 'Auto'}
                            </button>
                          </td>
                          <td style={{ padding: '0.75rem 1.25rem', textAlign: 'center' }}>
                            <input
                              type="number"
                              value={m.sort_order}
                              onChange={(e) => updateModel(m.id, { sort_order: parseInt(e.target.value) || 0 })}
                              style={{
                                width: '4rem',
                                padding: '0.35rem',
                                fontSize: '0.8rem',
                                textAlign: 'center',
                                borderRadius: '0.25rem',
                                border: '1px solid var(--color-border)',
                                backgroundColor: 'var(--color-background)',
                                color: 'var(--color-foreground)',
                              }}
                            />
                          </td>
                        </tr>
                      ))}
                      {tierModels.length === 0 && (
                        <tr><td colSpan={8} style={{ padding: '1.25rem', textAlign: 'center', color: 'var(--color-foregroundAlt)' }}>No models in this tier</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Unassigned Models Section */}
        {showAvailable && (
          <div style={{
            marginTop: '2rem',
            backgroundColor: 'var(--color-backgroundAlt)',
            borderRadius: '0.75rem',
            border: '1px solid var(--color-border)',
            overflow: 'hidden',
          }}>
            <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--color-border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: '700', margin: 0 }}>Unassigned Models on Ollama Cloud</h3>
                  <span style={{
                    fontSize: '0.7rem',
                    padding: '0.15rem 0.5rem',
                    borderRadius: '0.2rem',
                    backgroundColor: '#83a598',
                    color: '#1d2021',
                    fontWeight: '600',
                  }}>{availableModels.length}</span>
                </div>
                <span style={{ fontSize: '0.8rem', color: 'var(--color-foregroundAlt)' }}>
                  Click "Add" to add to curated list
                </span>
              </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <th style={{ padding: '0.75rem 1.25rem', textAlign: 'left', fontWeight: '600', color: 'var(--color-foregroundAlt)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Name</th>
                    <th style={{ padding: '0.75rem 1.25rem', textAlign: 'left', fontWeight: '600', color: 'var(--color-foregroundAlt)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Family</th>
                    <th style={{ padding: '0.75rem 1.25rem', textAlign: 'left', fontWeight: '600', color: 'var(--color-foregroundAlt)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Size</th>
                    <th style={{ padding: '0.75rem 1.25rem', textAlign: 'left', fontWeight: '600', color: 'var(--color-foregroundAlt)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Cost</th>
                    <th style={{ padding: '0.75rem 1.25rem', textAlign: 'center', fontWeight: '600', color: 'var(--color-foregroundAlt)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Add</th>
                  </tr>
                </thead>
                <tbody>
                  {availableModels.map((m) => (
                    <tr key={m.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <td style={{ padding: '0.75rem 1.25rem', fontFamily: 'monospace', fontSize: '0.85rem' }}>{m.name}</td>
                      <td style={{ padding: '0.75rem 1.25rem' }}>{m.family || 'unknown'}</td>
                      <td style={{ padding: '0.75rem 1.25rem' }}>{m.parameter_size || 'unknown'}</td>
                      <td style={{ padding: '0.75rem 1.25rem' }}>
                        <span style={{
                          fontSize: '0.75rem',
                          fontWeight: '600',
                          padding: '0.1rem 0.4rem',
                          borderRadius: '0.2rem',
                          backgroundColor: m.cost_estimate === 'cheap' ? '#b8bb26' : m.cost_estimate === 'medium' ? '#fe8019' : m.cost_estimate === 'expensive' ? '#cc241d' : 'transparent',
                          color: m.cost_estimate ? '#1d2021' : 'var(--color-foregroundAlt)',
                          textTransform: 'uppercase',
                        }}>
                          {m.cost_estimate || 'unknown'}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem 1.25rem', textAlign: 'center' }}>
                        <button
                          onClick={() => addModel(m)}
                          disabled={addingModel === m.id}
                          style={{
                            padding: '0.35rem 0.75rem',
                            borderRadius: '0.25rem',
                            border: 'none',
                            cursor: addingModel === m.id ? 'not-allowed' : 'pointer',
                            fontSize: '0.75rem',
                            fontWeight: '600',
                            backgroundColor: 'var(--color-accent)',
                            color: '#1d2021',
                            opacity: addingModel === m.id ? 0.5 : 1,
                          }}
                        >
                          {addingModel === m.id ? 'Adding...' : '+ Add'}
                        </button>
                      </td>
                    </tr>
                  ))}
                  {availableModels.length === 0 && (
                    <tr><td colSpan={5} style={{ padding: '1.25rem', textAlign: 'center', color: 'var(--color-foregroundAlt)' }}>No unassigned models found (all models are in curated list or Ollama Cloud is unreachable)</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}