'use client'

import { useState, useEffect } from 'react'

interface Snippet {
  id: string
  name: string
  content: string
}

export default function PromptsPage() {
  const [snippets, setSnippets] = useState<Snippet[]>([])
  const [promptName, setPromptName] = useState('')
  const [promptContent, setPromptContent] = useState('')
  const [variables, setVariables] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSnippets()
  }, [])

  const fetchSnippets = async () => {
    try {
      const res = await fetch('/api/snippets')
      const data = await res.json()
      setSnippets(data.snippets || [])
    } catch (error) {
      console.error('Failed to fetch snippets:', error)
    } finally {
      setLoading(false)
    }
  }

  const insertSnippet = (snippet: Snippet) => {
    const insertion = `[SNIPPET: ${snippet.name}]\n${snippet.content}\n`
    setPromptContent(promptContent + insertion)
  }

  const extractVariables = () => {
    const matches = promptContent.match(/\{([^}]+)\}/g)
    if (matches) {
      const vars = matches.map(m => m.slice(1, -1)).filter((v, i, a) => a.indexOf(v) === i)
      setVariables(vars.join(', '))
    }
  }

  const savePrompt = async () => {
    if (!promptName.trim() || !promptContent.trim()) {
      alert('Please enter a prompt name and content')
      return
    }
    console.log('Saving prompt:', { name: promptName, content: promptContent, variables })
    // TODO: Implement prompt saving to database
    alert('Prompt saved! (feature coming soon)')
  }

  return (
    <div style={{ padding: '2rem' }}>
      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>⚡ Prompt Workspace</h1>
        <p style={{ color: 'var(--color-foregroundAlt)', marginBottom: '1.5rem' }}>
          Build complete prompts by composing snippets and defining variables
        </p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '2rem' }}>
        {/* Main Editor */}
        <div>
          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.75rem', fontWeight: '600' }}>
              Prompt Name
            </label>
            <input
              type="text"
              className="input"
              placeholder="e.g., Product Description Generator"
              value={promptName}
              onChange={(e) => setPromptName(e.target.value)}
              style={{ width: '100%' }}
            />
          </div>

          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.75rem', fontWeight: '600' }}>
              Prompt Content
            </label>
            <textarea
              className="input"
              placeholder="Start typing or insert snippets from the panel..."
              value={promptContent}
              onChange={(e) => setPromptContent(e.target.value)}
              style={{
                width: '100%',
                height: '400px',
                padding: '1rem',
                fontFamily: 'monospace',
                fontSize: '0.875rem',
                resize: 'vertical'
              }}
            />
            <p style={{ fontSize: '0.75rem', color: 'var(--color-foregroundAlt)', marginTop: '0.5rem' }}>
              💡 Tip: Use {'{variable}'} syntax for dynamic variables like {'{topic}'} or {'{style}'}
            </p>
          </div>

          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.75rem', fontWeight: '600' }}>
              Variables Found
            </label>
            <div style={{ padding: '0.75rem', backgroundColor: 'var(--color-background)', borderRadius: '0.5rem', minHeight: '2rem' }}>
              {variables ? (
                <span style={{ fontFamily: 'monospace', fontSize: '0.875rem', color: 'var(--color-accent)' }}>
                  {variables}
                </span>
              ) : (
                <span style={{ fontSize: '0.875rem', color: 'var(--color-foregroundAlt)' }}>
                  None yet
                </span>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem' }}>
            <button
              className="btn btn-primary"
              onClick={extractVariables}
            >
              Extract Variables
            </button>
            <button
              className="btn btn-primary"
              onClick={savePrompt}
            >
              Save Prompt
            </button>
          </div>
        </div>

        {/* Snippets Panel */}
        <aside>
          <div className="card" style={{ position: 'sticky', top: '2rem' }}>
            <h3 style={{ fontWeight: '600', marginBottom: '1rem', fontSize: '0.95rem' }}>
              📚 Available Snippets
            </h3>
            {loading ? (
              <p style={{ fontSize: '0.875rem', color: 'var(--color-foregroundAlt)' }}>
                Loading...
              </p>
            ) : snippets.length === 0 ? (
              <p style={{ fontSize: '0.875rem', color: 'var(--color-foregroundAlt)' }}>
                No snippets yet. Create some in the Snippet Library.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {snippets.map((snippet) => (
                  <button
                    key={snippet.id}
                    onClick={() => insertSnippet(snippet)}
                    style={{
                      padding: '0.75rem',
                      backgroundColor: 'var(--color-background)',
                      border: '2px solid var(--color-border)',
                      borderRadius: '0.5rem',
                      cursor: 'pointer',
                      fontSize: '0.875rem',
                      textAlign: 'left',
                      transition: 'all 0.2s ease',
                      color: 'var(--color-foreground)'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'var(--color-accent)'
                      e.currentTarget.style.backgroundColor = 'var(--color-backgroundAlt)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'var(--color-border)'
                      e.currentTarget.style.backgroundColor = 'var(--color-background)'
                    }}
                  >
                    <strong>{snippet.name}</strong>
                  </button>
                ))}
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  )
}
