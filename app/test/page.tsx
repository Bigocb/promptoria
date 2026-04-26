'use client'

import React, { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { API_ENDPOINTS } from '@/lib/api-config'
import styles from './test.module.css'

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
  scores: { A: Record<string, number>; B: Record<string, number> }
  explanation: string
}

interface HistoryRunPersisted {
  _type: 'persisted'
  id: string
  version_number: number
  model: string | null
  output: string | null
  total_tokens: number | null
  duration_ms: number | null
  temperature: number | null
  created_at: string
  test_case_input: string
}

interface HistoryRunSession {
  _type: 'session'
  id: string
  model: string
  output: string
  total_tokens: number
  latency_ms: number
  temperature: number
  created_at: string
  version_number?: number
}

type HistoryRun = HistoryRunPersisted | HistoryRunSession

function getRunModel(r: HistoryRun) { return r.model || 'unknown' }
function getRunTokens(r: HistoryRun) { return r._type === 'session' ? r.total_tokens : r.total_tokens }
function getRunDurationMs(r: HistoryRun) { return r._type === 'persisted' ? r.duration_ms : r.latency_ms }
function getRunVersion(r: HistoryRun) { return r.version_number ?? null }
function getRunOutput(r: HistoryRun) { return r.output || '(no output)' }
function getRunDate(r: HistoryRun) { return r.created_at }
function getRunTemp(r: HistoryRun) { return r.temperature }

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
        padding: '0.35rem 0.75rem', fontSize: '0.75rem', fontWeight: 500,
        border: '1px solid var(--color-border)', borderRadius: '0.375rem', cursor: 'pointer',
        backgroundColor: copied ? 'var(--color-accent)' : 'var(--color-surface)',
        color: copied ? '#1d2021' : 'var(--color-foreground)',
      }}>
        {copied ? 'Copied' : 'Copy'}
      </button>
      <button onClick={handleDownload} style={{
        display: 'flex', alignItems: 'center', gap: '0.35rem',
        padding: '0.35rem 0.75rem', fontSize: '0.75rem', fontWeight: 500,
        border: '1px solid var(--color-border)', borderRadius: '0.375rem', cursor: 'pointer',
        backgroundColor: 'var(--color-surface)', color: 'var(--color-foreground)',
      }}>
        Download
      </button>
    </div>
  )
}

