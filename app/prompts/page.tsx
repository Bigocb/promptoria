'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { API_ENDPOINTS } from '@/lib/api-config'
import { useAuth } from '@/app/providers'

interface Prompt {
  id: string
  name: string
  description?: string
  template_body: string
  created_at: string
  updated_at: string
  versions?: Array<{ id: string; version_number: number; created_at: string }>
}

export default function WorkbenchPage() {
  const { user } = useAuth()
  const [prompts, setPrompts] = useState<Prompt[]>([])
  const [selectedPrompt, setSelectedPrompt] = useState<Prompt | null>(null)
  const [newPromptName, setNewPromptName] = useState('')
  const [newPromptDescription, setNewPromptDescription] = useState('')
  const [promptContent, setPromptContent] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  // Fetch prompts on mount
  useEffect(() => {
    if (user) {
      fetchPrompts()
    }
  }, [user])

  const fetchPrompts = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('auth-token')
      const res = await fetch(API_ENDPOINTS.prompts.list, {
        headers: { 'Authorization': `Bearer ${token}` },
      })

      if (res.ok) {
        const data = await res.json()
        const promptsList = Array.isArray(data) ? data : data.prompts || []
        setPrompts(promptsList)
        if (promptsList.length > 0) {
          setSelectedPrompt(promptsList[0])
          setPromptContent(promptsList[0].template_body || '')
        }
      }
    } catch (error) {
      setMessage(`Error fetching prompts: ${error}`)
    } finally {
      setLoading(false)
    }
  }

  const handleCreatePrompt = async () => {
    if (!newPromptName.trim() || !promptContent.trim()) {
      setMessage('Please enter a prompt name and content')
      return
    }

    try {
      setSaving(true)
      const token = localStorage.getItem('auth-token')
      const res = await fetch(API_ENDPOINTS.prompts.create, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: newPromptName,
          description: newPromptDescription,
          template_body: promptContent,
        }),
      })

      if (res.ok) {
        setMessage('✅ Prompt created successfully!')
        setNewPromptName('')
        setNewPromptDescription('')
        setPromptContent('')
        await fetchPrompts()
      } else {
        const error = await res.json()
        setMessage(`Error: ${error.error || error.detail || 'Failed to create prompt'}`)
      }
    } catch (error) {
      setMessage(`Error creating prompt: ${error}`)
    } finally {
      setSaving(false)
    }
  }

  const handleUpdatePrompt = async () => {
    if (!selectedPrompt) return

    try {
      setSaving(true)
      const token = localStorage.getItem('auth-token')
      const res = await fetch(API_ENDPOINTS.prompts.update(selectedPrompt.id), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: selectedPrompt.name,
          description: selectedPrompt.description,
          template_body: promptContent,
        }),
      })

      if (res.ok) {
        setMessage('✅ Prompt updated successfully!')
        await fetchPrompts()
      } else {
        const error = await res.json()
        setMessage(`Error: ${error.error || error.detail || 'Failed to update prompt'}`)
      }
    } catch (error) {
      setMessage(`Error updating prompt: ${error}`)
    } finally {
      setSaving(false)
    }
  }

  const handleDeletePrompt = async (id: string) => {
    if (!confirm('Are you sure you want to delete this prompt?')) return

    try {
      const token = localStorage.getItem('auth-token')
      const res = await fetch(API_ENDPOINTS.prompts.delete(id), {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      })

      if (res.ok) {
        setMessage('✅ Prompt deleted successfully!')
        if (selectedPrompt?.id === id) {
          setSelectedPrompt(null)
          setPromptContent('')
        }
        await fetchPrompts()
      } else {
        const error = await res.json()
        setMessage(`Error: ${error.error || error.detail || 'Failed to delete prompt'}`)
      }
    } catch (error) {
      setMessage(`Error deleting prompt: ${error}`)
    }
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '250px 1fr', gap: '2rem', padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Sidebar */}
      <aside style={{ borderRight: '1px solid var(--color-border)', paddingRight: '1.5rem' }}>
        <Link
          href="/dashboard"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            marginBottom: '1.5rem',
            color: 'var(--color-primary)',
            textDecoration: 'none',
            fontSize: '0.875rem',
          }}
        >
          ← Dashboard
        </Link>

        <div style={{ marginBottom: '2rem' }}>
          <h3 style={{ fontSize: '0.875rem', fontWeight: '600', marginBottom: '1rem', color: 'var(--color-text)' }}>
            My Prompts ({prompts.length})
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '60vh', overflowY: 'auto' }}>
            {loading ? (
              <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>Loading...</p>
            ) : prompts.length === 0 ? (
              <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>No prompts yet</p>
            ) : (
              prompts.map((prompt) => (
                <button
                  key={prompt.id}
                  onClick={() => {
                    setSelectedPrompt(prompt)
                    setPromptContent(prompt.template_body || '')
                  }}
                  style={{
                    padding: '0.75rem',
                    backgroundColor: selectedPrompt?.id === prompt.id ? 'var(--color-primary)' : 'var(--color-surface)',
                    color: selectedPrompt?.id === prompt.id ? 'white' : 'var(--color-text)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '4px',
                    textAlign: 'left',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    transition: 'all 0.2s',
                  }}
                >
                  {prompt.name}
                </button>
              ))
            )}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main>
        <header style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
            ⚡ Workbench
          </h1>
          <p style={{ color: 'var(--color-text-secondary)' }}>
            Create and refine prompts with the new backend
          </p>
        </header>

        {message && (
          <div
            style={{
              padding: '1rem',
              backgroundColor: message.includes('✅') ? '#d1fae5' : '#fee2e2',
              color: message.includes('✅') ? '#065f46' : '#991b1b',
              borderRadius: '4px',
              marginBottom: '1.5rem',
              fontSize: '0.875rem',
            }}
          >
            {message}
          </div>
        )}

        {/* Create New or Edit */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
          {/* Create New Prompt */}
          <div style={{ backgroundColor: 'var(--color-surface)', padding: '1.5rem', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
            <h2 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1rem' }}>
              ➕ Create New Prompt
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>
                  Name
                </label>
                <input
                  type="text"
                  value={newPromptName}
                  onChange={(e) => setNewPromptName(e.target.value)}
                  placeholder="Enter prompt name..."
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid var(--color-border)',
                    borderRadius: '4px',
                    fontSize: '0.875rem',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>
                  Description (optional)
                </label>
                <input
                  type="text"
                  value={newPromptDescription}
                  onChange={(e) => setNewPromptDescription(e.target.value)}
                  placeholder="Enter description..."
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid var(--color-border)',
                    borderRadius: '4px',
                    fontSize: '0.875rem',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>
                  Prompt Content
                </label>
                <textarea
                  value={promptContent}
                  onChange={(e) => setPromptContent(e.target.value)}
                  placeholder="Enter your prompt template here..."
                  style={{
                    width: '100%',
                    minHeight: '200px',
                    padding: '0.75rem',
                    border: '1px solid var(--color-border)',
                    borderRadius: '4px',
                    fontSize: '0.875rem',
                    fontFamily: 'monospace',
                  }}
                />
              </div>

              <button
                onClick={handleCreatePrompt}
                disabled={saving || !newPromptName.trim() || !promptContent.trim()}
                style={{
                  padding: '0.75rem',
                  backgroundColor: saving || !newPromptName.trim() ? 'var(--color-text-secondary)' : 'var(--color-primary)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: saving ? 'not-allowed' : 'pointer',
                  fontWeight: '600',
                  fontSize: '0.875rem',
                }}
              >
                {saving ? 'Saving...' : 'Create Prompt'}
              </button>
            </div>
          </div>

          {/* Edit Selected Prompt */}
          <div style={{ backgroundColor: 'var(--color-surface)', padding: '1.5rem', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
            <h2 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1rem' }}>
              ✏️ {selectedPrompt ? 'Edit Prompt' : 'Select a Prompt to Edit'}
            </h2>

            {selectedPrompt ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>
                    Name
                  </label>
                  <input
                    type="text"
                    value={selectedPrompt.name}
                    onChange={(e) => setSelectedPrompt({ ...selectedPrompt, name: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      border: '1px solid var(--color-border)',
                      borderRadius: '4px',
                      fontSize: '0.875rem',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>
                    Prompt Content
                  </label>
                  <textarea
                    value={promptContent}
                    onChange={(e) => setPromptContent(e.target.value)}
                    style={{
                      width: '100%',
                      minHeight: '200px',
                      padding: '0.75rem',
                      border: '1px solid var(--color-border)',
                      borderRadius: '4px',
                      fontSize: '0.875rem',
                      fontFamily: 'monospace',
                    }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <button
                    onClick={handleUpdatePrompt}
                    disabled={saving}
                    style={{
                      padding: '0.75rem',
                      backgroundColor: 'var(--color-primary)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: saving ? 'not-allowed' : 'pointer',
                      fontWeight: '600',
                      fontSize: '0.875rem',
                    }}
                  >
                    {saving ? 'Saving...' : 'Update'}
                  </button>
                  <button
                    onClick={() => handleDeletePrompt(selectedPrompt.id)}
                    style={{
                      padding: '0.75rem',
                      backgroundColor: '#ef4444',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontWeight: '600',
                      fontSize: '0.875rem',
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ) : (
              <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
                Select a prompt from the list to edit it
              </p>
            )}
          </div>
        </div>

        {/* Info Section */}
        <div style={{ backgroundColor: 'var(--color-surface)', padding: '1.5rem', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '1rem' }}>
            💡 How to use
          </h3>
          <ul style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', lineHeight: '1.8' }}>
            <li>📝 Use variables in your prompts like: {'{'}variable_name{'}'}</li>
            <li>💾 Click "Create Prompt" to save a new prompt</li>
            <li>✏️ Select a prompt and click "Update" to modify it</li>
            <li>🗑️ Click "Delete" to remove a prompt</li>
            <li>🧪 Use the test runner to execute prompts with actual data</li>
          </ul>
        </div>
      </main>
    </div>
  )
}
