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
  version_number: number
  model: string | null
  test_case_input: string
  output: string | null
  total_tokens: number | null
  duration_ms: number | null
  temperature: number | null
  max_tokens: number | null
  completed_at: string | null
  created_at: string
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

type HistoryRun = (PersistedTestRun & { _type: 'persisted' }) | (TestResult & { _type: 'session' })

function formatDuration(ms: number | null | undefined): string {
  if (!ms) return '—'
  if (ms < 1000) return `${ms}ms`
  return `${(ms / 1000).toFixed(1)}s`
}

function getRunModel(r: HistoryRun) { return r.model || 'unknown' }
function getRunTokens(r: HistoryRun) { return r.total_tokens ?? null }
function getRunDurationMs(r: HistoryRun) {
  if (r._type === 'persisted') return r.duration_ms
  return r.latency_ms ?? null
}
function getRunVersion(r: HistoryRun) {
  if (r._type === 'persisted') return r.version_number
  return r.version_number ?? null
}
function getRunOutput(r: HistoryRun) { return r.output || '(no output)' }
function getRunInput(r: HistoryRun) {
  if (r._type === 'persisted') return r.test_case_input
  return ''
}
function getRunDate(r: HistoryRun) { return r.created_at }

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
  const [viewedRun, setViewedRun] = useState<HistoryRun | null>(null)
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
  const [historyOpen, setHistoryOpen] = useState(true)
  const [configOpen, setConfigOpen] = useState(false)

  useEffect(() => {
    const fetchPrompts = async () => {
      try {
        const token = localStorage.getItem('auth-token')
        if (!token) { setError('Not authenticated'); setFetchingPrompts(false); return }
        const res = await fetch(API_ENDPOINTS.prompts.list, { headers: { Authorization: `Bearer ${token}` } })
        if (res.ok) {
          const data = await res.json()
          setPrompts(Array.isArray(data) ? data : data.prompts || [])
        } else { setError('Failed to load prompts') }
      } catch (err) { setError(err instanceof Error ? err.message : 'Failed to load prompts') }
      finally { setFetchingPrompts(false) }
    }
    fetchPrompts()
  }, [])

  useEffect(() => {
    const fetchModels = async () => {
      try {
        const token = localStorage.getItem('auth-token')
        const res = await fetch(API_ENDPOINTS.models, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
        if (res.ok) {
          const data = await res.json()
          setModels(data.models || [])
          if (data.error) setModelsError(data.error)
          if (data.models?.length > 0 && !model) setModel(data.models[0].id)
        } else { setModelsError('Could not load models') }
      } catch { setModelsError('Could not reach model server') }
    }
    fetchModels()
  }, [])

  const fetchPersistedHistory = useCallback(async (promptId: string) => {
    try {
      setLoadingHistory(true)
      const token = localStorage.getItem('auth-token')
      const res = await fetch(API_ENDPOINTS.prompts.testRuns(promptId), { headers: { Authorization: `Bearer ${token}` } })
      if (res.ok) { const data = await res.json(); setPersistedRuns(data.test_runs || []) }
    } catch { /* silent */ }
    finally { setLoadingHistory(false) }
  }, [])

  const handleSelectPrompt = async (prompt: Prompt) => {
    setOutput(''); setResults([]); setError(''); setVariables({})
    setSelectedForCompare([]); setComparison(null); setViewedRun(null)
    try {
      const token = localStorage.getItem('auth-token')
      const res = await fetch(API_ENDPOINTS.prompts.detail(prompt.id), { headers: { Authorization: `Bearer ${token}` } })
      if (!res.ok) throw new Error('Failed to load prompt details')
      const fullPrompt = await res.json()
      setSelectedPrompt(fullPrompt)

      const allVersions = fullPrompt.versions || []
      const latestVersion = fullPrompt.latest_version || allVersions[0]
      if (latestVersion) setSelectedVersionId(latestVersion.id)

      const activeVer = latestVersion || allVersions[0]
      if (activeVer?.template_body) {
        const varMatches = activeVer.template_body.match(/\{\{(\w+)\}\}/g) || []
        const extractedVars: Record<string, string> = {}
        varMatches.forEach((match: string) => { extractedVars[match.slice(2, -2)] = '' })
        setVariables(extractedVars)
      }

      if (fullPrompt.model && !model) setModel(fullPrompt.model)
      await fetchPersistedHistory(prompt.id)
    } catch (err) { setError(err instanceof Error ? err.message : 'Failed to load prompt') }
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

  const handleExecute = async () => {
    if (!selectedPrompt) { setError('Please select a prompt to test'); return }
    setIsLoading(true); setOutput(''); setError('')

    const activeVersion = selectedPrompt.versions?.find(v => v.id === selectedVersionId) || selectedPrompt.latest_version || selectedPrompt.versions?.[0]
    if (!activeVersion) { setError('No version selected'); setIsLoading(false); return }

    try {
      const token = localStorage.getItem('auth-token')
      const requestStartTime = performance.now()
      const res = await fetch(API_ENDPOINTS.execute.run, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ prompt_version_id: activeVersion.id, variables, model, temperature: parseFloat(temperature), max_tokens: parseInt(maxTokens) })
      })
      const requestEndTime = performance.now()
      const requestDuration = Math.round(requestEndTime - requestStartTime)
      if (!res.ok) { const errorData = await res.json(); throw new Error(errorData.error || errorData.detail || 'Execution failed') }

      const result = await res.json()
      setOutput(result.output || '')

      const testResult: TestResult = {
        id: result.id, created_at: result.created_at, model: result.model,
        output: result.output || '', total_tokens: result.total_tokens,
        latency_ms: result.latency_ms || result.request_duration_ms || requestDuration,
        request_duration_ms: requestDuration, version_number: activeVersion.version_number,
      }
      setResults([testResult, ...results])
      setViewedRun({ ...testResult, _type: 'session' })
      if (selectedPrompt) fetchPersistedHistory(selectedPrompt.id)
    } catch (err) { setError(err instanceof Error ? err.message : 'Execution failed'); setOutput('') }
    finally { setIsLoading(false) }
  }

  const toggleCompare = (id: string) => {
    setSelectedForCompare(prev => {
      if (prev.includes(id)) return prev.filter(x => x !== id)
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
        body: JSON.stringify({ test_run_a_id: selectedForCompare[0], test_run_b_id: selectedForCompare[1] }),
      })
      if (res.ok) { const data = await res.json(); setComparison(data.comparison) }
      else { const errData = await res.json(); setError(errData.error || 'Comparison failed') }
    } catch { setError('Failed to run comparison') }
    finally { setComparing(false) }
  }

  const allHistory: HistoryRun[] = (() => {
    const seen = new Set<string>()
    const merged: HistoryRun[] = []
    for (const r of results) { if (!seen.has(r.id)) { merged.push({ ...r, _type: 'session' }); seen.add(r.id) } }
    for (const r of persistedRuns) { if (!seen.has(r.id)) { merged.push({ ...r, _type: 'persisted' }); seen.add(r.id) } }
    return merged
  })()

  const findRunForCompare = (id: string): PersistedTestRun | null => {
    const session = results.find(r => r.id === id)
    if (session) return { id: session.id, version_number: session.version_number ?? 0, model: session.model, test_case_input: '', output: session.output, total_tokens: session.total_tokens, duration_ms: session.latency_ms ?? null, temperature: parseFloat(temperature), max_tokens: parseInt(maxTokens), completed_at: session.created_at, created_at: session.created_at }
    const persisted = persistedRuns.find(r => r.id === id)
    return persisted || null
  }

  const runA = selectedForCompare[0] ? findRunForCompare(selectedForCompare[0]) : null
  const runB = selectedForCompare[1] ? findRunForCompare(selectedForCompare[1]) : null

  const filteredModels = models.filter(m => familyFilter === 'all' || m.family === familyFilter)
  const families = Array.from(new Set(models.map(m => m.family).filter(Boolean)))
  const displayOutput = viewedRun ? getRunOutput(viewedRun) : output

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto', padding: 'clamp(1rem, 3vw, 2rem)', paddingBottom: '6rem' }}>
      <header style={{ marginBottom: '1.5rem' }}>
        <div style={{ marginBottom: '0.75rem' }}>
          <Link href="/dashboard" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', color: 'var(--color-foregroundAlt)', textDecoration: 'none', fontSize: '0.875rem', padding: '0.375rem 0.75rem', border: '1px solid var(--color-border)', borderRadius: '0.375rem' }}>← Dashboard</Link>
        </div>
        <h1 style={{ fontSize: 'clamp(1.25rem, 5vw, 2rem)', fontWeight: 'bold' }}>▶️ Test Runner</h1>
      </header>

      {/* Desktop: side-by-side. Mobile: stacked */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: '1.5rem' }} className="test-runner-grid">
        {/* Config Panel — on desktop this goes to a sidebar via CSS */}
        <div className="test-config-panel">
          {/* Prompt Select */}
          <div className="card" style={{ marginBottom: '1rem' }}>
            <h3 style={{ fontWeight: 600, marginBottom: '0.75rem', fontSize: '0.95rem' }}>📄 Prompt</h3>
            {fetchingPrompts ? <div style={{ color: 'var(--color-foregroundAlt)' }}>Loading…</div>
            : prompts.length === 0 ? <div style={{ color: 'var(--color-foregroundAlt)' }}>No prompts found.</div>
            : (
              <select value={selectedPrompt?.id || ''} onChange={e => { const p = prompts.find(p => p.id === e.target.value); if (p) handleSelectPrompt(p) }} className="input" style={{ width: '100%' }}>
                <option value="">Select a prompt…</option>
                {prompts.map(p => <option key={p.id} value={p.id}>{p.name}{p.description ? ` — ${p.description.slice(0, 40)}` : ''}</option>)}
              </select>
            )}
          </div>

          {selectedPrompt && (
            <>
              {/* Version selector */}
              {(selectedPrompt.versions?.length ?? 0) > 1 && (
                <div className="card" style={{ marginBottom: '1rem' }}>
                  <h3 style={{ fontWeight: 600, marginBottom: '0.5rem', fontSize: '0.95rem' }}>🔄 Version</h3>
                  <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                    {selectedPrompt.versions?.map(v => (
                      <button key={v.id} onClick={() => handleVersionChange(v.id)} style={{ padding: '0.3rem 0.7rem', fontSize: '0.8rem', borderRadius: '0.375rem', border: `1px solid ${selectedVersionId === v.id ? 'var(--color-accent)' : 'var(--color-border)'}`, backgroundColor: selectedVersionId === v.id ? 'var(--color-accent)' : 'var(--color-surface)', color: selectedVersionId === v.id ? '#1d2021' : 'var(--color-foreground)', cursor: 'pointer', fontWeight: selectedVersionId === v.id ? 600 : 400 }}>
                        v{v.version_number}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Mobile: collapsible config */}
              <div className="test-config-desktop">
                <ConfigCards variables={variables} model={model} setModel={setModel} models={models} filteredModels={filteredModels} familyFilter={familyFilter} setFamilyFilter={setFamilyFilter} families={families} modelsError={modelsError} temperature={temperature} setTemperature={setTemperature} maxTokens={maxTokens} setMaxTokens={setMaxTokens} handleVariableChange={handleVariableChange} handleAddVariable={handleAddVariable} handleRenameVariable={handleRenameVariable} handleRemoveVariable={handleRemoveVariable} />
              </div>
              <div className="test-config-mobile">
                <button onClick={() => setConfigOpen(!configOpen)} style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--color-border)', background: 'var(--color-surface)', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 600, textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>⚙️ Model & Parameters</span>
                  <span>{configOpen ? '▾' : '▸'}</span>
                </button>
                {configOpen && (
                  <div style={{ marginTop: '0.5rem' }}>
                    <ConfigCards variables={variables} model={model} setModel={setModel} models={models} filteredModels={filteredModels} familyFilter={familyFilter} setFamilyFilter={setFamilyFilter} families={families} modelsError={modelsError} temperature={temperature} setTemperature={setTemperature} maxTokens={maxTokens} setMaxTokens={setMaxTokens} handleVariableChange={handleVariableChange} handleAddVariable={handleAddVariable} handleRenameVariable={handleRenameVariable} handleRemoveVariable={handleRemoveVariable} />
                  </div>
                )}
              </div>

              <button onClick={handleExecute} disabled={isLoading} className="btn btn-primary" style={{ width: '100%', marginTop: '1rem', opacity: isLoading ? 0.6 : 1, cursor: isLoading ? 'not-allowed' : 'pointer' }}>
                {isLoading ? '⏳ Executing…' : '▶️ Execute'}
              </button>
            </>
          )}
        </div>

        {/* Results Panel */}
        <div className="test-results-panel">
          {error && (
            <div className="card" style={{ marginBottom: '1rem', padding: '0.75rem 1rem', backgroundColor: 'rgba(255,0,0,0.08)', borderLeft: '3px solid #ff6b6b' }}>
              <div style={{ color: '#ff6b6b', fontWeight: 600, fontSize: '0.9rem' }}>Error</div>
              <div style={{ color: 'var(--color-foregroundAlt)', fontSize: '0.85rem', marginTop: '0.25rem' }}>{error}</div>
            </div>
          )}

          {/* Stats strip */}
          {viewedRun && (
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem', padding: '0.75rem 1rem', borderRadius: '0.5rem', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-backgroundAlt)', fontSize: '0.85rem' }}>
              <span style={{ color: 'var(--color-foregroundAlt)' }}>Model: <strong style={{ color: 'var(--color-foreground)', fontFamily: 'monospace' }}>{getRunModel(viewedRun)}</strong></span>
              <span style={{ color: 'var(--color-foregroundAlt)' }}>Tokens: <strong style={{ color: 'var(--color-foreground)' }}>{getRunTokens(viewedRun)?.toLocaleString() ?? '—'}</strong></span>
              <span style={{ color: 'var(--color-foregroundAlt)' }}>Duration: <strong style={{ color: 'var(--color-foreground)' }}>{formatDuration(getRunDurationMs(viewedRun))}</strong></span>
              {getRunVersion(viewedRun) != null && <span style={{ color: 'var(--color-foregroundAlt)' }}>Version: <strong style={{ color: 'var(--color-foreground)' }}>v{getRunVersion(viewedRun)}</strong></span>}
              <span style={{ color: 'var(--color-foregroundAlt)' }}>Time: <strong style={{ color: 'var(--color-foreground)' }}>{getRunDate(viewedRun) ? new Date(getRunDate(viewedRun)).toLocaleTimeString() : '—'}</strong></span>
            </div>
          )}

          {/* Output */}
          <div className="card" style={{ marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <h2 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>Output</h2>
              {displayOutput && !isLoading && <OutputActions output={displayOutput} promptName={selectedPrompt?.name} />}
            </div>
            <div style={{ backgroundColor: 'var(--color-background)', padding: '1rem', borderRadius: '0.5rem', minHeight: '250px', fontSize: '0.875rem', color: isLoading ? 'var(--color-foregroundAlt)' : 'var(--color-foreground)', fontFamily: 'monospace', whiteSpace: 'pre-wrap', wordBreak: 'break-word', border: '1px solid var(--color-border)', overflowY: 'auto', maxHeight: '450px', ...(isLoading ? { display: 'flex', alignItems: 'center', justifyContent: 'center' } : {}) }}>
              {isLoading ? (
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⏳</div>
                  <div style={{ fontWeight: 500, marginBottom: '0.25rem' }}>Executing prompt…</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-foregroundAlt)' }}>Please wait while the model processes your request</div>
                </div>
              ) : displayOutput || (selectedPrompt ? 'Run the prompt to see the response here…' : 'Select a prompt to begin')}
            </div>
          </div>

          {/* History */}
          {allHistory.length > 0 && (
            <div className="card">
              <button onClick={() => setHistoryOpen(!historyOpen)} style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginBottom: historyOpen ? '0.75rem' : 0 }}>
                <h3 style={{ fontWeight: 600, fontSize: '0.95rem', margin: 0 }}>📋 Test History ({allHistory.length})</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  {selectedForCompare.length === 2 && (
                    <span onClick={e => { e.stopPropagation() }} style={{ display: 'inline-flex' }}>
                      <button onClick={runComparison} disabled={comparing} style={{ padding: '0.3rem 0.7rem', backgroundColor: 'var(--color-accent)', color: '#1d2021', border: 'none', borderRadius: '0.375rem', cursor: comparing ? 'not-allowed' : 'pointer', fontSize: '0.8rem', fontWeight: 600, opacity: comparing ? 0.5 : 1 }}>
                        {comparing ? '🤖 Judging…' : '🏆 AI Judge'}
                      </button>
                    </span>
                  )}
                  {selectedForCompare.length === 1 && <span style={{ fontSize: '0.75rem', color: 'var(--color-foregroundAlt)' }}>Select 1 more</span>}
                  <span style={{ fontSize: '0.85rem', color: 'var(--color-foregroundAlt)' }}>{historyOpen ? '▾' : '▸'}</span>
                </div>
              </button>

              {historyOpen && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '300px', overflowY: 'auto' }}>
                  {allHistory.map((run) => {
                    const isSelected = selectedForCompare.includes(run.id)
                    const compareLabel = isSelected ? String.fromCharCode(65 + selectedForCompare.indexOf(run.id)) : null
                    return (
                      <div key={run.id} style={{ display: 'flex', gap: '0', borderRadius: '0.5rem', overflow: 'hidden', border: `1px solid ${isSelected ? 'var(--color-accent)' : 'var(--color-border)'}` }}>
                        {/* Main content — click to view */}
                        <button onClick={() => setViewedRun(run)} style={{ flex: 1, padding: '0.6rem 0.75rem', background: 'var(--color-backgroundAlt)', border: 'none', cursor: 'pointer', textAlign: 'left', fontSize: '0.85rem', color: 'var(--color-foreground)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.15rem' }}>
                            <span style={{ fontWeight: 600 }}>{getRunModel(run)}</span>
                            {getRunVersion(run) != null && <span style={{ fontSize: '0.65rem', padding: '0.05rem 0.3rem', borderRadius: '0.2rem', backgroundColor: 'var(--color-surface)', color: 'var(--color-foregroundAlt)', border: '1px solid var(--color-border)' }}>v{getRunVersion(run)}</span>
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--color-foregroundAlt)' }}>
                            {getRunTokens(run)?.toLocaleString() ?? '—'} tok · {formatDuration(getRunDurationMs(run))} · {getRunDate(run) ? new Date(getRunDate(run)).toLocaleString() : '—'}
                          </div>
                        </button>
                        {/* Compare checkbox */}
                        <button onClick={() => toggleCompare(run.id)} style={{ width: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: isSelected ? 'var(--color-accent)' : 'var(--color-surface)', border: 'none', cursor: 'pointer', color: isSelected ? '#1d2021' : 'var(--color-foregroundAlt)', fontWeight: 700, fontSize: '0.75rem' }}>
                          {compareLabel || '＋'}
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* A/B Compare */}
              {(runA || runB) && (
                <div style={{ marginTop: '1rem', border: '1px solid var(--color-border)', borderRadius: '0.5rem', overflow: 'hidden' }}>
                  <div className="ab-compare-grid" style={{ display: 'grid', gridTemplateColumns: runA && runB ? '1fr 1fr' : '1fr', gap: '1px', backgroundColor: 'var(--color-border)' }}>
                    {[{ label: 'A', run: runA }, { label: 'B', run: runB }].filter(({ run }) => run).map(({ label, run }) => (
                      <div key={label} style={{ backgroundColor: 'var(--color-backgroundAlt)', padding: '0.75rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                          <span style={{ fontWeight: 700, fontSize: '0.85rem', color: label === 'A' ? '#22c55e' : '#3b82f6' }}>{label} · {run!.model || 'unknown'}{run!.version_number != null ? ` · v${run!.version_number}` : ''}</span>
                          {comparison?.winner === label && <span style={{ fontSize: '0.7rem', padding: '0.1rem 0.35rem', borderRadius: '0.2rem', backgroundColor: 'var(--color-success)', color: '#1d2021', fontWeight: 700 }}>Winner</span>}
                        </div>
                        <pre style={{ margin: 0, fontSize: '0.8rem', whiteSpace: 'pre-wrap', wordBreak: 'break-word', color: 'var(--color-foreground)', maxHeight: '250px', overflow: 'auto' }}>{run!.output || '(no output)'}</pre>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* AI Judge */}
              {comparison && (
                <div style={{ padding: '1rem', backgroundColor: 'var(--color-backgroundAlt)', borderRadius: '0.5rem', border: '1px solid var(--color-border)', marginTop: '0.75rem' }}>
                  <h4 style={{ margin: '0 0 0.75rem', fontSize: '0.9rem' }}>🏆 AI Judge</h4>
                  <div className="ab-compare-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '0.75rem' }}>
                    {(['A', 'B'] as const).map(label => {
                      const scores = comparison.scores?.[label]
                      if (!scores) return null
                      const total = Object.values(scores).reduce((a, b) => a + b, 0)
                      return (
                        <div key={label}>
                          <div style={{ fontWeight: 600, marginBottom: '0.25rem', color: label === 'A' ? '#22c55e' : '#3b82f6' }}>{label} — {total}/25</div>
                          {Object.entries(scores).map(([dim, val]) => (
                            <div key={dim} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                              <span style={{ textTransform: 'capitalize', color: 'var(--color-foregroundAlt)' }}>{dim}</span><span>{val}/5</span>
                            </div>
                          ))}
                        </div>
                      )
                    })}
                  </div>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-foreground)', lineHeight: 1.5 }}>{comparison.explanation}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        @media (min-width: 1024px) {
          .test-runner-grid {
            grid-template-columns: 280px minmax(0, 1fr) !important;
          }
          .test-config-mobile { display: none !important; }
          .test-config-desktop { display: block !important; }
        }
        @media (max-width: 1023px) {
          .test-config-desktop { display: none !important; }
          .test-config-mobile { display: block !important; }
        }
        @media (max-width: 640px) {
          .ab-compare-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  )
}

function ConfigCards({ variables, model, setModel, models, filteredModels, familyFilter, setFamilyFilter, families, modelsError, temperature, setTemperature, maxTokens, setMaxTokens, handleVariableChange, handleAddVariable, handleRenameVariable, handleRemoveVariable }: {
  variables: Record<string, string>
  model: string
  setModel: (m: string) => void
  models: ModelInfo[]
  filteredModels: ModelInfo[]
  familyFilter: string
  setFamilyFilter: (f: string) => void
  families: string[]
  modelsError: string | null
  temperature: string
  setTemperature: (t: string) => void
  maxTokens: string
  setMaxTokens: (m: string) => void
  handleVariableChange: (key: string, value: string) => void
  handleAddVariable: () => void
  handleRenameVariable: (oldKey: string, newKey: string) => void
  handleRemoveVariable: (key: string) => void
}) {
  return (
    <>
      <div className="card" style={{ marginBottom: '1rem' }}>
        <h3 style={{ fontWeight: 600, marginBottom: '0.75rem', fontSize: '0.95rem' }}>📝 Variables</h3>
        {Object.keys(variables).length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {Object.entries(variables).map(([key, value]) => (
              <div key={key}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                  <input type="text" defaultValue={key} onBlur={e => handleRenameVariable(key, e.target.value.trim())} style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-accent)', textTransform: 'uppercase', background: 'transparent', border: 'none', outline: 'none', padding: 0, fontFamily: 'inherit', cursor: 'text', width: '80%' }} />
                  <button onClick={() => handleRemoveVariable(key)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-foregroundAlt)', fontSize: '0.85rem', padding: '0 0.25rem', lineHeight: 1, opacity: 0.6 }} onMouseEnter={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.color = '#ff6b6b' }} onMouseLeave={e => { e.currentTarget.style.opacity = '0.6'; e.currentTarget.style.color = 'var(--color-foregroundAlt)' }}>✕</button>
                </div>
                <input type="text" value={value} onChange={e => handleVariableChange(key, e.target.value)} className="input" style={{ width: '100%' }} placeholder={`Value for {{${key}}}`} />
              </div>
            ))}
            <button onClick={handleAddVariable} className="btn btn-secondary" style={{ fontSize: '0.75rem' }}>+ Add Variable</button>
          </div>
        ) : (
          <div style={{ fontSize: '0.8rem', color: 'var(--color-foregroundAlt)' }}>No <code style={{ fontFamily: 'monospace' }}>{'{{variable}}'}</code> patterns detected.</div>
        )}
      </div>

      <div className="card" style={{ marginBottom: '1rem' }}>
        <h3 style={{ fontWeight: 600, marginBottom: '0.75rem', fontSize: '0.95rem' }}>🤖 Model</h3>
        {modelsError && <div style={{ padding: '0.5rem', backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '0.25rem', fontSize: '0.8rem', color: '#ef4444', marginBottom: '0.5rem' }}>{modelsError}</div>}
        {families.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', marginBottom: '0.5rem' }}>
            <button onClick={() => setFamilyFilter('all')} style={{ fontSize: '0.7rem', padding: '0.15rem 0.5rem', borderRadius: '9999px', cursor: 'pointer', backgroundColor: familyFilter === 'all' ? 'var(--color-accent)' : 'var(--color-surface)', color: familyFilter === 'all' ? '#1d2021' : 'var(--color-foregroundAlt)', border: '1px solid var(--color-border)' }}>all</button>
            {families.map(f => <button key={f} onClick={() => setFamilyFilter(f)} style={{ fontSize: '0.7rem', padding: '0.15rem 0.5rem', borderRadius: '9999px', cursor: 'pointer', backgroundColor: familyFilter === f ? 'var(--color-accent)' : 'var(--color-surface)', color: familyFilter === f ? '#1d2021' : 'var(--color-foregroundAlt)', border: '1px solid var(--color-border)' }}>{f}</button>)}
          </div>
        )}
        <select value={model} onChange={e => setModel(e.target.value)} className="input" style={{ width: '100%' }} disabled={models.length === 0}>
          {filteredModels.length > 0 ? filteredModels.map(m => <option key={m.id} value={m.id} title={m.description}>{m.name}{m.parameter_size ? ` (${m.parameter_size})` : ''}</option>) : <option value="">{modelsError ? 'No models available' : 'Loading…'}</option>}
        </select>
        {filteredModels.length > 0 && model && (() => { const s = filteredModels.find(m => m.id === model); return s ? <div style={{ fontSize: '0.75rem', color: 'var(--color-foregroundAlt)', marginTop: '0.3rem' }}>{s.description}</div> : null })()}
      </div>

      <div className="card" style={{ marginBottom: '1rem' }}>
        <h3 style={{ fontWeight: 600, marginBottom: '0.75rem', fontSize: '0.95rem' }}>⚙️ Parameters</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-accent)', textTransform: 'uppercase' }}>Temperature: {temperature}</label>
            <input type="range" min="0" max="2" step="0.1" value={temperature} onChange={e => setTemperature(e.target.value)} style={{ width: '100%' }} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-accent)', textTransform: 'uppercase' }}>Max Tokens</label>
            <input type="number" value={maxTokens} onChange={e => setMaxTokens(e.target.value)} className="input" style={{ width: '100%' }} min="1" max="4000" />
          </div>
        </div>
      </div>
    </>
  )
}