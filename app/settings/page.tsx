'use client'

import { useSettings, useAuth } from '@/app/providers'
import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { themes } from '@/lib/themes'
import { ThemeName } from '@/lib/themes'
import { API_ENDPOINTS } from '@/lib/api-config'

interface OllamaModel {
  id: string
  name: string
  size: string | null
  parameter_size: string | null
  quantization_level: string | null
  family: string | null
  description: string
  provider?: string
  inputPrice?: number
  outputPrice?: number
}

export default function SettingsPage() {
  const { settings, updateSetting } = useSettings()
  const { user } = useAuth()
  const searchParams = useSearchParams()
  const [saving, setSaving] = useState(false)
  const [portalLoading, setPortalLoading] = useState(false)
  const [checkoutSuccess, setCheckoutSuccess] = useState(searchParams.get('checkout') === 'success')
  const [ollamaModels, setOllamaModels] = useState<OllamaModel[]>([])
  const [ollamaAvailable, setOllamaAvailable] = useState<boolean | null>(null)
  const [ollamaError, setOllamaError] = useState<string | null>(null)
  const [familyFilter, setFamilyFilter] = useState<string>('all')
  const [anthropicKey, setAnthropicKey] = useState('')
  const [hasAnthropicKey, setHasAnthropicKey] = useState(false)
  const [savingKey, setSavingKey] = useState(false)
  const [keyMessage, setKeyMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null)

  useEffect(() => {
    const fetchModels = async () => {
      try {
        const token = localStorage.getItem('auth-token')
        const res = await fetch(API_ENDPOINTS.models, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        })
        if (res.ok) {
          const data = await res.json()
          setOllamaAvailable(data.models?.length > 0 || false)
          setOllamaModels((data.models || []).map((m: any) => ({
            ...m,
            description: m.description || m.name || m.id,
            size: null,
            quantization_level: null,
            provider: 'ollama',
          })))
        }
      } catch {
        setOllamaAvailable(false)
        setOllamaError('Could not reach backend to check Ollama status')
      }
    }
    fetchModels()
  }, [])

  useEffect(() => {
    const checkApiKey = async () => {
      try {
        const token = localStorage.getItem('auth-token')
        if (!token) return
        const res = await fetch(API_ENDPOINTS.settings.apiKeys.get, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (res.ok) {
          const data = await res.json()
          setHasAnthropicKey(data.has_api_key)
        }
      } catch { /* silent */ }
    }
    checkApiKey()
  }, [])

  const handleSaveAnthropicKey = async () => {
    if (!anthropicKey || anthropicKey.length < 10) {
      setKeyMessage({ text: 'Key must be at least 10 characters', type: 'error' })
      return
    }
    setSavingKey(true)
    setKeyMessage(null)
    try {
      const token = localStorage.getItem('auth-token')
      const res = await fetch(API_ENDPOINTS.settings.apiKeys.set, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ api_key: anthropicKey }),
      })
      if (res.ok) {
        setHasAnthropicKey(true)
        setAnthropicKey('')
        setKeyMessage({ text: 'API key saved successfully', type: 'success' })
      } else {
        const data = await res.json()
        setKeyMessage({ text: data.error || 'Failed to save key', type: 'error' })
      }
    } catch {
      setKeyMessage({ text: 'Network error', type: 'error' })
    } finally {
      setSavingKey(false)
    }
  }

  const handleDeleteAnthropicKey = async () => {
    setSavingKey(true)
    setKeyMessage(null)
    try {
      const token = localStorage.getItem('auth-token')
      const res = await fetch(API_ENDPOINTS.settings.apiKeys.delete, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        setHasAnthropicKey(false)
        setAnthropicKey('')
        setKeyMessage({ text: 'API key removed', type: 'success' })
      } else {
        setKeyMessage({ text: 'Failed to remove key', type: 'error' })
      }
    } catch {
      setKeyMessage({ text: 'Network error', type: 'error' })
    } finally {
      setSavingKey(false)
    }
  }

  const handleThemeChange = async (theme: ThemeName) => {
    setSaving(true)
    try {
      await updateSetting('theme', theme)
    } finally {
      setSaving(false)
    }
  }

  const handleSuggestionsToggle = async (enabled: boolean) => {
    setSaving(true)
    try {
      await updateSetting('suggestionsEnabled', enabled)
    } finally {
      setSaving(false)
    }
  }

  const handleModelChange = async (model: string) => {
    setSaving(true)
    try {
      await updateSetting('defaultModel', model)
    } finally {
      setSaving(false)
    }
  }

  const handleTemperatureChange = async (temp: number) => {
    setSaving(true)
    try {
      await updateSetting('defaultTemperature', temp)
    } finally {
      setSaving(false)
    }
  }

  const handleMaxTokensChange = async (tokens: number) => {
    setSaving(true)
    try {
      await updateSetting('defaultMaxTokens', tokens)
    } finally {
      setSaving(false)
    }
  }


  // Use dynamic Ollama models, fall back to static list if unavailable
  const staticModels: OllamaModel[] = [
    { id: 'llama3.2', name: 'Llama 3.2', description: 'Fast, capable local model', size: null, parameter_size: null, quantization_level: null, family: 'llama', provider: 'ollama' },
  ]
  const allModels = ollamaModels.length > 0 ? ollamaModels : staticModels
  const modelFamilies = Array.from(new Set(allModels.map(m => m.family).filter(Boolean))) as string[]
  const models = allModels.filter(m => familyFilter === 'all' || !m.family || m.family === familyFilter)

  return (
    <div style={{ padding: '2rem', maxWidth: '900px' }}>
      <div style={{ marginBottom: '1rem' }}>
        <Link href="/dashboard" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', color: 'var(--color-foregroundAlt)', textDecoration: 'none', fontSize: '0.875rem', padding: '0.375rem 0.75rem', border: '1px solid var(--color-border)', borderRadius: '0.375rem' }}>
          ← Dashboard
        </Link>
      </div>
      <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem', color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        Settings
        {user?.tier && (
          <span
            style={{
              fontSize: '0.7rem',
              padding: '0.15rem 0.6rem',
              borderRadius: '9999px',
              backgroundColor:
                user.tier === 'admin'
                  ? '#ff5c5c'
                  : user.tier === 'pro'
                    ? '#fe8019'
                    : user.tier === 'enterprise'
                      ? '#d3869b'
                      : '#b8bb26',
              color: '#1d2021',
              fontWeight: '700',
              textTransform: 'uppercase',
              letterSpacing: '0.02em',
            }}
          >
            {user.tier}
          </span>
        )}
      </h1>
      <p style={{ color: 'var(--color-text-secondary)', marginBottom: '2rem' }}>
        Manage your preferences and defaults
      </p>

      {checkoutSuccess && (
        <div style={{ marginBottom: '1.5rem', padding: '1rem', backgroundColor: 'rgba(142,192,124,0.15)', border: '1px solid #8ec07c', borderRadius: '0.5rem', color: '#8ec07c', fontSize: '0.9rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Subscription activated! Your tier has been updated.</span>
          <button onClick={() => setCheckoutSuccess(false)} style={{ background: 'none', border: 'none', color: '#8ec07c', cursor: 'pointer', fontSize: '1.2rem', lineHeight: 1 }}>&times;</button>
        </div>
      )}

      {(user?.tier === 'pro' || user?.tier === 'enterprise') && (
        <section style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '8px', padding: '1.5rem', marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '0.75rem', color: 'var(--color-text)' }}>
            Subscription
          </h2>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', marginBottom: '1rem' }}>
            You are on the <strong style={{ textTransform: 'capitalize' }}>{user.tier}</strong> plan.
          </p>
          <button
            onClick={async () => {
              setPortalLoading(true)
              try {
                const token = localStorage.getItem('auth-token')
                const res = await fetch(API_ENDPOINTS.stripe.portal, {
                  method: 'POST',
                  headers: { Authorization: `Bearer ${token}` },
                })
                if (res.ok) {
                  const data = await res.json()
                  window.location.href = data.url
                }
              } catch {
                // silent
              } finally {
                setPortalLoading(false)
              }
            }}
            disabled={portalLoading}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: 'var(--color-color-surface, var(--color-surface))',
              border: '1px solid var(--color-border)',
              borderRadius: '0.5rem',
              cursor: portalLoading ? 'wait' : 'pointer',
              fontSize: '0.85rem',
              fontWeight: 600,
              color: 'var(--color-text)',
            }}
          >
            {portalLoading ? 'Opening...' : 'Manage Subscription'}
          </button>
        </section>
      )}

      {user?.tier === 'free' && (
        <section style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '8px', padding: '1.5rem', marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '0.75rem', color: 'var(--color-text)' }}>
            Subscription
          </h2>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', marginBottom: '1rem' }}>
            You are on the <strong>Free</strong> plan. Upgrade for more powerful models and higher token limits.
          </p>
          <a href="/pricing" style={{
            display: 'inline-block',
            padding: '0.5rem 1rem',
            backgroundColor: 'var(--color-accent)',
            color: '#1d2021',
            borderRadius: '0.5rem',
            fontSize: '0.85rem',
            fontWeight: 700,
            textDecoration: 'none',
          }}>
            View Plans
          </a>
        </section>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }}>
        {/* Theme Settings */}
        <section style={{
          backgroundColor: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: '8px',
          padding: '1.5rem',
        }}>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem', color: 'var(--color-text)' }}>
            Theme
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: '1rem',
          }}>
            {Object.entries(themes).map(([key, theme]) => (
              <button
                key={key}
                onClick={() => handleThemeChange(key as ThemeName)}
                disabled={saving}
                style={{
                  padding: '1rem',
                  backgroundColor: settings.theme === key ? 'var(--color-primary)' : 'var(--color-background)',
                  color: settings.theme === key ? 'white' : 'var(--color-text)',
                  border: settings.theme === key ? 'none' : '1px solid var(--color-border)',
                  borderRadius: '4px',
                  cursor: saving ? 'not-allowed' : 'pointer',
                  fontWeight: settings.theme === key ? '600' : '400',
                  transition: 'all 0.2s',
                  opacity: saving ? 0.6 : 1,
                }}
              >
                {theme.label}
              </button>
            ))}
          </div>
        </section>

        {/* API Keys */}
        <section style={{
          backgroundColor: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: '8px',
          padding: '1.5rem',
        }}>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '0.25rem', color: 'var(--color-text)' }}>
            API Keys
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: '1.25rem' }}>
            Add your own keys to unlock BYOK models. Keys are stored encrypted and never sent to our servers.
          </p>

          {/* Anthropic */}
          <div style={{ marginBottom: '1rem', padding: '1rem', backgroundColor: 'var(--color-background)', borderRadius: '6px', border: '1px solid var(--color-border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontWeight: 600, color: 'var(--color-text)' }}>Anthropic</span>
                <span style={{ fontSize: '0.7rem', padding: '0.1rem 0.5rem', borderRadius: '9999px', backgroundColor: hasAnthropicKey ? 'rgba(34,197,94,0.15)' : 'rgba(156,163,175,0.15)', color: hasAnthropicKey ? '#22c55e' : 'var(--color-foregroundAlt)' }}>
                  {hasAnthropicKey ? 'Connected' : 'No key'}
                </span>
              </div>
              {hasAnthropicKey && (
                <button onClick={handleDeleteAnthropicKey} disabled={savingKey} style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem', borderRadius: '4px', border: '1px solid rgba(239,68,68,0.3)', backgroundColor: 'transparent', color: '#ef4444', cursor: savingKey ? 'not-allowed' : 'pointer', opacity: savingKey ? 0.5 : 1 }}>
                  Remove
                </button>
              )}
            </div>
            {!hasAnthropicKey ? (
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="password"
                  value={anthropicKey}
                  onChange={(e) => setAnthropicKey(e.target.value)}
                  placeholder="sk-ant-..."
                  className="input"
                  style={{ flex: 1, fontSize: '0.85rem' }}
                />
                <button onClick={handleSaveAnthropicKey} disabled={savingKey || !anthropicKey} style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', borderRadius: '4px', border: 'none', backgroundColor: 'var(--color-accent)', color: '#1d2021', fontWeight: 600, cursor: savingKey ? 'not-allowed' : 'pointer', opacity: savingKey || !anthropicKey ? 0.5 : 1 }}>
                  Save
                </button>
              </div>
            ) : (
              <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                Key is set. Claude models (Haiku, Sonnet, Opus) are now available.
              </div>
            )}
          </div>

          {keyMessage && (
            <div style={{ marginTop: '0.5rem', padding: '0.5rem 0.75rem', borderRadius: '4px', fontSize: '0.85rem', backgroundColor: keyMessage.type === 'success' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)', color: keyMessage.type === 'success' ? '#22c55e' : '#ef4444' }}>
              {keyMessage.text}
            </div>
          )}
        </section>

        {/* Suggestions Settings */}
        <section style={{
          backgroundColor: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: '8px',
          padding: '1.5rem',
        }}>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem', color: 'var(--color-text)' }}>
            AI Suggestions
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              cursor: saving ? 'not-allowed' : 'pointer',
              opacity: saving ? 0.6 : 1,
            }}>
              <input
                type="checkbox"
                checked={settings.suggestionsEnabled}
                onChange={(e) => handleSuggestionsToggle(e.target.checked)}
                disabled={saving}
                style={{ cursor: saving ? 'not-allowed' : 'pointer' }}
              />
              <span style={{ color: 'var(--color-text)' }}>
                Enable suggestions in workbench
              </span>
            </label>
          </div>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
            When enabled, you'll get AI-powered suggestions for improvements to your prompts
          </p>
        </section>

        {/* Model Settings */}
        <section style={{
          backgroundColor: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: '8px',
          padding: '1.5rem',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <h2 style={{ fontSize: '1.25rem', color: 'var(--color-text)', margin: 0 }}>
              Default Model
            </h2>
            <span style={{
              fontSize: '0.7rem',
              padding: '0.15rem 0.5rem',
              borderRadius: '9999px',
              backgroundColor: ollamaAvailable === true ? 'rgba(34, 197, 94, 0.15)' : ollamaAvailable === false ? 'rgba(239, 68, 68, 0.15)' : 'rgba(156, 163, 175, 0.15)',
              color: ollamaAvailable === true ? '#22c55e' : ollamaAvailable === false ? '#ef4444' : 'var(--color-foregroundAlt)',
            }}>
              {ollamaModels.length > 0 ? `${ollamaModels.length} models available` : ollamaError ? 'Offline' : 'Loading...'}
            </span>
          </div>
          {ollamaAvailable === false && ollamaError && (
            <div style={{
              padding: '0.75rem',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '4px',
              fontSize: '0.8rem',
              color: '#ef4444',
              marginBottom: '1rem',
            }}>
              {ollamaError}
            </div>
          )}
          {modelFamilies.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginBottom: '0.75rem' }}>
              <button
                onClick={() => setFamilyFilter('all')}
                style={{
                  fontSize: '0.7rem', padding: '0.2rem 0.6rem', borderRadius: '9999px', cursor: 'pointer',
                  backgroundColor: familyFilter === 'all' ? 'var(--color-accent)' : 'var(--color-surface)',
                  color: familyFilter === 'all' ? '#1d2021' : 'var(--color-foregroundAlt)',
                  border: '1px solid var(--color-border)',
                }}
              >all</button>
              {modelFamilies.map(f => (
                <button key={f} onClick={() => setFamilyFilter(f)} style={{
                  fontSize: '0.7rem', padding: '0.2rem 0.6rem', borderRadius: '9999px', cursor: 'pointer',
                  backgroundColor: familyFilter === f ? 'var(--color-accent)' : 'var(--color-surface)',
                  color: familyFilter === f ? '#1d2021' : 'var(--color-foregroundAlt)',
                  border: '1px solid var(--color-border)',
                }}>{f}</button>
              ))}
            </div>
          )}
          <div style={{ display: 'grid', gap: '0.75rem' }}>
            {models.map((model) => (
              <label
                key={model.id}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.75rem',
                  padding: '0.75rem',
                  backgroundColor: settings.defaultModel === model.id ? 'var(--color-primary)' : 'var(--color-background)',
                  borderRadius: '4px',
                  cursor: saving ? 'not-allowed' : 'pointer',
                  opacity: saving ? 0.6 : 1,
                  transition: 'background-color 0.2s',
                }}
              >
                <input
                  type="radio"
                  value={model.id}
                  checked={settings.defaultModel === model.id}
                  onChange={(e) => handleModelChange(e.target.value)}
                  disabled={saving}
                  style={{ marginTop: '0.25rem', cursor: saving ? 'not-allowed' : 'pointer' }}
                />
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{
                      fontWeight: '500',
                      color: settings.defaultModel === model.id ? 'white' : 'var(--color-text)',
                    }}>
                      {model.name}
                    </span>
                    {model.parameter_size && (
                      <span style={{
                        fontSize: '0.7rem',
                        padding: '0.1rem 0.4rem',
                        borderRadius: '4px',
                        backgroundColor: settings.defaultModel === model.id ? 'rgba(255,255,255,0.2)' : 'var(--color-border)',
                        color: settings.defaultModel === model.id ? 'white' : 'var(--color-foregroundAlt)',
                      }}>
                        {model.parameter_size}
                      </span>
                    )}
                  </div>
                  <div style={{
                    fontSize: '0.875rem',
                    color: settings.defaultModel === model.id ? 'rgba(255,255,255,0.8)' : 'var(--color-text-secondary)',
                  }}>
                    {model.description}
                  </div>
                </div>
              </label>
            ))}
          </div>
        </section>

        {/* Daily Token Quota */}
        <TokenQuotaSection />

        {/* Temperature Settings */}
        <section style={{
          backgroundColor: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: '8px',
          padding: '1.5rem',
        }}>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem', color: 'var(--color-text)' }}>
            Temperature: {(settings.defaultTemperature ?? 0.7).toFixed(1)}
          </h2>
          <input
            type="range"
            min="0"
            max="2"
            step="0.1"
            value={settings.defaultTemperature}
            onChange={(e) => handleTemperatureChange(parseFloat(e.target.value))}
            disabled={saving}
            style={{
              width: '100%',
              cursor: saving ? 'not-allowed' : 'pointer',
              opacity: saving ? 0.6 : 1,
            }}
          />
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', marginTop: '0.5rem' }}>
            Lower values (0.0-0.7) make responses more focused and deterministic. Higher values (0.7-2.0) make responses more creative and varied.
          </p>
        </section>

        {/* Max Tokens Settings */}
        <section style={{
          backgroundColor: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: '8px',
          padding: '1.5rem',
        }}>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem', color: 'var(--color-text)' }}>
            Max Tokens: {settings.defaultMaxTokens ?? 500}
          </h2>
          <input
            type="range"
            min="100"
            max="4000"
            step="100"
            value={settings.defaultMaxTokens}
            onChange={(e) => handleMaxTokensChange(parseInt(e.target.value))}
            disabled={saving}
            style={{
              width: '100%',
              cursor: saving ? 'not-allowed' : 'pointer',
              opacity: saving ? 0.6 : 1,
            }}
          />
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', marginTop: '0.5rem' }}>
            Maximum number of tokens to generate in responses. Higher values allow longer responses.
          </p>
        </section>
      </div>

      {saving && (
        <div style={{
          marginTop: '2rem',
          padding: '1rem',
          backgroundColor: 'rgba(107, 163, 255, 0.1)',
          border: '1px solid var(--color-primary)',
          borderRadius: '4px',
          color: 'var(--color-primary)',
          textAlign: 'center',
        }}>
          Saving changes...
        </div>
      )}
    </div>
  )
}

