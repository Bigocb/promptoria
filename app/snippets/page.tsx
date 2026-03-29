'use client'

import { useEffect, useState } from 'react'

interface Snippet {
  id: string
  name: string
  description?: string | null
  content: string
  createdAt: string
  updatedAt: string
}

export default function SnippetsPage() {
  const [snippets, setSnippets] = useState<Snippet[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Snippet | null>(null)
  const [formData, setFormData] = useState({ name: '', description: '', content: '' })

  useEffect(() => {
    fetchSnippets()
  }, [])

  async function fetchSnippets() {
    try {
      const res = await fetch('/api/snippets')
      const data = await res.json()
      setSnippets(Array.isArray(data) ? data : data.snippets || [])
    } catch (error) {
      console.error('Failed to fetch snippets:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    try {
      if (editing) {
        const res = await fetch(`/api/snippets/${editing.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        })
        if (res.ok) {
          setEditing(null)
          setFormData({ name: '', description: '', content: '' })
          setShowForm(false)
          fetchSnippets()
        }
      } else {
        const res = await fetch('/api/snippets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        })
        if (res.ok) {
          setFormData({ name: '', description: '', content: '' })
          setShowForm(false)
          fetchSnippets()
        }
      }
    } catch (error) {
      console.error('Failed to save snippet:', error)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this snippet?')) return
    try {
      const res = await fetch(`/api/snippets/${id}`, { method: 'DELETE' })
      if (res.ok) {
        fetchSnippets()
      }
    } catch (error) {
      console.error('Failed to delete snippet:', error)
    }
  }

  const handleEdit = (snippet: Snippet) => {
    setEditing(snippet)
    setFormData({
      name: snippet.name,
      description: snippet.description || '',
      content: snippet.content,
    })
    setShowForm(true)
  }

  const handleCancel = () => {
    setEditing(null)
    setFormData({ name: '', description: '', content: '' })
    setShowForm(false)
  }

  return (
    <div style={{ padding: '2rem' }}>
      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>📚 Snippet Library</h1>
        <p style={{ color: 'var(--color-foregroundAlt)' }}>Create and manage reusable text blocks</p>
      </header>

      {!showForm && (
        <button
          onClick={() => setShowForm(true)}
          className="btn btn-primary"
          style={{ marginBottom: '2rem' }}
        >
          ➕ New Snippet
        </button>
      )}

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="card"
          style={{ marginBottom: '2rem', maxWidth: '600px' }}
        >
          <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>
            {editing ? 'Edit Snippet' : 'Create Snippet'}
          </h2>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '600' }}>
              Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="input"
              style={{ width: '100%' }}
              required
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '600' }}>
              Description
            </label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="input"
              style={{ width: '100%' }}
              placeholder="Optional description"
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '600' }}>
              Content *
            </label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              className="input"
              style={{ width: '100%', minHeight: '200px', fontFamily: 'monospace' }}
              required
            />
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button type="submit" className="btn btn-primary">
              {editing ? 'Update' : 'Create'}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="btn btn-secondary"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <p>Loading snippets...</p>
      ) : snippets.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '2rem' }}>
          <p style={{ color: 'var(--color-foregroundAlt)' }}>No snippets yet. Create one to get started!</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
          {snippets.map((snippet) => (
            <div
              key={snippet.id}
              className="card"
              style={{
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.5rem', wordBreak: 'break-word' }}>
                {snippet.name}
              </h3>
              {snippet.description && (
                <p style={{ fontSize: '0.875rem', color: 'var(--color-foregroundAlt)', marginBottom: '0.75rem' }}>
                  {snippet.description}
                </p>
              )}
              <pre
                style={{
                  flex: 1,
                  backgroundColor: 'var(--color-background)',
                  padding: '0.75rem',
                  borderRadius: '0.25rem',
                  fontSize: '0.75rem',
                  overflow: 'auto',
                  maxHeight: '200px',
                  marginBottom: '1rem',
                  fontFamily: 'monospace',
                  color: 'var(--color-foregroundAlt)',
                }}
              >
                {snippet.content.substring(0, 300)}
                {snippet.content.length > 300 ? '...' : ''}
              </pre>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  onClick={() => handleEdit(snippet)}
                  className="btn btn-secondary"
                  style={{ flex: 1, fontSize: '0.875rem' }}
                >
                  ✏️ Edit
                </button>
                <button
                  onClick={() => handleDelete(snippet.id)}
                  className="btn"
                  style={{
                    flex: 1,
                    fontSize: '0.875rem',
                    backgroundColor: 'var(--color-error)',
                    color: 'white',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.8')}
                  onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
                >
                  🗑️ Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
