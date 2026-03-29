'use client'

import { useState } from 'react'

export default function TestRunnerPage() {
  const [variables, setVariables] = useState({
    product_name: 'Premium Wireless Headphones',
    product_category: 'Audio Equipment',
  })
  const [isLoading, setIsLoading] = useState(false)

  const handleVariableChange = (key: string, value: string) => {
    setVariables((prev) => ({ ...prev, [key]: value }))
  }

  const handleExecute = async () => {
    setIsLoading(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 1000))
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

        <div className="card" style={{ backgroundColor: 'var(--color-background)', padding: '1rem' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: '600', color: 'var(--color-accent)', marginBottom: '0.75rem' }}>
            🧪 How to test your prompts
          </h3>
          <ul style={{ fontSize: '0.875rem', color: 'var(--color-foregroundAlt)', marginLeft: '1.5rem', listStyle: 'disc' }}>
            <li style={{ marginBottom: '0.5rem' }}><strong>Select a prompt</strong> from your library</li>
            <li style={{ marginBottom: '0.5rem' }}><strong>Fill in variables</strong> like {"{topic}"} or {"{tone}"}</li>
            <li style={{ marginBottom: '0.5rem' }}><strong>Choose an API</strong> (OpenAI, Claude, etc.)</li>
            <li style={{ marginBottom: '0.5rem' }}><strong>Set parameters</strong> (temperature, max tokens)</li>
            <li style={{ marginBottom: '0.5rem' }}><strong>Execute</strong> and see the response instantly</li>
            <li>Results are logged for comparison and iteration</li>
          </ul>
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
        {/* Variables Panel */}
        <div>
          <div className="card" style={{ marginBottom: '1rem' }}>
            <h2 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1rem', color: 'var(--color-foreground)' }}>
              Variables
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {Object.entries(variables).map(([key, value]) => (
                <div key={key}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '600', color: 'var(--color-accent)' }}>
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

          <button
            onClick={handleExecute}
            disabled={isLoading}
            className="btn btn-primary"
            style={{ width: '100%', padding: '0.75rem 1rem', fontSize: '1rem' }}
          >
            {isLoading ? '⏳ Executing...' : '▶️ Execute Prompt'}
          </button>
        </div>

        {/* Output Panel */}
        <div>
          <div className="card">
            <h2 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1rem', color: 'var(--color-foreground)' }}>
              Output
            </h2>
            <div style={{
              backgroundColor: 'var(--color-background)',
              padding: '1rem',
              borderRadius: '0.25rem',
              minHeight: '200px',
              fontSize: '0.875rem',
              color: 'var(--color-foregroundAlt)',
              fontFamily: 'monospace',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            }}>
              Run a prompt to see the LLM response here...
            </div>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: '2rem', backgroundColor: 'var(--color-background)' }}>
        <h3 style={{ fontSize: '0.95rem', fontWeight: '600', color: 'var(--color-accent)', marginBottom: '0.75rem' }}>
          ⚙️ Coming Soon
        </h3>
        <ul style={{ fontSize: '0.875rem', color: 'var(--color-foregroundAlt)', marginLeft: '1.5rem', listStyle: 'disc' }}>
          <li>Multiple LLM API integrations (OpenAI, Claude, Cohere)</li>
          <li>Token counting and cost estimation</li>
          <li>Parameter tuning (temperature, max_tokens, top_p)</li>
          <li>Batch testing with multiple inputs</li>
          <li>Comparison mode to A/B test prompts</li>
        </ul>
      </div>
    </div>
  )
}
