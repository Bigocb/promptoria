'use client'

import { useSettings } from '@/app/providers'
import { useState, useEffect } from 'react'
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
}

export default function SettingsPage() {
  const { settings, updateSetting } = useSettings()
  const [saving, setSaving] = useState(false)
  const [ollamaModels, setOllamaModels] = useState<OllamaModel[]>([])
  const [ollamaAvailable, setOllamaAvailable] = useState<boolean | null>(null)
  const [ollamaError, setOllamaError] = useState<string | null>(null)
  const [familyFilter, setFamilyFilter] = useState<string>('all')

  useEffect(() => {
    const fetchModels = async () => {
      try {
        const res = await fetch(API_ENDPOINTS.models)
        if (res.ok) {
          const data = await res.json()
          setOllamaAvailable(data.ollama_available)
          setOllamaModels(data.models || [])
          if (data.error) setOllamaError(data.error)
        }
      } catch {
        setOllamaAvailable(false)
        setOllamaError('Could not reach backend to check Ollama status')
      }
    }
    fetchModels()
  }, [])

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
    { id: 'llama3.2', name: 'Llama 3.2', description: 'Fast, capable local model', size: null, parameter_size: null, quantization_level: null, family: null },
    { id: 'mistral', name: 'Mistral', description: 'Balanced performance and speed', size: null, parameter_size: null, quantization_level: null, family: null },
    { id: 'neural-chat', name: 'Neural Chat', description: 'Optimized for chat interactions', size: null, parameter_size: null, quantization_level: null, family: null },
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
              Default Model for Suggestions
            </h2>
            <span style={{
              fontSize: '0.7rem',
              padding: '0.15rem 0.5rem',
              borderRadius: '9999px',
              backgroundColor: ollamaAvailable === true ? 'rgba(34, 197, 94, 0.15)' : ollamaAvailable === false ? 'rgba(239, 68, 68, 0.15)' : 'rgba(156, 163, 175, 0.15)',
              color: ollamaAvailable === true ? '#22c55e' : ollamaAvailable === false ? '#ef4444' : 'var(--color-foregroundAlt)',
            }}>
              {ollamaAvailable === true ? 'Ollama connected' : ollamaAvailable === false ? 'Ollama offline' : 'Checking...'}
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
