'use client'

import { useState } from 'react'

interface TestResult {
  id: string
  timestamp: string
  model: string
  prompt: string
  output: string
}

export default function TestRunnerPage() {
  const [variables, setVariables] = useState({
    topic: 'sustainable fashion',
    style: 'professional',
  })
  const [model, setModel] = useState('llama3.2')
  const [temperature, setTemperature] = useState('0.7')
  const [maxTokens, setMaxTokens] = useState('500')
  const [isLoading, setIsLoading] = useState(false)
  const [output, setOutput] = useState('')
  const [results, setResults] = useState<TestResult[]>([])
  const [selectedResult, setSelectedResult] = useState<TestResult | null>(null)

  const handleVariableChange = (key: string, value: string) => {
    setVariables((prev) => ({ ...prev, [key]: value }))
  }

  const handleExecute = async () => {
    setIsLoading(true)
    setOutput('')
    try {
      // Simulate API call - in production, this would call actual LLM APIs
      await new Promise(resolve => setTimeout(resolve, 1500))

      const mockResponse = `Ollama Response (${model}) with temperature ${temperature}:\n\n` +
        `This is a simulated response testing your prompt with the variables you provided.\n` +
        `Variables used:\n${Object.entries(variables).map(([k, v]) => `- ${k}: ${v}`).join('\n')}\n\n` +
        `In production, this would call Ollama locally or via Ollama Cloud API.`

      setOutput(mockResponse)

      const result: TestResult = {
        id: Date.now().toString(),
        timestamp: new Date().toLocaleString(),
        model,
        prompt: JSON.stringify(variables),
        output: mockResponse
      }
      setResults([result, ...results])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div style={{ padding: '2rem' }}>
      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>▶️ Test Runner</h1>
        <p style={{ color: 'var(--color-foregroundAlt)', marginBottom: '1.5rem' }}>
          Execute prompts against LLM APIs and see real-time responses
        </p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '2rem' }}>
        {/* Control Panel */}
        <div>
          {/* Variables */}
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
                  />
                </div>
              ))}
            </div>
          </div>

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
            style={{ width: '100%' }}
          >
            {isLoading ? '⏳ Executing...' : '▶️ Execute'}
          </button>
        </div>

        {/* Output Panel */}
        <div>
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
              maxHeight: '500px'
            }}>
              {output || 'Run a prompt to see the LLM response here...'}
            </div>
          </div>

          {/* History */}
          {results.length > 0 && (
            <div className="card">
              <h3 style={{ fontWeight: '600', marginBottom: '1rem', fontSize: '0.95rem' }}>
                📋 Test History ({results.length})
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '200px', overflowY: 'auto' }}>
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
                    <div style={{ fontSize: '0.7rem', opacity: 0.7 }}>{result.timestamp}</div>
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