function TokenQuotaSection() {
  const [quota, setQuota] = useState<{ used: number; limit: number; remaining: number } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchQuota = async () => {
      try {
        const token = localStorage.getItem('auth-token')
        if (!token) { setLoading(false); return }
        const res = await fetch(API_ENDPOINTS.quotas.usage, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (res.ok) {
          const data = await res.json()
          setQuota(data)
        }
      } catch {
        // silently fail
      } finally {
        setLoading(false)
      }
    }
    fetchQuota()
  }, [])

  if (loading) {
    return (
      <section style={{
        backgroundColor: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: '8px',
        padding: '1.5rem',
        marginBottom: '1.5rem',
      }}>
        <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem', color: 'var(--color-text)' }}>Daily Token Quota</h2>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>Loading...</p>
      </section>
    )
  }

  if (!quota) return null

  const percentage = quota.limit > 0 ? (quota.used / quota.limit) * 100 : 0
  const isNearLimit = percentage >= 80
  const isExceeded = percentage >= 100

  return (
    <section style={{
      backgroundColor: 'var(--color-surface)',
      border: '1px solid var(--color-border)',
      borderRadius: '8px',
      padding: '1.5rem',
      marginBottom: '1.5rem',
    }}>
      <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem', color: 'var(--color-text)' }}>Daily Token Quota</h2>

      <div style={{ marginBottom: '1rem' }}>
        <div style={{
          height: '1.25rem',
          backgroundColor: 'var(--color-border)',
          borderRadius: '0.5rem',
          overflow: 'hidden',
        }}>
          <div style={{
            height: '100%',
            width: `${Math.min(percentage, 100)}%`,
            backgroundColor: isExceeded ? '#cc241d' : isNearLimit ? '#fe8019' : 'var(--color-success)',
            borderRadius: '0.5rem',
            transition: 'width 0.5s ease',
          }} />
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
          <span style={{ fontWeight: '600', color: isExceeded ? '#cc241d' : 'var(--color-accent)' }}>{quota.used.toLocaleString()}</span>
          <span> / {quota.limit.toLocaleString()} tokens used</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {isExceeded ? (
            <span style={{
              fontSize: '0.8rem',
              padding: '0.25rem 0.75rem',
              borderRadius: '0.25rem',
              backgroundColor: '#cc241d',
              color: '#1d2021',
              fontWeight: '600',
            }}>
              Quota exceeded
            </span>
          ) : isNearLimit ? (
            <span style={{
              fontSize: '0.8rem',
              padding: '0.25rem 0.75rem',
              borderRadius: '0.25rem',
              backgroundColor: '#fe8019',
              color: '#1d2021',
              fontWeight: '600',
            }}>
              Near limit
            </span>
          ) : (
            <span style={{
              fontSize: '0.8rem',
              padding: '0.25rem 0.75rem',
              borderRadius: '0.25rem',
              backgroundColor: 'var(--color-accent)',
              color: '#1d2021',
              fontWeight: '600',
            }}>
              {quota.remaining.toLocaleString()} remaining
            </span>
          )}
        </div>
      </div>

      {isExceeded && (
        <p style={{ marginTop: '0.75rem', fontSize: '0.85rem', color: '#cc241d' }}>
          You've hit your daily token limit.{' '}
          <a href="/pricing" style={{ color: 'var(--color-accent)', fontWeight: 600, textDecoration: 'underline' }}>
            Upgrade to Pro
          </a> for more tokens.
        </p>
      )}
      {isNearLimit && !isExceeded && (
        <p style={{ marginTop: '0.75rem', fontSize: '0.85rem', color: '#fe8019' }}>
          You're approaching your daily token limit.{' '}
          <a href="/pricing" style={{ color: 'var(--color-accent)', fontWeight: 600, textDecoration: 'underline' }}>
            Upgrade to Pro
          </a> for more tokens.
        </p>
      )}
    </section>
  )
}
