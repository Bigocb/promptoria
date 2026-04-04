'use client'

import { useSettings } from '@/app/providers'
import { useState, useEffect } from 'react'
import { themes } from '@/lib/themes'
import { ThemeName } from '@/lib/themes'
import { API_ENDPOINTS } from '@/lib/api-config'

export default function SettingsPage() {
  const { settings, updateSetting } = useSettings()
  const [saving, setSaving] = useState(false)
  const [apiKey, setApiKey] = useState('')
  const [showApiKey, setShowApiKey] = useState(false)
  const [apiKeySaved, setApiKeySaved] = useState(false)

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

  const handleApiKeyChange = async (key: string) => {
    setApiKey(key)
    setSaving(true)
    setApiKeySaved(false)
    try {
      await fetch(API_ENDPOINTS.settings.setApiKey, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth-token')}`,
        },
        body: JSON.stringify({ apiKey: key }),
      })
      setApiKeySaved(true)
      // Hide the saved indicator after 3 seconds
      setTimeout(() => setApiKeySaved(false), 3000)
    } catch (error) {
      console.error('Failed to save API key:', error)
    } finally {
      setSaving(false)
    }
  }

  // Load API key on mount
  useEffect(() => {
    const loadApiKey = async () => {
      try {
        const token = localStorage.getItem('auth-token')
        if (token) {
          const res = await fetch(API_ENDPOINTS.settings.setApiKey, {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          })
          if (res.ok) {
            const data = await res.json()
            setApiKey(data.apiKey || '')
          }
        }
      } catch (error) {
        console.error('Failed to load API key:', error)
      }
    }
    loadApiKey()
  }, [])

  const models = [
    { id: 'claude-3-opus', name: 'Claude 3 Opus', description: 'Most capable, best for complex tasks' },
    { id: 'claude-3-sonnet', name: 'Claude 3 Sonnet', description: 'Balanced performance and speed' },
    { id: 'claude-3-haiku', name: 'Claude 3 Haiku', description: 'Fastest, best for simple tasks' },
  ]

  return (
    <div style={{ padding: '2rem', maxWidth: '900px' }}>
      <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem', color: 'var(--color-text)' }}>Settings</h1>
      <p style={{ color: 'var(--color-text-secondary)', marginBottom: '2rem' }}>
        Manage your preferences and defaults
      </p>

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

        {/* API Key Settings */}
        <section style={{
          backgroundColor: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: '8px',
          padding: '1.5rem',
        }}>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem', color: 'var(--color-text)' }}>
            Claude API Key
          </h2>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', marginBottom: '1rem' }}>
            Enter your Anthropic API key to enable AI-powered features. Get yours at{' '}
            <a href="https://console.anthropic.com" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-primary)', textDecoration: 'underline' }}>
              console.anthropic.com
            </a>
          </p>
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
            <input
              type={showApiKey ? 'text' : 'password'}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              onBlur={() => handleApiKeyChange(apiKey)}
              placeholder="sk-ant-..."
              disabled={saving}
              style={{
                flex: 1,
                padding: '0.75rem',
                backgroundColor: 'var(--color-background)',
                color: 'var(--color-text)',
                border: apiKeySaved ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                borderRadius: '4px',
                fontSize: '0.875rem',
                fontFamily: 'monospace',
                opacity: saving ? 0.6 : 1,
                cursor: saving ? 'not-allowed' : 'text',
              }}
            />
            <button
              onClick={() => setShowApiKey(!showApiKey)}
              disabled={saving}
              style={{
                padding: '0.75rem 1rem',
                backgroundColor: 'var(--color-background)',
                color: 'var(--color-text)',
                border: '1px solid var(--color-border)',
                borderRadius: '4px',
                cursor: saving ? 'not-allowed' : 'pointer',
                opacity: saving ? 0.6 : 1,
              }}
            >
              {showApiKey ? '🙈 Hide' : '👁 Show'}
            </button>
            {apiKeySaved && (
              <div style={{
                padding: '0.75rem 1rem',
                backgroundColor: 'rgba(76, 175, 80, 0.1)',
                color: '#4CB050',
                border: '1px solid #4CB050',
                borderRadius: '4px',
                fontSize: '0.875rem',
                fontWeight: '500',
                whiteSpace: 'nowrap',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}>
                ✓ Saved
              </div>
            )}
          </div>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.75rem' }}>
            ✓ Your API key is stored securely and only used for your requests
          </p>
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
          <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem', color: 'var(--color-text)' }}>
            Default Model for Suggestions
          </h2>
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
                  <div style={{
                    fontWeight: '500',
                    color: settings.defaultModel === model.id ? 'white' : 'var(--color-text)',
                  }}>
                    {model.name}
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