function formatDuration(ms: number | null | undefined): string {
  if (!ms) return '-'
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
        const res = await fetch(API_ENDPOINTS.models, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
        if (res.ok) {
          const data = await res.json()
          setModels(data.models || [])
          if (data.error) setModelsError(data.error)
          if (data.models?.length > 0 && !model) setModel(data.models[0].id)
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
      const res = await fetch(API_ENDPOINTS.prompts.testRuns(promptId), { headers: { Authorization: `Bearer ${token}` } })
      if (res.ok) {
        const data = await res.json()
        setPersistedRuns(data.test_runs || [])
      }
    } catch {
      // silent
    } finally {
      setLoadingHistory(false)
    }
  }, [])

  const handleSelectPrompt = async (prompt: Prompt) => {
    setOutput('')
    setResults([])
    setError('')
    setVariables({})
    setSelectedForCompare([])
    setComparison(null)
    setViewedRun(null)
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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load prompt')
    }
  }

  const handleVersionChange = (versionId: string) => {
    setSelectedVersionId(versionId)
    const ver = selectedPrompt?.versions?.find((v: PromptVersion) => v.id === versionId)
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
    setIsLoading(true)
    setOutput('')
    setError('')

    const activeVersion = selectedPrompt.versions?.find((v: PromptVersion) => v.id === selectedVersionId) || selectedPrompt.latest_version || selectedPrompt.versions?.[0]
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
        }),
      })
      const requestEndTime = performance.now()
      const requestDuration = Math.round(requestEndTime - requestStartTime)

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || errorData.detail || 'Execution failed')
      }

      const result = await res.json()
      setOutput(result.output || '')

      const testResult: TestResult = {
        id: result.id,
        created_at: result.created_at,
        model: result.model,
        output: result.output || '',
        total_tokens: result.total_tokens,
        latency_ms: result.latency_ms || result.request_duration_ms || requestDuration,
        request_duration_ms: requestDuration,
        version_number: activeVersion.version_number,
      }
      setResults([testResult, ...results])
      setViewedRun({ ...testResult, _type: 'session', temperature: parseFloat(temperature) })
      if (selectedPrompt) fetchPersistedHistory(selectedPrompt.id)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Execution failed')
      setOutput('')
    } finally {
      setIsLoading(false)
    }
  }

  const toggleCompare = (id: string) => {
    setSelectedForCompare((prev) => {
      if (prev.includes(id)) return prev.filter((x: string) => x !== id)
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

  const mergeHistory = (): HistoryRun[] => {
    const seen = new Set<string>()
    const merged: HistoryRun[] = []
    for (const r of results) {
      if (!seen.has(r.id)) {
        merged.push({
          _type: 'session',
          id: r.id,
          model: r.model,
          output: r.output,
          total_tokens: r.total_tokens,
          latency_ms: r.latency_ms,
          temperature: parseFloat(temperature),
          created_at: r.created_at,
          version_number: r.version_number,
        })
        seen.add(r.id)
      }
    }
    for (const r of persistedRuns) {
      if (!seen.has(r.id)) {
        merged.push({
          _type: 'persisted',
          id: r.id,
          version_number: r.version_number,
          model: r.model,
          output: r.output,
          total_tokens: r.total_tokens,
          duration_ms: r.duration_ms,
          temperature: r.temperature,
          created_at: r.created_at,
          test_case_input: r.test_case_input,
        })
        seen.add(r.id)
      }
    }
    return merged
  }

  const allHistory = mergeHistory()
  const filteredModels = models.filter((m: ModelInfo) => familyFilter === 'all' || m.family === familyFilter)
  const families = Array.from(new Set(models.map((m: ModelInfo) => m.family).filter(Boolean)))
  const displayOutput = viewedRun ? getRunOutput(viewedRun) : output

  const findRunForCompare = (id: string): PersistedTestRun | null => {
    const session = results.find((r: TestResult) => r.id === id)
    if (session) {
      return {
        id: session.id,
        version_number: session.version_number ?? 0,
        model: session.model,
        test_case_input: '',
        output: session.output,
        total_tokens: session.total_tokens,
        duration_ms: session.latency_ms ?? null,
        temperature: parseFloat(temperature),
        max_tokens: parseInt(maxTokens),
        completed_at: session.created_at,
        created_at: session.created_at,
      }
    }
    const persisted = persistedRuns.find((r: PersistedTestRun) => r.id === id)
    return persisted || null
  }

  const runA = selectedForCompare[0] ? findRunForCompare(selectedForCompare[0]) : null
  const runB = selectedForCompare[1] ? findRunForCompare(selectedForCompare[1]) : null

  const selectedModelInfo = filteredModels.find((m: ModelInfo) => m.id === model)

  return (
    <div className={styles.wrapper}>
      <header style={{ marginBottom: '1.5rem' }}>
        <div style={{ marginBottom: '0.75rem' }}>
          <Link href="/dashboard" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', color: 'var(--color-foregroundAlt)', textDecoration: 'none', fontSize: '0.875rem', padding: '0.375rem 0.75rem', border: '1px solid var(--color-border)', borderRadius: '0.375rem' }}>
            ← Dashboard
          </Link>
        </div>
        <h1 style={{ fontSize: 'clamp(1.25rem, 5vw, 2rem)', fontWeight: 'bold' }}>Test Runner</h1>
      </header>

      <div className={styles.grid}>
        <div>
          <div className="card" style={{ marginBottom: '1rem' }}>
            <h3 style={{ fontWeight: 600, marginBottom: '0.75rem', fontSize: '0.95rem' }}>Prompt</h3>
            {fetchingPrompts ? (
              <div style={{ color: 'var(--color-foregroundAlt)' }}>Loading...</div>
            ) : prompts.length === 0 ? (
              <div style={{ color: 'var(--color-foregroundAlt)' }}>No prompts found.</div>
            ) : (
              <select value={selectedPrompt?.id || ''} onChange={(e) => { const p = prompts.find((p: Prompt) => p.id === e.target.value); if (p) handleSelectPrompt(p) }} className="input" style={{ width: '100%' }}>
                <option value="">Select a prompt...</option>
                {prompts.map((p: Prompt) => <option key={p.id} value={p.id}>{p.name}{p.description ? ` — ${p.description.slice(0, 40)}` : ''}</option>)}
              </select>
            )}
          </div>

          {selectedPrompt && (
            <>
              {(selectedPrompt.versions?.length ?? 0) > 1 && (
                <div className="card" style={{ marginBottom: '1rem' }}>
                  <h3 style={{ fontWeight: 600, marginBottom: '0.5rem', fontSize: '0.95rem' }}>Version</h3>
                  <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                    {selectedPrompt.versions?.map((v: PromptVersion) => (
                      <button key={v.id} onClick={() => handleVersionChange(v.id)} style={{
                        padding: '0.3rem 0.7rem', fontSize: '0.8rem', borderRadius: '0.375rem',
                        border: `1px solid ${selectedVersionId === v.id ? 'var(--color-accent)' : 'var(--color-border)'}`,
                        backgroundColor: selectedVersionId === v.id ? 'var(--color-accent)' : 'var(--color-surface)',
                        color: selectedVersionId === v.id ? '#1d2021' : 'var(--color-foreground)',
                        cursor: 'pointer', fontWeight: selectedVersionId === v.id ? 600 : 400,
                      }}>
                        v{v.version_number}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className={styles.configDesktop}>
                <ConfigCards variables={variables} model={model} setModel={setModel} models={models} filteredModels={filteredModels} familyFilter={familyFilter} setFamilyFilter={setFamilyFilter} families={families} modelsError={modelsError} temperature={temperature} setTemperature={setTemperature} maxTokens={maxTokens} setMaxTokens={setMaxTokens} selectedModelInfo={selectedModelInfo} handleVariableChange={handleVariableChange} handleAddVariable={handleAddVariable} handleRenameVariable={handleRenameVariable} handleRemoveVariable={handleRemoveVariable} />
              </div>
              <div className={styles.configMobile}>
                <button onClick={() => setConfigOpen(!configOpen)} style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--color-border)', background: 'var(--color-surface)', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 600, textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Model & Parameters</span>
                  <span>{configOpen ? '▾' : '▸'}</span>
                </button>
                {configOpen && (
                  <div style={{ marginTop: '0.5rem' }}>
                    <ConfigCards variables={variables} model={model} setModel={setModel} models={models} filteredModels={filteredModels} familyFilter={familyFilter} setFamilyFilter={setFamilyFilter} families={families} modelsError={modelsError} temperature={temperature} setTemperature={setTemperature} maxTokens={maxTokens} setMaxTokens={setMaxTokens} selectedModelInfo={selectedModelInfo} handleVariableChange={handleVariableChange} handleAddVariable={handleAddVariable} handleRenameVariable={handleRenameVariable} handleRemoveVariable={handleRemoveVariable} />
                  </div>
                )}
              </div>

              <button onClick={handleExecute} disabled={isLoading} className="btn btn-primary" style={{ width: '100%', marginTop: '1rem', opacity: isLoading ? 0.6 : 1, cursor: isLoading ? 'not-allowed' : 'pointer' }}>
                {isLoading ? 'Executing...' : 'Execute'}
              </button>
            </>
          )}
        </div>

        <div>
          {error && (
            <div className="card" style={{ marginBottom: '1rem', padding: '0.75rem 1rem', backgroundColor: 'rgba(255,0,0,0.08)', borderLeft: '3px solid #ff6b6b' }}>
              <div style={{ color: '#ff6b6b', fontWeight: 600, fontSize: '0.9rem' }}>Error</div>
              <div style={{ color: 'var(--color-foregroundAlt)', fontSize: '0.85rem', marginTop: '0.25rem' }}>{error}</div>
            </div>
          )}

          {viewedRun && (
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem', padding: '0.75rem 1rem', borderRadius: '0.5rem', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-backgroundAlt)', fontSize: '0.85rem' }}>
              <span style={{ color: 'var(--color-foregroundAlt)' }}>Model: <strong style={{ color: 'var(--color-foreground)', fontFamily: 'monospace' }}>{getRunModel(viewedRun)}</strong></span>
              <span style={{ color: 'var(--color-foregroundAlt)' }}>Tokens: <strong style={{ color: 'var(--color-foreground)' }}>{getRunTokens(viewedRun)?.toLocaleString() ?? '-'}</strong></span>
              <span style={{ color: 'var(--color-foregroundAlt)' }}>Duration: <strong style={{ color: 'var(--color-foreground)' }}>{formatDuration(getRunDurationMs(viewedRun))}</strong></span>
              {getRunVersion(viewedRun) != null && <span style={{ color: 'var(--color-foregroundAlt)' }}>Version: <strong style={{ color: 'var(--color-foreground)' }}>v{getRunVersion(viewedRun)}</strong></span>}
            </div>
          )}

          <div className="card" style={{ marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <h2 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>Output</h2>
              {displayOutput && !isLoading && <OutputActions output={displayOutput} promptName={selectedPrompt?.name} />}
            </div>
            <div style={{ backgroundColor: 'var(--color-background)', padding: '1rem', borderRadius: '0.5rem', minHeight: '250px', fontSize: '0.875rem', color: isLoading ? 'var(--color-foregroundAlt)' : 'var(--color-foreground)', fontFamily: 'monospace', whiteSpace: 'pre-wrap', wordBreak: 'break-word', border: '1px solid var(--color-border)', overflowY: 'auto', maxHeight: '450px', ...(isLoading ? { display: 'flex', alignItems: 'center', justifyContent: 'center' } : {}) }}>
              {isLoading ? (
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⏳</div>
                  <div style={{ fontWeight: 500, marginBottom: '0.25rem' }}>Executing prompt...</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-foregroundAlt)' }}>Please wait while the model processes your request</div>
                </div>
              ) : (
                displayOutput || (selectedPrompt ? 'Run the prompt to see the response here...' : 'Select a prompt to begin')
              )}
            </div>
          </div>

          {allHistory.length > 0 && (
            <div className="card">
              <button onClick={() => setHistoryOpen(!historyOpen)} style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginBottom: historyOpen ? '0.75rem' : 0 }}>
                <h3 style={{ fontWeight: 600, fontSize: '0.95rem', margin: 0 }}>Test History ({allHistory.length})</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  {selectedForCompare.length === 2 && (
                    <span onClick={(e) => e.stopPropagation()} style={{ display: 'inline-flex' }}>
                      <button onClick={runComparison} disabled={comparing} style={{ padding: '0.3rem 0.7rem', backgroundColor: 'var(--color-accent)', color: '#1d2021', border: 'none', borderRadius: '0.375rem', cursor: comparing ? 'not-allowed' : 'pointer', fontSize: '0.8rem', fontWeight: 600, opacity: comparing ? 0.5 : 1 }}>
                        {comparing ? 'Judging...' : 'AI Judge'}
                      </button>
                    </span>
                  )}
                  {selectedForCompare.length === 1 && <span style={{ fontSize: '0.75rem', color: 'var(--color-foregroundAlt)' }}>Select 1 more</span>}
                  <span style={{ fontSize: '0.85rem', color: 'var(--color-foregroundAlt)' }}>{historyOpen ? '▾' : '▸'}</span>
                </div>
              </button>

              {historyOpen && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '300px', overflowY: 'auto' }}>
                  {allHistory.map((run: HistoryRun) => {
                    const isSelected = selectedForCompare.includes(run.id)
                    const compareLabel = isSelected ? String.fromCharCode(65 + selectedForCompare.indexOf(run.id)) : null
                    return (
                      <div key={run.id} style={{ display: 'flex', gap: 0, borderRadius: '0.5rem', overflow: 'hidden', border: `1px solid ${isSelected ? 'var(--color-accent)' : 'var(--color-border)'}` }}>
                        <button onClick={() => setViewedRun(run)} style={{ flex: 1, padding: '0.85rem 0.75rem', background: 'var(--color-backgroundAlt)', border: 'none', cursor: 'pointer', textAlign: 'left', fontSize: '0.85rem', color: 'var(--color-foreground)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.25rem' }}>
                            <span style={{ fontWeight: 600 }}>{getRunModel(run)}</span>
                            {getRunVersion(run) != null && <span style={{ fontSize: '0.65rem', padding: '0.05rem 0.3rem', borderRadius: '0.2rem', backgroundColor: 'var(--color-surface)', color: 'var(--color-foregroundAlt)', border: '1px solid var(--color-border)' }}>v{getRunVersion(run)}</span>}
                            {getRunTemp(run) != null && <span style={{ fontSize: '0.65rem', padding: '0.05rem 0.3rem', borderRadius: '0.2rem', backgroundColor: 'var(--color-surface)', color: 'var(--color-foregroundAlt)', border: '1px solid var(--color-border)' }}>T:{getRunTemp(run)}</span>}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--color-foregroundAlt)' }}>
                            {getRunTokens(run)?.toLocaleString() ?? '-'} tok · {formatDuration(getRunDurationMs(run))} · {getRunDate(run) ? new Date(getRunDate(run)).toLocaleString() : '-'}
                          </div>
                        </button>
                        <button onClick={() => toggleCompare(run.id)} style={{ width: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: isSelected ? 'var(--color-accent)' : 'var(--color-surface)', border: 'none', cursor: 'pointer', color: isSelected ? '#1d2021' : 'var(--color-foregroundAlt)', fontWeight: 700, fontSize: '0.75rem' }}>
                          {compareLabel || '+'}
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}

              {(runA || runB) && (
                <div style={{ marginTop: '1rem', border: '1px solid var(--color-border)', borderRadius: '0.5rem', overflow: 'hidden' }}>
                  <div className={styles.abCompareGrid} style={{ display: 'grid', gridTemplateColumns: runA && runB ? '1fr 1fr' : '1fr', gap: '1px', backgroundColor: 'var(--color-border)' }}>
                    {runA && (
                      <div key="A" style={{ backgroundColor: 'var(--color-backgroundAlt)', padding: '0.75rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                          <span style={{ fontWeight: 700, fontSize: '0.85rem', color: '#22c55e' }}>A · {runA.model || 'unknown'}{runA.version_number != null ? ` · v${runA.version_number}` : ''}{runA.temperature != null ? ` · T:${runA.temperature}` : ''}</span>
                          {comparison?.winner === 'A' && <span style={{ fontSize: '0.7rem', padding: '0.1rem 0.35rem', borderRadius: '0.2rem', backgroundColor: '#22c55e', color: '#1d2021', fontWeight: 700 }}>Winner</span>}
                        </div>
                        <pre style={{ margin: 0, fontSize: '0.8rem', whiteSpace: 'pre-wrap', wordBreak: 'break-word', color: 'var(--color-foreground)', maxHeight: '250px', overflow: 'auto' }}>{runA.output || '(no output)'}</pre>
                      </div>
                    )}
                    {runB && (
                      <div key="B" style={{ backgroundColor: 'var(--color-backgroundAlt)', padding: '0.75rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                          <span style={{ fontWeight: 700, fontSize: '0.85rem', color: '#3b82f6' }}>B · {runB.model || 'unknown'}{runB.version_number != null ? ` · v${runB.version_number}` : ''}{runB.temperature != null ? ` · T:${runB.temperature}` : ''}</span>
                          {comparison?.winner === 'B' && <span style={{ fontSize: '0.7rem', padding: '0.1rem 0.35rem', borderRadius: '0.2rem', backgroundColor: '#3b82f6', color: '#fff', fontWeight: 700 }}>Winner</span>}
                        </div>
                        <pre style={{ margin: 0, fontSize: '0.8rem', whiteSpace: 'pre-wrap', wordBreak: 'break-word', color: 'var(--color-foreground)', maxHeight: '250px', overflow: 'auto' }}>{runB.output || '(no output)'}</pre>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {comparison && (
                <div style={{ padding: '1rem', backgroundColor: 'var(--color-backgroundAlt)', borderRadius: '0.5rem', border: '1px solid var(--color-border)', marginTop: '0.75rem' }}>
                  <h4 style={{ margin: '0 0 0.75rem', fontSize: '0.9rem' }}>AI Judge</h4>
                  <div className={styles.abCompareGrid} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '0.75rem' }}>
                    {(['A', 'B'] as const).map((label: 'A' | 'B') => {
                      const scores = comparison.scores?.[label]
                      if (!scores) return null
                      const total = Object.values(scores).reduce((a: number, b: number) => a + b, 0)
                      return (
                        <div key={label}>
                          <div style={{ fontWeight: 600, marginBottom: '0.25rem', color: label === 'A' ? '#22c55e' : '#3b82f6' }}>{label} — {total}/25</div>
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
                  <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-foreground)', lineHeight: 1.5 }}>{comparison.explanation}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function ConfigCards({ variables, model, setModel, models, filteredModels, familyFilter, setFamilyFilter, families, modelsError, temperature, setTemperature, maxTokens, setMaxTokens, selectedModelInfo, handleVariableChange, handleAddVariable, handleRenameVariable, handleRemoveVariable }: {
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
  selectedModelInfo: ModelInfo | undefined
  handleVariableChange: (key: string, value: string) => void
  handleAddVariable: () => void
  handleRenameVariable: (oldKey: string, newKey: string) => void
  handleRemoveVariable: (key: string) => void
}) {
  return (
    <>
      <div className="card" style={{ marginBottom: '1rem' }}>
        <h3 style={{ fontWeight: 600, marginBottom: '0.75rem', fontSize: '0.95rem' }}>Variables</h3>
        {Object.keys(variables).length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {Object.entries(variables).map(([key, value]) => (
              <div key={key}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                  <input type="text" defaultValue={key} onBlur={(e) => handleRenameVariable(key, e.target.value.trim())} style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-accent)', textTransform: 'uppercase', background: 'transparent', border: 'none', outline: 'none', padding: 0, fontFamily: 'inherit', cursor: 'text', width: '80%' }} />
                  <button onClick={() => handleRemoveVariable(key)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-foregroundAlt)', fontSize: '0.85rem', padding: '0 0.25rem', lineHeight: 1, opacity: 0.6 }}
                    onMouseEnter={(e) => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.color = '#ff6b6b' }}
                    onMouseLeave={(e) => { e.currentTarget.style.opacity = '0.6'; e.currentTarget.style.color = 'var(--color-foregroundAlt)' }}
                  >X</button>
                </div>
                <input type="text" value={value} onChange={(e) => handleVariableChange(key, e.target.value)} className="input" style={{ width: '100%' }} placeholder={`Value for {{${key}}}`} />
              </div>
            ))}
            <button onClick={handleAddVariable} className="btn btn-secondary" style={{ fontSize: '0.75rem' }}>+ Add Variable</button>
          </div>
        ) : (
          <div style={{ fontSize: '0.8rem', color: 'var(--color-foregroundAlt)' }}>
            No <code style={{ fontFamily: 'monospace' }}>{'{{variable}}'}</code> patterns detected.
          </div>
        )}
      </div>

      <div className="card" style={{ marginBottom: '1rem' }}>
        <h3 style={{ fontWeight: 600, marginBottom: '0.75rem', fontSize: '0.95rem' }}>Model</h3>
        {modelsError && <div style={{ padding: '0.5rem', backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '0.25rem', fontSize: '0.8rem', color: '#ef4444', marginBottom: '0.5rem' }}>{modelsError}</div>}
        {families.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', marginBottom: '0.5rem' }}>
            <button onClick={() => setFamilyFilter('all')} style={{ fontSize: '0.7rem', padding: '0.15rem 0.5rem', borderRadius: '9999px', cursor: 'pointer', backgroundColor: familyFilter === 'all' ? 'var(--color-accent)' : 'var(--color-surface)', color: familyFilter === 'all' ? '#1d2021' : 'var(--color-foregroundAlt)', border: '1px solid var(--color-border)' }}>all</button>
            {families.map((f: string) => <button key={f} onClick={() => setFamilyFilter(f)} style={{ fontSize: '0.7rem', padding: '0.15rem 0.5rem', borderRadius: '9999px', cursor: 'pointer', backgroundColor: familyFilter === f ? 'var(--color-accent)' : 'var(--color-surface)', color: familyFilter === f ? '#1d2021' : 'var(--color-foregroundAlt)', border: '1px solid var(--color-border)' }}>{f}</button>)}
          </div>
        )}
        <select value={model} onChange={(e) => setModel(e.target.value)} className="input" style={{ width: '100%' }} disabled={models.length === 0}>
          {filteredModels.length > 0 ? filteredModels.map((m: ModelInfo) => <option key={m.id} value={m.id} title={m.description}>{m.name}{m.parameter_size ? ` (${m.parameter_size})` : ''}</option>) : <option value="">{modelsError ? 'No models available' : 'Loading...'}</option>}
        </select>
        {selectedModelInfo && <div style={{ fontSize: '0.75rem', color: 'var(--color-foregroundAlt)', marginTop: '0.3rem' }}>{selectedModelInfo.description}</div>}
      </div>

      <div className="card" style={{ marginBottom: '1rem' }}>
        <h3 style={{ fontWeight: 600, marginBottom: '0.75rem', fontSize: '0.95rem' }}>Parameters</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-accent)', textTransform: 'uppercase' }}>Temperature: {temperature}</label>
            <input type="range" min="0" max="2" step="0.1" value={temperature} onChange={(e) => setTemperature(e.target.value)} style={{ width: '100%' }} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-accent)', textTransform: 'uppercase' }}>Max Tokens</label>
            <input type="number" value={maxTokens} onChange={(e) => setMaxTokens(e.target.value)} className="input" style={{ width: '100%' }} min="1" max="4000" />
          </div>
        </div>
      </div>
    </>
  )
}