'use client'

import { useState, useEffect } from 'react'
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

interface TestResult {
  id: string
  created_at: string
  model: string
  output: string
  total_tokens: number
  latency_ms: number
}

export default function TestRunnerPage() {
  const [prompts, setPrompts] = useState<Prompt[]>([])
  const [selectedPrompt, setSelectedPrompt] = useState<Prompt | null>(null)
  const [variables, setVariables] = useState<Record<string, string>>({})
  const [model, setModel] = useState('gpt-oss:120b-cloud')
  const [temperature, setTemperature] = useState('0.7')
  const [maxTokens, setMaxTokens] = useState('500')
  const [isLoading, setIsLoading] = useState(false)
  const [output, setOutput] = useState('')
  const [results, setResults] = useState<TestResult[]>([])
  const [selectedResult, setSelectedResult] = useState<TestResult | null>(null)
  const [error, setError] = useState('')
  const [fetchingPrompts, setFetchingPrompts] = useState(true)

  // Fetch prompts on mount
  useEffect(() => {
    const fetchPrompts = async () => {
      try {
        const token = localStorage.getItem('auth-token')
        if (!token) {
          setError('Not authenticated')
          setFetchingPrompts(false)
          return
        }

        const res = await fetch(API_ENDPOINTS.prompts.list, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        if (res.ok) {
          const data = await res.json()
          setPrompts(Array.isArray(data) ? data : [])
        } else {
          setError('Failed to load prompts')
        }
      } catch (err) {
        console.error('Failed to fetch prompts:', err)
        setError(err instanceof Error ? err.message : 'Failed to load prompts')
      } finally {
        setFetchingPrompts(false)
      }
    }
    fetchPrompts()
  }, [])

  // Extract variables from selected prompt
  const handleSelectPrompt = async (prompt: Prompt) => {
    setOutput('')
    setResults([])
    setError('')
    setVariables({})

    try {
      const token = localStorage.getItem('auth-token')
      // Fetch full prompt details to get latest_version
      const res = await fetch(API_ENDPOINTS.prompts.detail(prompt.id), {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (!res.ok) {
        throw new Error('Failed to load prompt details')
      }

      const fullPrompt = await res.json()
      setSelectedPrompt(fullPrompt)

      // Extract variables from template (e.g., {{variable_name}})
      const latestVersion = fullPrompt.latest_version || fullPrompt.versions?.[0]
      if (latestVersion?.template_body) {
        const templateBody = latestVersion.template_body
        const varMatches = templateBody.match(/\{\{(\w+)\}\}/g) || []
        const extractedVars: Record<string, string> = {}

        varMatches.forEach((match) => {
          const varName = match.slice(2, -2) // Remove {{ and }}
          extractedVars[varName] = ''
        })

        setVariables(extractedVars)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load prompt')
    }
  }

  const handleVariableChange = (key: string, value: string) => {
    setVariables((prev) => ({ ...prev, [key]: value }))
  }

  const handleExecute = async () => {
    if (!selectedPrompt) {
      setError('Please select a prompt to test')
      return
    }

    setIsLoading(true)
    setOutput('')
    setError('')

    try {
      const latestVersion = selectedPrompt.latest_version || selectedPrompt.versions?.[0]

      if (!latestVersion) {
        throw new Error('Prompt version not found. Please select a prompt again.')
      }

      const token = localStorage.getItem('auth-token')
      const res = await fetch(API_ENDPOINTS.execute.run, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          prompt_version_id: latestVersion.id,
          variables,
        })
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.detail || 'Execution failed')
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
      }

      setResults([testResult, ...results])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Execution failed')
      setOutput('')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div style={{ padding: '2rem' }}>
      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>▶️ Test Runner</h1>
        <p style={{ color: 'var(--color-foregroundAlt)', marginBottom: '1.5rem' }}>
          Select a prompt and test it against your configured LLM
        </p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '2rem' }}>
        {/* Control Panel */}
        <div>
          {/* Prompt Selection */}
          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ fontWeight: '600', marginBottom: '1rem', fontSize: '0.95rem' }}>
              📄 Select Prompt
            </h3>
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
                      backgroundColor: selectedPrompt?.id === prompt.id ? 'var(--color-primary)' : 'var(--color-background)',
                      border: `1px solid ${selectedPrompt?.id === prompt.id ? 'var(--color-primary)' : 'var(--color-border)'}`,
                      borderRadius: '0.5rem',
                      cursor: 'pointer',
                      fontSize: '0.875rem',
                      textAlign: 'left',
                      transition: 'all 0.2s ease',
                      color: selectedPrompt?.id === prompt.id ? 'white' : 'var(--color-foreground)',
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
              {/* Variables */}
              {Object.keys(variables).length > 0 && (
                <div className="card" style={{ marginBottom: '1.5rem' }}>
                  <h3 style={{ fontWeight: '600', marginBottom: '1rem', fontSize: '0.95rem' }}>
                    📝 Variables
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {Object.entries(variables).map(([key, value]) => (
                      <div key={key}>
                        <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.75rem', fontWeight: '600', color: 'var(--color-accent)', textTransform: 'uppercase' }}>
                          {key}
                        </label>
                        <input
                          type="text"
                          value={value}
                          onChange={(e) => handleVariableChange(key, e.target.value)}
                          className="input"
                          style={{ width: '100%' }}
                          placeholder={`Enter ${key}`}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Model Selection */}
              <div className="card" style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ fontWeight: '600', marginBottom: '1rem', fontSize: '0.95rem' }}>
                  🤖 Model
                </h3>
                <select
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className="input"
                  style={{ width: '100%' }}
                >
                  <option value="llama3.2">Llama 3.2</option>
                  <option value="gpt-oss:120b-cloud">GPT-OSS 120B (Cloud)</option>
                  <option value="mistral">Mistral</option>
                  <option value="neural-chat">Neural Chat</option>
                </select>
              </div>

              {/* Parameters */}
              <div className="card" style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ fontWeight: '600', marginBottom: '1rem', fontSize: '0.95rem' }}>
                  ⚙️ Parameters
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.75rem', fontWeight: '600', color: 'var(--color-accent)', textTransform: 'uppercase' }}>
                      Temperature: {temperature}
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="2"
                      step="0.1"
                      value={temperature}
                      onChange={(e) => setTemperature(e.target.value)}
                      style={{ width: '100%' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.75rem', fontWeight: '600', color: 'var(--color-accent)', textTransform: 'uppercase' }}>
                      Max Tokens
                    </label>
                    <input
                      type="number"
                      value={maxTokens}
                      onChange={(e) => setMaxTokens(e.target.value)}
                      className="input"
                      style={{ width: '100%' }}
                      min="1"
                      max="4000"
                    />
                  </div>
                </div>
              </div>

              <button
                onClick={handleExecute}
                disabled={isLoading}
                className="btn btn-primary"
                style={{ width: '100%', opacity: isLoading ? 0.6 : 1, cursor: isLoading ? 'not-allowed' : 'pointer' }}
              >
                {isLoading ? '⏳ Executing...' : '▶️ Execute'}
              </button>
            </>
          )}
        </div>

        {/* Output Panel */}
        <div>
          {error && (
            <div className="card" style={{ marginBottom: '1.5rem', padding: '1rem', backgroundColor: 'rgba(255, 0, 0, 0.1)', borderLeft: '4px solid #ff6b6b' }}>
              <div style={{ color: '#ff6b6b', fontWeight: '600' }}>Error</div>
              <div style={{ color: 'var(--color-foregroundAlt)', fontSize: '0.875rem', marginTop: '0.5rem' }}>{error}</div>
            </div>
          )}

          {/* Run Statistics */}
          {output && results.length > 0 && (
            <div className="card" style={{ marginBottom: '1.5rem', backgroundColor: 'var(--color-backgroundAlt)', padding: '1rem' }}>
              <h3 style={{ fontWeight: '600', marginBottom: '0.75rem', fontSize: '0.95rem', color: 'var(--color-foreground)' }}>
                📊 Run Statistics
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: '500', color: 'var(--color-foregroundAlt)', marginBottom: '0.25rem', textTransform: 'uppercase' }}>
                    Model
                  </div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--color-foreground)', fontFamily: 'monospace' }}>
                    {results[0]?.model || 'Unknown'}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: '500', color: 'var(--color-foregroundAlt)', marginBottom: '0.25rem', textTransform: 'uppercase' }}>
                    Duration
                  </div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--color-foreground)' }}>
                    {results[0]?.latency_ms ? `${results[0].latency_ms}ms` : 'N/A'}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: '500', color: 'var(--color-foregroundAlt)', marginBottom: '0.25rem', textTransform: 'uppercase' }}>
                    Total Tokens
                  </div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--color-foreground)' }}>
                    {results[0]?.total_tokens || 'N/A'}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: '500', color: 'var(--color-foregroundAlt)', marginBottom: '0.25rem', textTransform: 'uppercase' }}>
                    Timestamp
                  </div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--color-foreground)' }}>
                    {results[0]?.created_at ? new Date(results[0].created_at).toLocaleTimeString() : 'N/A'}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '1rem', color: 'var(--color-foreground)' }}>
              Output
            </h2>
            <div style={{
              backgroundColor: 'var(--color-background)',
              padding: '1rem',
              borderRadius: '0.5rem',
              minHeight: '300px',
              fontSize: '0.875rem',
              color: 'var(--color-foregroundAlt)',
              fontFamily: 'monospace',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              border: '1px solid var(--color-border)',
              overflowY: 'auto',
              maxHeight: '500px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: isLoading ? 'center' : 'flex-start'
            }}>
              {isLoading ? (
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⏳</div>
                  <div style={{ color: 'var(--color-foreground)', fontWeight: '500', marginBottom: '0.5rem' }}>Executing prompt...</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-foregroundAlt)' }}>Please wait while the LLM processes your request</div>
                </div>
              ) : (
                output || (selectedPrompt ? 'Run the prompt to see the response here...' : 'Select a prompt to begin')
              )}
            </div>
          </div>

          {/* History */}
          {results.length > 0 && (
            <div className="card">
              <h3 style={{ fontWeight: '600', marginBottom: '1rem', fontSize: '0.95rem' }}>
                📋 Test History ({results.length})
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '250px', overflowY: 'auto' }}>
                {results.map((result) => (
                  <button
                    key={result.id}
                    onClick={() => setSelectedResult(result)}
                    style={{
                      padding: '0.75rem',
                      backgroundColor: selectedResult?.id === result.id ? 'var(--color-accent)' : 'var(--color-background)',
                      border: '1px solid var(--color-border)',
                      borderRadius: '0.5rem',
                      cursor: 'pointer',
                      fontSize: '0.75rem',
                      textAlign: 'left',
                      transition: 'all 0.2s ease',
                      color: selectedResult?.id === result.id ? '#1d2021' : 'var(--color-foreground)'
                    }}
                  >
                    <div style={{ fontWeight: '600' }}>{result.model}</div>
                    <div style={{ fontSize: '0.7rem', opacity: 0.7 }}>
                      {new Date(result.created_at).toLocaleString()} • {result.total_tokens} tokens • {result.latency_ms}ms
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
