'use client'

import { useState, useEffect } from 'react'
import { API_ENDPOINTS } from '@/lib/api-config'

interface TestRun {
  id: string
  prompt_version_id: string
  version_number: number
  model: string | null
  temperature: number | null
  max_tokens: number | null
  test_case_input: string
  output: string | null
  total_tokens: number | null
  duration_ms: number | null
  completed_at: string | null
  created_at: string
}

interface TestComparisonResult {
  winner: string
  winner_id: string | null
  scores: {
    A: Record<string, number>
    B: Record<string, number>
  }
  explanation: string
}

interface TestHistoryPanelProps {
  promptId: string | null
  promptContent: string
}

export default function TestHistoryPanel({ promptId, promptContent }: TestHistoryPanelProps) {
  const [testRuns, setTestRuns] = useState<TestRun[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedForCompare, setSelectedForCompare] = useState<string[]>([])
  const [comparison, setComparison] = useState<TestComparisonResult | null>(null)
  const [comparing, setComparing] = useState(false)

  useEffect(() => {
    if (!promptId) return
    fetchTestRuns()
  }, [promptId])

  const fetchTestRuns = async () => {
    if (!promptId) return
    setLoading(true)
    try {
      const token = localStorage.getItem('auth-token')
      const res = await fetch(API_ENDPOINTS.prompts.testRuns(promptId), {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      if (res.ok) {
        const data = await res.json()
        setTestRuns(data.test_runs || [])
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }

  const toggleCompare = (id: string) => {
    setSelectedForCompare((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id)
      if (prev.length >= 2) return [prev[1], id] // keep latest 2
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
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          test_run_a_id: selectedForCompare[0],
          test_run_b_id: selectedForCompare[1],
        }),
      })
      if (res.ok) {
        const data = await res.json()
        setComparison(data.comparison)
      }
    } catch {
      // silently fail
    } finally {
      setComparing(false)
    }
  }

  if (loading) return <div style={{ padding: '1rem', color: 'var(--color-foregroundAlt)' }}>Loading test history...</div>
  if (!promptId) return <div style={{ padding: '1rem', color: 'var(--color-foregroundAlt)' }}>Load a prompt to see test history.</div>

  const runA = testRuns.find((r) => r.id === selectedForCompare[0])
  const runB = testRuns.find((r) => r.id === selectedForCompare[1])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ fontWeight: '600', fontSize: '0.95rem', margin: 0 }}>
          🧪 Test History ({testRuns.length})
        </h3>
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
      </div>

      {/* Test run list */}
      {testRuns.length === 0 ? (
        <p style={{ color: 'var(--color-foregroundAlt)', fontSize: '0.875rem' }}>No test runs yet for this prompt.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {testRuns.map((tr) => {
            const isSelected = selectedForCompare.includes(tr.id)
            return (
              <div
                key={tr.id}
                onClick={() => toggleCompare(tr.id)}
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
                        fontSize: '0.7rem',
                        padding: '0.1rem 0.35rem',
                        borderRadius: '0.2rem',
                        backgroundColor: 'var(--color-accent)',
                        color: '#1d2021',
                        fontWeight: '700',
                      }}>
                        {selectedForCompare.indexOf(tr.id) === 0 ? 'A' : 'B'}
                      </span>
                    )}
                    <span style={{ fontWeight: '600', fontSize: '0.85rem' }}>{tr.model || 'unknown'}</span>
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-foregroundAlt)' }}>
                    {tr.total_tokens?.toLocaleString()} tok · {tr.duration_ms ? `${(tr.duration_ms / 1000).toFixed(1)}s` : '—'}
                  </span>
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--color-foregroundAlt)', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {tr.test_case_input}
                </p>
              </div>
            )
          })}
        </div>
      )}

      {/* A/B Side-by-side Output */}
      {runA && runB && (
        <div style={{ border: '1px solid var(--color-border)', borderRadius: '0.5rem', overflow: 'hidden', marginTop: '0.5rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1px', backgroundColor: 'var(--color-border)' }}>
            {[
              { label: 'A', run: runA },
              { label: 'B', run: runB },
            ].map(({ label, run }) => (
              <div key={label} style={{ backgroundColor: 'var(--color-backgroundAlt)', padding: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span style={{ fontWeight: '700', fontSize: '0.85rem', color: label === 'A' ? '#22c55e' : '#3b82f6' }}>Version {label} · v{run.version_number}</span>
                  {comparison?.winner === label && (
                    <span style={{ fontSize: '0.7rem', padding: '0.1rem 0.35rem', borderRadius: '0.2rem', backgroundColor: 'var(--color-success)', color: '#1d2021', fontWeight: '700' }}>Winner</span>
                  )}
                </div>
                <pre style={{
                  margin: 0,
                  fontSize: '0.8rem',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  color: 'var(--color-foreground)',
                  maxHeight: '300px',
                  overflow: 'auto',
                }}>
                  {run.output || '(no output)'}
                </pre>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI Judge Result */}
      {comparison && (
        <div style={{
          padding: '1rem',
          backgroundColor: 'var(--color-backgroundAlt)',
          borderRadius: '0.5rem',
          border: '1px solid var(--color-border)',
          marginTop: '0.5rem',
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
  )
}
