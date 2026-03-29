'use client'

export default function Home() {
  return (
    <div style={{ minHeight: '100vh', padding: '2rem' }}>
      <main>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
          <div className="card" style={{ cursor: 'pointer', transition: 'border-color 0.2s' }} onClick={() => (window.location.href = '/snippets')} onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--color-accent)'} onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--color-border)'}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.5rem' }}>📚 Snippet Library</h2>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-foregroundAlt)' }}>Create and manage reusable text blocks</p>
          </div>

          <div className="card" style={{ cursor: 'pointer', transition: 'border-color 0.2s' }} onClick={() => (window.location.href = '/prompts')} onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--color-accent)'} onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--color-border)'}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.5rem' }}>⚡ Prompt Workspace</h2>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-foregroundAlt)' }}>Build and compose complex prompts</p>
          </div>

          <div className="card" style={{ cursor: 'pointer', transition: 'border-color 0.2s' }} onClick={() => (window.location.href = '/history')} onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--color-accent)'} onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--color-border)'}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.5rem' }}>📊 Version History</h2>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-foregroundAlt)' }}>Compare and manage prompt versions</p>
          </div>

          <div className="card" style={{ cursor: 'pointer', transition: 'border-color 0.2s' }} onClick={() => (window.location.href = '/test')} onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--color-accent)'} onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--color-border)'}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.5rem' }}>▶️ Test Runner</h2>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-foregroundAlt)' }}>Execute and test prompts with APIs</p>
          </div>
        </div>

        <div className="card">
          <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>✅ Getting Started</h2>
          <div style={{ color: 'var(--color-foregroundAlt)' }}>
            <p style={{ marginBottom: '1rem' }}>Welcome to Promptoria Archive Scribe. Click on any section to explore.</p>
            <p style={{ marginBottom: '0.5rem', color: 'var(--color-accent)', fontWeight: '600' }}>Core Features:</p>
            <ul style={{ marginLeft: '1.5rem', listStyle: 'disc' }}>
              <li>Create and organize reusable snippets</li>
              <li>Build complex prompts from your library</li>
              <li>Track every version and see detailed diffs</li>
              <li>Test prompts against real LLM APIs</li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  )
}
