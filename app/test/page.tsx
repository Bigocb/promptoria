'use client'

import React, { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { API_ENDPOINTS } from '@/lib/api-config'

interface PromptVersion {
  id: string
  template_body: string
  version_number?: number
  created_at?: string
}

interface Prompt {
  id: string
  name: string
  description?: string
  latest_version?: PromptVersion
  versions?: PromptVersion[]
}

interface PersistedTestRun {
  id: string
  model: string
  test_case_input: string
  output: string
  total_tokens: number
  duration_ms: number
  completed_at?: string
  created_at: string
  prompt_version?: {
    version_number: number
  }
}

interface TestResult {
  id: string
  created_at: string
  model: string
  output: string
  total_tokens: number
  latency_ms: number
  request_duration_ms?: number
  version_number?: number
}

interface ModelInfo {
  id: string
  name: string
  description: string
  family: string
  parameter_size: string | null
  contextWindow: string
  maxTokens: number
}

interface ComparisonResult {
  winner: string
  winner_id: string | null
  scores: {
    A: Record<string, number>
    B: Record<string, number>
  }
  explanation: string
}

function OutputActions({ output, promptName }: { output: string; promptName?: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(output)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownload = () => {
    const header = promptName ? `# ${promptName}\n\n` : ''
    const blob = new Blob([`${header}${output}`], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${promptName ?? 'output'}.md`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div style={{ display: 'flex', gap: '0.5rem' }}>
      <button onClick={handleCopy} style={{
        display: 'flex', alignItems: 'center', gap: '0.35rem',
        padding: '0.35rem 0.75rem', fontSize: '0.75rem', fontWeight: '500',
        border: '1px solid var(--color-border)', borderRadius: '0.375rem', cursor: 'pointer',
        backgroundColor: copied ? 'var(--color-accent)' : 'var(--color-surface)',
        color: copied ? '#1d2021' : 'var(--color-foreground)',
      }}>
        {copied ? '✓ Copied' : '⎘ Copy'}
      </button>
      <button onClick={handleDownload} style={{
        display: 'flex', alignItems: 'center', gap: '0.35rem',
        padding: '0.35rem 0.75rem', fontSize: '0.75rem', fontWeight: '500',
        border: '1px solid var(--color-border)', borderRadius: '0.375rem', cursor: 'pointer',
        backgroundColor: 'var(--color-surface)', color: 'var(--color-foreground)',
      }}>
        ↓ Download .md
      </button>
    </div>
  )
}

function formatDuration(ms: number | null | undefined): string {
  if (!ms) return '—'
  if (ms < 1000) return `${ms}ms`
  return `${(ms / 1000).toFixed(1)}s`
}

export default function TestRunnerPage() {
  const [prompts, setPrompts] = useState<Prompt[]>([])
  const [selectedPrompt, setSelectedPrompt] = useState<Prompt | null>(null)
  const [selectedVersionId, setSelectedVersionId] = useState<string>('')
  const [variables, setVariables] = useState<Record<string, string>>({})
  const [model, setModel] = useState('')
  const [temperature, setTemperature] = useState('0.7')
  const [maxTokens, setMaxTokens] = useState('500')
  const [isLoading, setIsLoading] = useState(false)
  const [output, setOutput] = useState('')
  const [results, setResults] = useState<TestResult[]>([])
  const [selectedResult, setSelectedResult] = useState<TestResult | null>(null)
  const [error, setError] = useState('')
  const [fetchingPrompts, setFetchingPrompts] = useState(true)
  const [models, setModels] = useState<ModelInfo[]>([])
  const [modelsError, setModelsError] = useState<string | null>(null)
  const [familyFilter, setFamilyFilter] = useState<string>('all')

  const [persistedRuns, setPersistedRuns] = useState<PersistedTestRun[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [selectedForCompare, setSelectedForCompare] = useState<string[]>([])
  const [comparison, setComparison] = useState<ComparisonResult | null>(null)
  const [comparing, setComparing] = useState(false)

  useEffect(() => {
    const fetchPrompts = async () => {
      try {
        const token = localStorage.getItem('auth-token')
        if (!token) { setError('Not authenticated'); setFetchingPrompts(false); return }

        const res = await fetch(API_ENDPOINTS.prompts.list, {
          headers: { Authorization: `Bearer ${token}` }
        })
        if (res.ok) {
          const data = await res.json()
          setPrompts(Array.isArray(data) ? data : data.prompts || [])
        } else {
          setError('Failed to load prompts')
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load prompts')
      } finally {
        setFetchingPrompts(false)
      }
    }
    fetchPrompts()
  }, [])

  useEffect(() => {
    const fetchModels = async () => {
      try {
        const token = localStorage.getItem('auth-token')
        const res = await fetch(API_ENDPOINTS.models, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        })
        if (res.ok) {
          const data = await res.json()
          setModels(data.models || [])
          if (data.error) setModelsError(data.error)
          if (data.models?.length > 0 && !model) {
            setModel(data.models[0].id)
          }
        } else {
          setModelsError('Could not load models')
        }
      } catch {
        setModelsError('Could not reach model server')
      }
    }
    fetchModels()
  }, [])

  const fetchPersistedHistory = useCallback(async (promptId: string) => {
    try {
      setLoadingHistory(true)
      const token = localStorage.getItem('auth-token')
      const res = await fetch(API_ENDPOINTS.prompts.testRuns(promptId), {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setPersistedRuns(data.test_runs || [])
      }
    } catch {
      // silently fail
    } finally {
      setLoadingHistory(false)
    }
  }, [])

  const handleSelectPrompt = async (prompt: Prompt) => {
    setOutput(''); setResults([]); setError(''); setVariables({})
    setSelectedForCompare([]); setComparison(null)
    try {
      const token = localStorage.getItem('auth-token')
      const res = await fetch(API_ENDPOINTS.prompts.detail(prompt.id), {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (!res.ok) throw new Error('Failed to load prompt details')
      const fullPrompt = await res.json()
      setSelectedPrompt(fullPrompt)

      const allVersions = fullPrompt.versions || []
      const latestVersion = fullPrompt.latest_version || allVersions[0]
      if (latestVersion) {
        setSelectedVersionId(latestVersion.id)
      }

      const activeVer = latestVersion || allVersions[0]
      if (activeVer?.template_body) {
        const varMatches = activeVer.template_body.match(/\{\{(\w+)\}\}/g) || []
        const extractedVars: Record<string, string> = {}
        varMatches.forEach((match: string) => { extractedVars[match.slice(2, -2)] = '' })
        setVariables(extractedVars)
      }

      if (fullPrompt.model && !model) {
        setModel(fullPrompt.model)
      }

      await fetchPersistedHistory(prompt.id)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load prompt')
    }
  }

  const handleVersionChange = (versionId: string) => {
    setSelectedVersionId(versionId)
    const ver = selectedPrompt?.versions?.find(v => v.id === versionId)
    if (ver?.template_body) {
      const varMatches = ver.template_body.match(/\{\{(\w+)\}\}/g) || []
      const extractedVars: Record<string, string> = {}
      varMatches.forEach((match: string) => { extractedVars[match.slice(2, -2)] = '' })
      setVariables(extractedVars)
    }
  }

  const handleVariableChange = (key: string, value: string) => {
    setVariables((prev) => ({ ...prev, [key]: value }))
  }

  const handleAddVariable = () => {
    setVariables((prev) => ({ ...prev, [`var${Object.keys(prev).length + 1}`]: '' }))
  }

  const handleRenameVariable = (oldKey: string, newKey: string) => {
    if (!newKey || newKey === oldKey) return
    setVariables((prev) => {
      const updated: Record<string, string> = {}
      for (const [k, v] of Object.entries(prev)) { updated[k === oldKey ? newKey : k] = v }
      return updated
    })
  }

  const handleRemoveVariable = (key: string) => {
    setVariables((prev) => { const { [key]: _, ...rest } = prev; return rest })
  }

  const handleExecute = async () => {
    if (!selectedPrompt) { setError('Please select a prompt to test'); return }
    setIsLoading(true); setOutput(''); setError('')

    const activeVersion = selectedPrompt.versions?.find(v => v.id === selectedVersionId)
      || selectedPrompt.latest_version
      || selectedPrompt.versions?.[0]
    if (!activeVersion) { setError('No version selected'); setIsLoading(false); return }

    try {
      const token = localStorage.getItem('auth-token')
      const requestStartTime = performance.now()

      const res = await fetch(API_ENDPOINTS.execute.run, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          prompt_version_id: activeVersion.id,
          variables,
          model,
          temperature: parseFloat(temperature),
          max_tokens: parseInt(maxTokens),
        })
      })

      const requestEndTime = performance.now()
      const requestDuration = Math.round(requestEndTime - requestStartTime)

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || errorData.detail || 'Execution failed')
      }

      const result = await res.json()
      setOutput(result.output)

      const testResult: TestResult = {
        id: result.id,
        created_at: result.created_at,
        model: result.model,
        output: result.output,
        total_tokens: result.total_tokens,
        latency_ms: result.latency_ms,
        request_duration_ms: requestDuration,
        version_number: activeVersion.version_number,
      }
      setResults([testResult, ...results])

      // Refresh persisted history
      if (selectedPrompt) {
        fetchPersistedHistory(selectedPrompt.id)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Execution failed')
      setOutput('')
    } finally {
      setIsLoading(false)
    }
  }

  const toggleCompare = (id: string) => {
    setSelectedForCompare((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id)
      if (prev.length >= 2) return [prev[1], id]
      return [...prev, id]
    })
    setComparison(null)
  }

  const runComparison = async () => {
    if (selectedForCompare.length !== 2) return
    setComparing(true)
    try {
      const token = localStorage.getItem('auth-token')
      const res = await fetch(API_ENDPOINTS.testRuns.compare, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          test_run_a_id: selectedForCompare[0],
          test_run_b_id: selectedForCompare[1],
        }),
      })
      if (res.ok) {
        const data = await res.json()
        setComparison(data.comparison)
      } else {
        const errData = await res.json()
        setError(errData.error || 'Comparison failed')
      }
    } catch {
      setError('Failed to run comparison')
    } finally {
      setComparing(false)
    }
  }

  // Merge persisted runs with session results, deduping by id
  const allHistory = (() => {
    const sessionMap = new Map(results.map(r => [r.id, r]))
    const merged: (PersistedTestRun | TestResult)[] = []
    const seen = new Set<string>()

    // Session results first (most recent runs)
    for (const r of results) {
      if (!seen.has(r.id)) { merged.push(r); seen.add(r.id) }
    }
    // Then persisted runs not already in session
    for (const r of persistedRuns) {
      if (!seen.has(r.id)) { merged.push(r); seen.add(r.id) }
    }
    return merged
  })()

  const getRunModel = (run: PersistedTestRun | TestResult) => run.model || 'unknown'
  const getRunTokens = (run: PersistedTestRun | TestResult) => {
    return ('total_tokens' in run ? run.total_tokens : undefined) ?? ('total_tokens' in run ? (run as PersistedTestRun).total_tokens : undefined)
  }
  const getRunDuration = (run: PersistedTestRun | TestResult) => {
    if ('duration_ms' in run && (run as PersistedTestRun).duration_ms) return (run as PersistedTestRun).duration_ms
    if ('latency_ms' in run && (run as TestResult).latency_ms) return (run as TestResult).latency_ms
    return null
  }
  const getRunVersion = (run: PersistedTestRun | TestResult) => {
    if ('version_number' in run && (run as TestResult).version_number) return (run as TestResult).version_number
    if ((run as PersistedTestRun).prompt_version) return (run as PersistedTestRun).prompt_version?.version_number
    return null
  }
  const getRunOutput = (run: PersistedTestRun | TestResult) => ('output' in run ? run.output : null) ?? '(no output)'
  const getRunInput = (run: PersistedTestRun | TestResult) => ('test_case_input' in run ? (run as PersistedTestRun).test_case_input : null) ?? ''
  const getRunDate = (run: PersistedTestRun | TestResult) => {
    if ('created_at' in run && run.created_at) return run.created_at
    if ((run as PersistedTestRun).completed_at) return (run as PersistedTestRun).completed_at!
    return ''
  }

  const runA = persistedRuns.find(r => r.id === selectedForCompare[0])
    ?? (results.find(r => r.id === selectedForCompare[0]) ? { id: results.find(r => r.id === selectedForCompare[0])!.id, output: results.find(r => r.id === selectedForCompare[0])!.output, model: results.find(r => r.id === selectedForCompare[0])!.model, prompt_version: { version_number: results.find(r => r.id === selectedForCompare[0])!.version_number ?? 0 } } as PersistedTestRun : undefined)
  const runB = persistedRuns.find(r => r.id === selectedForCompare[1])
    ?? (results.find(r => r.id === selectedForCompare[1]) ? { id: results.find(r => r.id === selectedForCompare[1])!.id, output: results.find(r => r.id === selectedForCompare[1])!.output, model: results.find(r => r.id === selectedForCompare[1])!.model, prompt_version: { version_number: results.find(r => r.id === selectedForCompare[1])!.version_number ?? 0 } } as PersistedTestRun : undefined)

  const filteredModels = models.filter(m => familyFilter === 'all' || m.family === familyFilter)
  const families = Array.from(new Set(models.map(m => m.family).filter(Boolean)))

  return (
    <div style={{ padding: '2rem', paddingBottom: '6rem' }}>
      <header style={{ marginBottom: '2rem' }}>
        <div style={{ marginBottom: '1rem' }}>
          <Link href="/dashboard" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', color: 'var(--color-foregroundAlt)', textDecoration: 'none', fontSize: '0.875rem', padding: '0.375rem 0.75rem', border: '1px solid var(--color-border)', borderRadius: '0.375rem' }}>
            ← Dashboard
          </Link>
        </div>
        <h1 style={{ fontSize: 'clamp(1.25rem, 5vw, 2rem)', fontWeight: 'bold', marginBottom: '0.5rem' }}>▶️ Test Runner</h1>
        <p style={{ color: 'var(--color-foregroundAlt)', marginBottom: '1.5rem' }}>
          Select a prompt and test it against your configured model
        </p>
      </header>

      <div className="panel-layout-grid">
        <div>
          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ fontWeight: '600', marginBottom: '1rem', fontSize: '0.95rem' }}>📄 Select Prompt</h3>
            {fetchingPrompts ? (
              <div style={{ color: 'var(--color-foregroundAlt)' }}>Loading prompts...</div>
            ) : prompts.length === 0 ? (
              <div style={{ color: 'var(--color-foregroundAlt)' }}>No prompts found. Create one first!</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '250px', overflowY: 'auto' }}>
                {prompts.map((prompt) => (
                  <button
                    key={prompt.id}
                    onClick={() => handleSelectPrompt(prompt)}
                    style={{
                      padding: '0.75rem',
                      backgroundColor: selectedPrompt?.id === prompt.id ? 'var(--color-accent)' : 'var(--color-background)',
                      border: `1px solid ${selectedPrompt?.id === prompt.id ? 'var(--color-accent)' : 'var(--color-border)'}`,
                      borderRadius: '0.5rem', cursor: 'pointer', fontSize: '0.875rem',
                      textAlign: 'left', transition: 'all 0.2s ease',
                      color: selectedPrompt?.id === prompt.id ? '#1d2021' : 'var(--color-foreground)',
                    }}
                  >
                    <div style={{ fontWeight: '600' }}>{prompt.name}</div>
                    <div style={{ fontSize: '0.75rem', opacity: 0.7 }}>{prompt.description || 'No description'}</div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {selectedPrompt && (
            <>
              {(selectedPrompt.versions?.length ?? 0) > 1 && (
                <div className="card" style={{ marginBottom: '1.5rem' }}>
                  <h3 style={{ fontWeight: '600', marginBottom: '0.75rem', fontSize: '0.95rem' }}>🔄 Version</h3>
                  <select
                    value={selectedVersionId}
                    onChange={(e) => handleVersionChange(e.target.value)}
                    className="input"
                    style={{ width: '100%' }}
                  >
                    {selectedPrompt.versions?.map(v => (
                      <option key={v.id} value={v.id}>v{v.version_number}{v === selectedPrompt.latest_version ? ' (latest)' : ''}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="card" style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ fontWeight: '600', marginBottom: '1rem', fontSize: '0.95rem' }}>📝 Variables</h3>
                {Object.keys(variables).length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {Object.entries(variables).map(([key, value]) => (
                      <div key={key}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                          <input
                            type="text" defaultValue={key}
                            onBlur={(e) => handleRenameVariable(key, e.target.value.trim())}
                            style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--color-accent)', textTransform: 'uppercase', background: 'transparent', border: 'none', outline: 'none', padding: 0, fontFamily: 'inherit', cursor: 'text', width: '80%' }}
                          />
                          <button onClick={() => handleRemoveVariable(key)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-foregroundAlt)', fontSize: '0.85rem', padding: '0 0.25rem', lineHeight: 1, opacity: 0.6 }}
                            onMouseEnter={(e) => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.color = '#ff6b6b' }}
                            onMouseLeave={(e) => { e.currentTarget.style.opacity = '0.6'; e.currentTarget.style.color = 'var(--color-foregroundAlt)' }}
                          >✕</button>
                        </div>
                        <input type="text" value={value} onChange={(e) => handleVariableChange(key, e.target.value)} className="input" style={{ width: '100%' }} placeholder={`Enter value for {{${key}}}`} />
                      </div>
                    ))}
                    <button onClick={handleAddVariable} className="btn btn-secondary" style={{ fontSize: '0.75rem' }}>+ Add Variable</button>
                  </div>
                ) : (
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-foregroundAlt)' }}>
                    No <code style={{ fontFamily: 'monospace' }}>{'{{variable}}'}</code> patterns detected in this prompt.
                  </div>
                )}
              </div>

              <div className="card" style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ fontWeight: '600', marginBottom: '1rem', fontSize: '0.95rem' }}>🤖 Model</h3>
                {modelsError && (
                  <div style={{ padding: '0.75rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '4px', fontSize: '0.8rem', color: 'var(--color-error, #ef4444)', marginBottom: '0.75rem' }}>
                    {modelsError}
                  </div>
                )}
                {families.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginBottom: '0.75rem' }}>
                    <button onClick={() => setFamilyFilter('all')} style={{ fontSize: '0.7rem', padding: '0.2rem 0.6rem', borderRadius: '9999px', cursor: 'pointer', backgroundColor: familyFilter === 'all' ? 'var(--color-accent)' : 'var(--color-surface)', color: familyFilter === 'all' ? '#1d2021' : 'var(--color-foregroundAlt)', border: '1px solid var(--color-border)' }}>all</button>
                    {families.map(f => (
                      <button key={f} onClick={() => setFamilyFilter(f)} style={{ fontSize: '0.7rem', padding: '0.2rem 0.6rem', borderRadius: '9999px', cursor: 'pointer', backgroundColor: familyFilter === f ? 'var(--color-accent)' : 'var(--color-surface)', color: familyFilter === f ? '#1d2021' : 'var(--color-foregroundAlt)', border: '1px solid var(--color-border)' }}>{f}</button>
                    ))}
                  </div>
                )}
                <select value={model} onChange={(e) => setModel(e.target.value)} className="input" style={{ width: '100%' }} disabled={models.length === 0}>
                  {filteredModels.length > 0 ? filteredModels.map(m => (
                    <option key={m.id} value={m.id} title={m.description}>{m.name}{m.parameter_size ? ` (${m.parameter_size})` : ''}</option>
                  )) : (
                    <option value="">{modelsError ? 'No models available' : 'Loading models...'}</option>
                  )}
                </select>
                {filteredModels.length > 0 && model && (() => {
                  const selected = filteredModels.find(m => m.id === model)
                  return selected ? <div style={{ fontSize: '0.75rem', color: 'var(--color-foregroundAlt)', marginTop: '0.4rem' }}>{selected.description}</div> : null
                })()}
              </div>

              <div className="card" style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ fontWeight: '600', marginBottom: '1rem', fontSize: '0.95rem' }}>⚙️ Parameters</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.75rem', fontWeight: '600', color: 'var(--color-accent)', textTransform: 'uppercase' }}>Temperature: {temperature}</label>
                    <input type="range" min="0" max="2" step="0.1" value={temperature} onChange={(e) => setTemperature(e.target.value)} style={{ width: '100%' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.75rem', fontWeight: '600', color: 'var(--color-accent)', textTransform: 'uppercase' }}>Max Tokens</label>
                    <input type="number" value={maxTokens} onChange={(e) => setMaxTokens(e.target.value)} className="input" style={{ width: '100%' }} min="1" max="4000" />
                  </div>
                </div>
              </div>

              <button onClick={handleExecute} disabled={isLoading} className="btn btn-primary" style={{ width: '100%', opacity: isLoading ? 0.6 : 1, cursor: isLoading ? 'not-allowed' : 'pointer' }}>
                {isLoading ? '⏳ Executing...' : '▶️ Execute'}
              </button>
            </>
          )}
        </div>

        <div>
          {error && (
            <div className="card" style={{ marginBottom: '1.5rem', padding: '1rem', backgroundColor: 'rgba(255, 0, 0, 0.1)', borderLeft: '4px solid #ff6b6b' }}>
              <div style={{ color: '#ff6b6b', fontWeight: '600' }}>Error</div>
              <div style={{ color: 'var(--color-foregroundAlt)', fontSize: '0.875rem', marginTop: '0.5rem' }}>{error}</div>
            </div>
          )}

          {output && results.length > 0 && (
            <div className="card" style={{ marginBottom: '1.5rem', backgroundColor: 'var(--color-backgroundAlt)', padding: '1rem' }}>
              <h3 style={{ fontWeight: '600', marginBottom: '0.75rem', fontSize: '0.95rem', color: 'var(--color-foreground)' }}>📊 Run Statistics</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '1rem' }}>
                <div><div style={{ fontSize: '0.75rem', fontWeight: '500', color: 'var(--color-foregroundAlt)', marginBottom: '0.25rem', textTransform: 'uppercase' }}>Model</div><div style={{ fontSize: '0.875rem', color: 'var(--color-foreground)', fontFamily: 'monospace' }}>{results[0]?.model || 'N/A'}</div></div>
                <div><div style={{ fontSize: '0.75rem', fontWeight: '500', color: 'var(--color-foregroundAlt)', marginBottom: '0.25rem', textTransform: 'uppercase' }}>Total Request Time</div><div style={{ fontSize: '0.875rem', color: 'var(--color-foreground)' }}>{results[0]?.request_duration_ms ? `${results[0].request_duration_ms}ms` : 'N/A'}</div></div>
                <div><div style={{ fontSize: '0.75rem', fontWeight: '500', color: 'var(--color-foregroundAlt)', marginBottom: '0.25rem', textTransform: 'uppercase' }}>Model Generation Time</div><div style={{ fontSize: '0.875rem', color: 'var(--color-foreground)' }}>{results[0]?.latency_ms ? `${results[0].latency_ms}ms` : 'N/A'}</div></div>
                <div><div style={{ fontSize: '0.75rem', fontWeight: '500', color: 'var(--color-foregroundAlt)', marginBottom: '0.25rem', textTransform: 'uppercase' }}>Total Tokens</div><div style={{ fontSize: '0.875rem', color: 'var(--color-foreground)' }}>{results[0]?.total_tokens || 'N/A'}</div></div>
                <div><div style={{ fontSize: '0.75rem', fontWeight: '500', color: 'var(--color-foregroundAlt)', marginBottom: '0.25rem', textTransform: 'uppercase' }}>Timestamp</div><div style={{ fontSize: '0.875rem', color: 'var(--color-foreground)' }}>{results[0]?.created_at ? new Date(results[0].created_at).toLocaleTimeString() : 'N/A'}</div></div>
              </div>
            </div>
          )}

          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <h2 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--color-foreground)', margin: 0 }}>Output</h2>
              {output && !isLoading && <OutputActions output={output} promptName={selectedPrompt?.name} />}
            </div>
            <div style={{
              backgroundColor: 'var(--color-background)', padding: '1rem', borderRadius: '0.5rem',
              minHeight: '300px', fontSize: '0.875rem', color: 'var(--color-foregroundAlt)',
              fontFamily: 'monospace', whiteSpace: 'pre-wrap', wordBreak: 'break-word',
              border: '1px solid var(--color-border)', overflowY: 'auto', maxHeight: '500px',
              ...(isLoading ? { display: 'flex', alignItems: 'center', justifyContent: 'center' } : {}),
            }}>
              {isLoading ? (
                <div style={{ textAlign: 'center', paddingTop: '4rem' }}>
                  <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⏳</div>
                  <div style={{ color: 'var(--color-foreground)', fontWeight: '500', marginBottom: '0.5rem' }}>Executing prompt...</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-foregroundAlt)' }}>Please wait while the model processes your request</div>
                </div>
              ) : (
                output || (selectedPrompt ? 'Run the prompt to see the response here...' : 'Select a prompt to begin')
              )}
            </div>
          </div>

          {allHistory.length > 0 && (
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ fontWeight: '600', fontSize: '0.95rem', margin: 0 }}>📋 Test History ({allHistory.length})</h3>
                {selectedForCompare.length === 2 && (
                  <button
                    onClick={runComparison}
                    disabled={comparing}
                    style={{
                      padding: '0.35rem 0.75rem',
                      backgroundColor: 'var(--color-accent)',
                      color: '#1d2021',
                      border: 'none',
                      borderRadius: '0.375rem',
                      cursor: comparing ? 'not-allowed' : 'pointer',
                      fontSize: '0.8rem',
                      fontWeight: '600',
                      opacity: comparing ? 0.5 : 1,
                    }}
                  >
                    {comparing ? '🤖 Judging...' : '🏆 AI Judge'}
                  </button>
                )}
                {selectedForCompare.length > 0 && selectedForCompare.length < 2 && (
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-foregroundAlt)' }}>
                    Select {2 - selectedForCompare.length} more to compare
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '350px', overflowY: 'auto' }}>
                {allHistory.map((run) => {
                  const id = run.id
                  const isSelected = selectedForCompare.includes(id)
                  const compareLabel = isSelected ? String.fromCharCode(65 + selectedForCompare.indexOf(id)) : null
                  return (
                    <div
                      key={id}
                      onClick={() => { setSelectedResult(run as TestResult); toggleCompare(id) }}
                      style={{
                        padding: '0.75rem',
                        borderRadius: '0.5rem',
                        border: `2px solid ${isSelected ? 'var(--color-accent)' : 'var(--color-border)'}`,
                        backgroundColor: isSelected ? 'rgba(254, 128, 25, 0.05)' : 'var(--color-backgroundAlt)',
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          {isSelected && (
                            <span style={{
                              fontSize: '0.7rem', padding: '0.1rem 0.35rem', borderRadius: '0.2rem',
                              backgroundColor: 'var(--color-accent)', color: '#1d2021', fontWeight: '700',
                            }}>
                              {compareLabel}
                            </span>
                          )}
                          <span style={{ fontWeight: '600', fontSize: '0.85rem' }}>{getRunModel(run)}</span>
                          {getRunVersion(run) != null && (
                            <span style={{ fontSize: '0.65rem', padding: '0.1rem 0.3rem', borderRadius: '0.2rem', backgroundColor: 'var(--color-surface)', color: 'var(--color-foregroundAlt)', border: '1px solid var(--color-border)' }}>
                              v{getRunVersion(run)}
                            </span>
                          )}
                        </div>
                        <span style={{ fontSize: '0.75rem', color: 'var(--color-foregroundAlt)' }}>
                          {getRunTokens(run)?.toLocaleString() ?? '—'} tok · {formatDuration(getRunDuration(run))}
                        </span>
                      </div>
                      <p style={{ fontSize: '0.75rem', color: 'var(--color-foregroundAlt)', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {getRunInput(run) || getRunOutput(run).substring(0, 60)}
                      </p>
                    </div>
                  )
                })}
              </div>

              {/* A/B Side-by-side Output */}
              {(runA || runB) && (
                <div style={{ marginTop: '1rem', border: '1px solid var(--color-border)', borderRadius: '0.5rem', overflow: 'hidden' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: runA && runB ? '1fr 1fr' : '1fr', gap: '1px', backgroundColor: 'var(--color-border)' }}>
                    {[
                      { label: 'A', run: runA },
                      { label: 'B', run: runB },
                    ].filter(({ run }) => run).map(({ label, run }) => (
                      <div key={label} style={{ backgroundColor: 'var(--color-backgroundAlt)', padding: '1rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                          <span style={{ fontWeight: '700', fontSize: '0.85rem', color: label === 'A' ? '#22c55e' : '#3b82f6' }}>
                            {label} · {run!.model || 'unknown'} · v{run!.prompt_version?.version_number ?? '?'}
                          </span>
                          {comparison?.winner === label && (
                            <span style={{ fontSize: '0.7rem', padding: '0.1rem 0.35rem', borderRadius: '0.2rem', backgroundColor: 'var(--color-success)', color: '#1d2021', fontWeight: '700' }}>Winner</span>
                          )}
                        </div>
                        <pre style={{
                          margin: 0, fontSize: '0.8rem', whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                          color: 'var(--color-foreground)', maxHeight: '300px', overflow: 'auto',
                        }}>
                          {run!.output || '(no output)'}
                        </pre>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* AI Judge Result */}
              {comparison && (
                <div style={{
                  padding: '1rem', backgroundColor: 'var(--color-backgroundAlt)', borderRadius: '0.5rem',
                  border: '1px solid var(--color-border)', marginTop: '0.75rem',
                }}>
                  <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '0.9rem' }}>🏆 AI Judge Result</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                    {(['A', 'B'] as const).map((label) => {
                      const scores = comparison.scores?.[label]
                      if (!scores) return null
                      const total = Object.values(scores).reduce((a, b) => a + b, 0)
                      return (
                        <div key={label}>
                          <div style={{ fontWeight: '600', marginBottom: '0.25rem', color: label === 'A' ? '#22c55e' : '#3b82f6' }}>Version {label} — {total}/25</div>
                          {Object.entries(scores).map(([dim, val]) => (
                            <div key={dim} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                              <span style={{ textTransform: 'capitalize', color: 'var(--color-foregroundAlt)' }}>{dim}</span>
                              <span>{val}/5</span>
                            </div>
                          ))}
                        </div>
                      )
                    })}
                  </div>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-foreground)', lineHeight: 1.5 }}>
                    {comparison.explanation}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}