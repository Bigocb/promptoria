'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { API_ENDPOINTS } from '@/lib/api-config'
import { useAuth } from '@/app/providers'

interface PromptVersion {
  id: string
  version_number: number
  template_body: string
  config?: Record<string, any>
  created_at: string
  updated_at: string
}

interface PromptDetail {
  id: string
  name: string
  description?: string
  template_body?: string
  workspace_id: string
  folder_id?: string
  category_id?: string
  tags?: string[]
  model?: string
  created_at: string
  updated_at: string
  versions: PromptVersion[]
}

export default function PromptDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { user } = useAuth()
  const [prompt, setPrompt] = useState<PromptDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editedName, setEditedName] = useState('')
  const [editedDescription, setEditedDescription] = useState('')
  const [editedModel, setEditedModel] = useState('')
  const [editedTags, setEditedTags] = useState<string[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [compareVersionId, setCompareVersionId] = useState<string | null>(null)
  const [showDiff, setShowDiff] = useState(false)
  const [compareDropdownOpen, setCompareDropdownOpen] = useState(false)

  useEffect(() => {
    if (user) {
      fetchPrompt()
    }
  }, [user, params.id])

  useEffect(() => {
    if (prompt && prompt.versions.length > 0 && !selectedVersionId) {
      setSelectedVersionId(prompt.versions[0].id)
    }
  }, [prompt, selectedVersionId])

  useEffect(() => {
    if (prompt && isEditing) {
      setEditedName(prompt.name)
      setEditedDescription(prompt.description || '')
      setEditedModel(prompt.model || 'gpt-4')
      setEditedTags(prompt.tags || [])
    }
  }, [isEditing, prompt])

  const fetchPrompt = async () => {
    try {
      setLoading(true)
      setError(null)
      const token = localStorage.getItem('auth-token')
      const res = await fetch(`${API_ENDPOINTS.prompts.detail(params.id)}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (!res.ok) {
        if (res.status === 404) {
          throw new Error('Prompt not found')
        }
        throw new Error('Failed to fetch prompt')
      }

      const data = await res.json()
      setPrompt(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load prompt')
      console.error('Error fetching prompt:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!prompt) return

    try {
      setIsSaving(true)
      const token = localStorage.getItem('auth-token')
      const res = await fetch(API_ENDPOINTS.prompts.update(prompt.id), {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: editedName,
          description: editedDescription,
          model: editedModel,
          tags: editedTags,
        }),
      })

      if (!res.ok) {
        throw new Error('Failed to update prompt')
      }

      const updated = await res.json()
      setPrompt({
        ...prompt,
        name: updated.name,
        description: updated.description,
        model: updated.model,
        tags: updated.tags,
      })
      setIsEditing(false)
    } catch (err) {
      console.error('Error saving prompt:', err)
      alert(err instanceof Error ? err.message : 'Failed to save prompt')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!prompt || !window.confirm('Are you sure you want to delete this prompt? This cannot be undone.')) {
      return
    }

    try {
      const token = localStorage.getItem('auth-token')
      const res = await fetch(API_ENDPOINTS.prompts.delete(prompt.id), {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (!res.ok) {
        throw new Error('Failed to delete prompt')
      }

      router.push('/library')
    } catch (err) {
      console.error('Error deleting prompt:', err)
      alert(err instanceof Error ? err.message : 'Failed to delete prompt')
    }
  }

  const selectedVersion = prompt?.versions.find(v => v.id === selectedVersionId)
  const compareVersion = prompt?.versions.find(v => v.id === compareVersionId)

  // Simple diff algorithm - shows added/removed lines
  const calculateDiff = (oldText: string, newText: string) => {
    const oldLines = oldText.split('\n')
    const newLines = newText.split('\n')
    const maxLength = Math.max(oldLines.length, newLines.length)
    const diffs: Array<{ type: 'add' | 'remove' | 'common'; line: string; lineNum?: number }> = []

    for (let i = 0; i < maxLength; i++) {
      const oldLine = oldLines[i]
      const newLine = newLines[i]

      if (oldLine === newLine) {
        if (oldLine !== undefined) {
          diffs.push({ type: 'common', line: oldLine, lineNum: i + 1 })
        }
      } else {
        if (oldLine !== undefined) {
          diffs.push({ type: 'remove', line: oldLine })
        }
        if (newLine !== undefined) {
          diffs.push({ type: 'add', line: newLine })
        }
      }
    }

    return diffs
  }

  if (loading) {
    return (
      <div style={{ padding: '2rem', minHeight: '100vh', overflowX: 'hidden', width: '100%', boxSizing: 'border-box' }}>
        <div className="card">
          <p style={{ color: 'var(--color-foregroundAlt)' }}>Loading prompt...</p>
        </div>
      </div>
    )
  }

  if (error || !prompt) {
    return (
      <div style={{ padding: '2rem', minHeight: '100vh', overflowX: 'hidden', width: '100%', boxSizing: 'border-box' }}>
        <div className="card" style={{ borderColor: '#cc241d', backgroundColor: 'rgba(204, 36, 29, 0.1)' }}>
          <p style={{ color: '#cc241d', marginBottom: '1rem' }}>⚠️ {error || 'Prompt not found'}</p>
          <button
            onClick={() => router.back()}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: 'var(--color-accent)',
              color: 'var(--color-background)',
              border: 'none',
              borderRadius: '0.375rem',
              cursor: 'pointer',
              fontWeight: '500',
            }}
          >
            Go Back
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ padding: '2rem', minHeight: '100vh', overflowX: 'hidden', width: '100%', boxSizing: 'border-box' }}>
      {/* Header with navigation */}
      <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button
          onClick={() => router.back()}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: 'transparent',
            border: `2px solid var(--color-border)`,
            borderRadius: '0.375rem',
            cursor: 'pointer',
            fontSize: '0.875rem',
            color: 'var(--color-foreground)',
          }}
        >
          ← Back
        </button>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          {isEditing ? (
            <>
              <button
                onClick={() => setIsEditing(false)}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: 'transparent',
                  border: `2px solid var(--color-border)`,
                  borderRadius: '0.375rem',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  color: 'var(--color-foreground)',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: 'var(--color-accent)',
                  color: 'var(--color-background)',
                  border: 'none',
                  borderRadius: '0.375rem',
                  cursor: isSaving ? 'not-allowed' : 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  opacity: isSaving ? 0.6 : 1,
                }}
              >
                {isSaving ? 'Saving...' : 'Save'}
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setIsEditing(true)}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: 'transparent',
                  border: `2px solid var(--color-accent)`,
                  borderRadius: '0.375rem',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  color: 'var(--color-accent)',
                  fontWeight: '500',
                }}
              >
                Edit
              </button>
              <button
                onClick={handleDelete}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: 'transparent',
                  border: '2px solid #cc241d',
                  borderRadius: '0.375rem',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  color: '#cc241d',
                  fontWeight: '500',
                }}
              >
                Delete
              </button>
            </>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '2rem', overflowX: 'hidden', width: '100%', boxSizing: 'border-box' }}>
        {/* Main Content */}
        <main style={{ minWidth: 0, overflow: 'hidden' }}>
          {/* Metadata Section */}
          <div className="card" style={{ marginBottom: '2rem' }}>
            {isEditing ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--color-foregroundAlt)', display: 'block', marginBottom: '0.5rem' }}>
                    Name
                  </label>
                  <input
                    type="text"
                    value={editedName}
                    onChange={(e) => setEditedName(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: `2px solid var(--color-border)`,
                      borderRadius: '0.375rem',
                      backgroundColor: 'var(--color-background)',
                      color: 'var(--color-foreground)',
                      fontSize: '1rem',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--color-foregroundAlt)', display: 'block', marginBottom: '0.5rem' }}>
                    Description
                  </label>
                  <textarea
                    value={editedDescription}
                    onChange={(e) => setEditedDescription(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: `2px solid var(--color-border)`,
                      borderRadius: '0.375rem',
                      backgroundColor: 'var(--color-background)',
                      color: 'var(--color-foreground)',
                      fontSize: '0.875rem',
                      minHeight: '100px',
                      fontFamily: 'inherit',
                      boxSizing: 'border-box',
                      resize: 'vertical',
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--color-foregroundAlt)', display: 'block', marginBottom: '0.5rem' }}>
                    Model
                  </label>
                  <input
                    type="text"
                    value={editedModel}
                    onChange={(e) => setEditedModel(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: `2px solid var(--color-border)`,
                      borderRadius: '0.375rem',
                      backgroundColor: 'var(--color-background)',
                      color: 'var(--color-foreground)',
                      fontSize: '0.875rem',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--color-foregroundAlt)', display: 'block', marginBottom: '0.5rem' }}>
                    Tags (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={editedTags.join(', ')}
                    onChange={(e) => setEditedTags(e.target.value.split(',').map(t => t.trim()).filter(Boolean))}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: `2px solid var(--color-border)`,
                      borderRadius: '0.375rem',
                      backgroundColor: 'var(--color-background)',
                      color: 'var(--color-foreground)',
                      fontSize: '0.875rem',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>
            ) : (
              <div>
                <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                  {prompt.name}
                </h1>
                {prompt.description && (
                  <p style={{ color: 'var(--color-foregroundAlt)', marginBottom: '1.5rem', fontSize: '0.95rem', lineHeight: '1.5' }}>
                    {prompt.description}
                  </p>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(150px, 100%), 1fr))', gap: '1rem', color: 'var(--color-foregroundAlt)', fontSize: '0.875rem', overflowX: 'hidden', width: '100%', boxSizing: 'border-box' }}>
                  <div>
                    <span style={{ fontWeight: '600', color: 'var(--color-accent)' }}>Model</span>
                    <p style={{ marginTop: '0.25rem', marginBottom: 0 }}>{prompt.model || 'Not set'}</p>
                  </div>
                  <div>
                    <span style={{ fontWeight: '600', color: 'var(--color-accent)' }}>Created</span>
                    <p style={{ marginTop: '0.25rem', marginBottom: 0 }}>
                      {new Date(prompt.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <span style={{ fontWeight: '600', color: 'var(--color-accent)' }}>Updated</span>
                    <p style={{ marginTop: '0.25rem', marginBottom: 0 }}>
                      {new Date(prompt.updated_at).toLocaleDateString()}
                    </p>
                  </div>
                  {prompt.tags && prompt.tags.length > 0 && (
                    <div style={{ gridColumn: '1 / -1' }}>
                      <span style={{ fontWeight: '600', color: 'var(--color-accent)' }}>Tags</span>
                      <div style={{ marginTop: '0.5rem', display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                        {prompt.tags.map(tag => (
                          <span
                            key={tag}
                            style={{
                              padding: '0.25rem 0.75rem',
                              backgroundColor: 'var(--color-backgroundAlt)',
                              borderRadius: '1rem',
                              fontSize: '0.75rem',
                              color: 'var(--color-foreground)',
                            }}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Versions Section */}
          {prompt.versions.length > 0 && (
            <div className="card">
              <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem' }}>
                Versions ({prompt.versions.length})
              </h2>

              <div style={{ marginBottom: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {prompt.versions.map(version => (
                  <button
                    key={version.id}
                    onClick={() => setSelectedVersionId(version.id)}
                    style={{
                      padding: '0.75rem',
                      backgroundColor: selectedVersionId === version.id ? 'var(--color-accent)' : 'var(--color-background)',
                      border: `2px solid ${selectedVersionId === version.id ? 'var(--color-accent)' : 'var(--color-border)'}`,
                      borderRadius: '0.375rem',
                      cursor: 'pointer',
                      textAlign: 'left',
                      color: selectedVersionId === version.id ? 'var(--color-background)' : 'var(--color-foreground)',
                      fontWeight: selectedVersionId === version.id ? '600' : '400',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>v{version.version_number}</span>
                      <span style={{ fontSize: '0.75rem', opacity: 0.8 }}>
                        {new Date(version.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </button>
                ))}
              </div>

              {selectedVersion && (
                <div style={{ borderTop: '2px solid var(--color-border)', paddingTop: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <h3 style={{ fontSize: '0.95rem', fontWeight: '600', marginBottom: 0 }}>
                      Template (v{selectedVersion.version_number})
                    </h3>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        onClick={() => setShowDiff(!showDiff)}
                        style={{
                          padding: '0.375rem 0.75rem',
                          backgroundColor: showDiff ? 'var(--color-accent)' : 'transparent',
                          border: `2px solid ${showDiff ? 'var(--color-accent)' : 'var(--color-border)'}`,
                          borderRadius: '0.25rem',
                          cursor: 'pointer',
                          fontSize: '0.75rem',
                          color: showDiff ? 'var(--color-background)' : 'var(--color-foreground)',
                          fontWeight: '500',
                        }}
                      >
                        {showDiff ? '✓ Diff On' : 'Show Diff'}
                      </button>
                      {showDiff && (
                        <div style={{ position: 'relative', display: 'inline-block' }}>
                          <button
                            onClick={() => setCompareDropdownOpen(!compareDropdownOpen)}
                            style={{
                              padding: '0.375rem 0.75rem',
                              backgroundColor: 'transparent',
                              border: `2px solid var(--color-border)`,
                              borderRadius: '0.25rem',
                              cursor: 'pointer',
                              fontSize: '0.75rem',
                              color: 'var(--color-foreground)',
                            }}
                          >
                            Compare to {compareVersion ? `v${compareVersion.version_number}` : 'version...'}
                          </button>
                          {compareDropdownOpen && (
                            <div
                              style={{
                                position: 'absolute',
                                top: '100%',
                                right: 0,
                                marginTop: '0.5rem',
                                backgroundColor: 'var(--color-background)',
                                border: `2px solid var(--color-border)`,
                                borderRadius: '0.375rem',
                                minWidth: '120px',
                                zIndex: 10,
                                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                              }}
                            >
                              {prompt.versions.map((v) => (
                                <button
                                  key={v.id}
                                  onClick={() => {
                                    setCompareVersionId(v.id)
                                    setCompareDropdownOpen(false)
                                  }}
                                  style={{
                                    width: '100%',
                                    padding: '0.5rem 0.75rem',
                                    backgroundColor: compareVersionId === v.id ? 'var(--color-accent)' : 'transparent',
                                    border: 'none',
                                    cursor: 'pointer',
                                    textAlign: 'left',
                                    fontSize: '0.75rem',
                                    color: compareVersionId === v.id ? 'var(--color-background)' : 'var(--color-foreground)',
                                    fontWeight: compareVersionId === v.id ? '600' : '400',
                                  }}
                                >
                                  v{v.version_number}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {showDiff && compareVersion && selectedVersion ? (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                      {/* Left side - old version */}
                      <div>
                        <p style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--color-foregroundAlt)', marginBottom: '0.5rem' }}>
                          v{compareVersion.version_number}
                        </p>
                        <pre
                          style={{
                            backgroundColor: 'var(--color-background)',
                            padding: '1rem',
                            borderRadius: '0.375rem',
                            overflow: 'auto',
                            whiteSpace: 'pre-wrap',
                            wordBreak: 'break-word',
                            fontSize: '0.75rem',
                            color: 'var(--color-foreground)',
                            border: `2px solid var(--color-border)`,
                            fontFamily: 'monospace',
                            margin: 0,
                            maxHeight: '400px',
                          }}
                        >
                          {compareVersion.template_body}
                        </pre>
                      </div>

                      {/* Right side - new version with diff highlights */}
                      <div>
                        <p style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--color-foregroundAlt)', marginBottom: '0.5rem' }}>
                          v{selectedVersion.version_number} (changes highlighted)
                        </p>
                        <div
                          style={{
                            backgroundColor: 'var(--color-background)',
                            padding: '1rem',
                            borderRadius: '0.375rem',
                            overflow: 'auto',
                            fontSize: '0.75rem',
                            color: 'var(--color-foreground)',
                            border: `2px solid var(--color-border)`,
                            fontFamily: 'monospace',
                            maxHeight: '400px',
                            whiteSpace: 'pre-wrap',
                            wordBreak: 'break-word',
                          }}
                        >
                          {calculateDiff(compareVersion.template_body, selectedVersion.template_body).map((diff, idx) => (
                            <div
                              key={idx}
                              style={{
                                backgroundColor:
                                  diff.type === 'add'
                                    ? 'rgba(142, 192, 124, 0.3)'
                                    : diff.type === 'remove'
                                      ? 'rgba(204, 36, 29, 0.3)'
                                      : 'transparent',
                                padding: '0.25rem 0.5rem',
                                display: 'block',
                              }}
                            >
                              <span style={{
                                color:
                                  diff.type === 'add'
                                    ? '#8ec07c'
                                    : diff.type === 'remove'
                                      ? '#cc241d'
                                      : 'inherit',
                                fontWeight: diff.type !== 'common' ? '600' : 'normal',
                              }}>
                                {diff.type === 'add' && '+ '}
                                {diff.type === 'remove' && '- '}
                                {diff.line}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <pre
                      style={{
                        backgroundColor: 'var(--color-background)',
                        padding: '1rem',
                        borderRadius: '0.375rem',
                        overflow: 'auto',
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                        fontSize: '0.85rem',
                        color: 'var(--color-foreground)',
                        border: `2px solid var(--color-border)`,
                        marginBottom: '1rem',
                        fontFamily: 'monospace',
                      }}
                    >
                      {selectedVersion.template_body}
                    </pre>
                  )}

                  {selectedVersion.config && Object.keys(selectedVersion.config).length > 0 && (
                    <div>
                      <h4 style={{ fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem', color: 'var(--color-foregroundAlt)' }}>
                        Configuration
                      </h4>
                      <pre
                        style={{
                          backgroundColor: 'var(--color-background)',
                          padding: '0.75rem',
                          borderRadius: '0.375rem',
                          overflow: 'auto',
                          whiteSpace: 'pre-wrap',
                          wordBreak: 'break-word',
                          fontSize: '0.75rem',
                          color: 'var(--color-foreground)',
                          border: `2px solid var(--color-border)`,
                          fontFamily: 'monospace',
                        }}
                      >
                        {JSON.stringify(selectedVersion.config, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </main>

        {/* Sidebar */}
        <aside style={{ minWidth: 0, overflow: 'hidden' }}>
          <div className="card">
            <h3 style={{ fontSize: '0.95rem', fontWeight: '600', marginBottom: '1rem', color: 'var(--color-accent)' }}>
              Information
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.875rem', color: 'var(--color-foregroundAlt)' }}>
              <div>
                <span style={{ fontWeight: '600', display: 'block', marginBottom: '0.25rem' }}>ID</span>
                <code style={{
                  backgroundColor: 'var(--color-background)',
                  padding: '0.25rem 0.5rem',
                  borderRadius: '0.25rem',
                  fontSize: '0.75rem',
                  wordBreak: 'break-all',
                }}>
                  {prompt.id}
                </code>
              </div>

              <div>
                <span style={{ fontWeight: '600', display: 'block', marginBottom: '0.25rem' }}>Versions</span>
                <p style={{ marginBottom: 0 }}>{prompt.versions.length} version{prompt.versions.length !== 1 ? 's' : ''}</p>
              </div>

              {prompt.folder_id && (
                <div>
                  <span style={{ fontWeight: '600', display: 'block', marginBottom: '0.25rem' }}>Folder</span>
                  <p style={{ marginBottom: 0 }}>{prompt.folder_id}</p>
                </div>
              )}

              {prompt.category_id && (
                <div>
                  <span style={{ fontWeight: '600', display: 'block', marginBottom: '0.25rem' }}>Category</span>
                  <p style={{ marginBottom: 0 }}>{prompt.category_id}</p>
                </div>
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
