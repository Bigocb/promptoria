'use client'

import { useState, useEffect } from 'react'

interface Prompt {
  id: string
  name: string
  description?: string
}

interface PromptCategory {
  id: string
  name: string
  description?: string
  prompts: Prompt[]
}

interface AgentInteractionType {
  id: string
  name: string
  description?: string
  emoji?: string
  categories: PromptCategory[]
}

export default function LibraryPage() {
  const [interactionTypes, setInteractionTypes] = useState<AgentInteractionType[]>([])
  const [selectedTypeId, setSelectedTypeId] = useState<string | null>(null)
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [workspaceId] = useState('workspace_default')

  // Fetch interaction types on mount
  useEffect(() => {
    fetchInteractionTypes()
  }, [])

  // Set first type as selected when types are loaded
  useEffect(() => {
    if (interactionTypes.length > 0 && !selectedTypeId) {
      setSelectedTypeId(interactionTypes[0].id)
    }
  }, [interactionTypes, selectedTypeId])

  const fetchInteractionTypes = async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await fetch(`/api/taxonomy/interaction-types?workspaceId=${workspaceId}`)

      if (!res.ok) {
        throw new Error('Failed to fetch interaction types')
      }

      const data = await res.json()
      setInteractionTypes(data.types || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load library')
      console.error('Error fetching interaction types:', err)
    } finally {
      setLoading(false)
    }
  }

  const toggleCategoryExpansion = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories)
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId)
    } else {
      newExpanded.add(categoryId)
    }
    setExpandedCategories(newExpanded)
  }

  const selectedType = interactionTypes.find(t => t.id === selectedTypeId)

  return (
    <div style={{ padding: '2rem', minHeight: '100vh' }}>
      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>📚 Prompt Library</h1>
        <p style={{ color: 'var(--color-foregroundAlt)', marginBottom: '1.5rem' }}>
          Browse and discover prompts organized by agent interaction types and categories
        </p>
      </header>

      {error && (
        <div className="card" style={{ marginBottom: '2rem', borderColor: '#cc241d', backgroundColor: 'rgba(204, 36, 29, 0.1)' }}>
          <p style={{ color: '#cc241d', marginBottom: 0 }}>⚠️ {error}</p>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '2rem' }}>
        {/* Sidebar - Interaction Types */}
        <aside>
          <div className="card" style={{ position: 'sticky', top: '2rem' }}>
            <h3 style={{ fontWeight: '600', marginBottom: '1rem', fontSize: '0.95rem', color: 'var(--color-accent)' }}>
              Agent Types
            </h3>

            {loading ? (
              <p style={{ fontSize: '0.875rem', color: 'var(--color-foregroundAlt)' }}>
                Loading...
              </p>
            ) : interactionTypes.length === 0 ? (
              <p style={{ fontSize: '0.875rem', color: 'var(--color-foregroundAlt)' }}>
                No agent types yet
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {interactionTypes.map((type) => (
                  <button
                    key={type.id}
                    onClick={() => setSelectedTypeId(type.id)}
                    style={{
                      padding: '0.75rem',
                      backgroundColor: selectedTypeId === type.id ? 'var(--color-accent)' : 'var(--color-background)',
                      border: `2px solid ${selectedTypeId === type.id ? 'var(--color-accent)' : 'var(--color-border)'}`,
                      borderRadius: '0.5rem',
                      cursor: 'pointer',
                      fontSize: '0.875rem',
                      textAlign: 'left',
                      transition: 'all 0.2s ease',
                      color: selectedTypeId === type.id ? 'var(--color-background)' : 'var(--color-foreground)',
                      fontWeight: selectedTypeId === type.id ? '600' : '400',
                    }}
                    onMouseEnter={(e) => {
                      if (selectedTypeId !== type.id) {
                        e.currentTarget.style.borderColor = 'var(--color-accent)'
                        e.currentTarget.style.backgroundColor = 'var(--color-backgroundAlt)'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (selectedTypeId !== type.id) {
                        e.currentTarget.style.borderColor = 'var(--color-border)'
                        e.currentTarget.style.backgroundColor = 'var(--color-background)'
                      }
                    }}
                  >
                    {type.emoji && <span style={{ marginRight: '0.5rem' }}>{type.emoji}</span>}
                    {type.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </aside>

        {/* Main Content - Categories and Prompts */}
        <main>
          {loading ? (
            <div className="card">
              <p style={{ color: 'var(--color-foregroundAlt)' }}>Loading library...</p>
            </div>
          ) : selectedType ? (
            <div>
              <div className="card" style={{ marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                  {selectedType.emoji && <span style={{ marginRight: '0.5rem' }}>{selectedType.emoji}</span>}
                  {selectedType.name}
                </h2>
                {selectedType.description && (
                  <p style={{ color: 'var(--color-foregroundAlt)', marginBottom: 0 }}>
                    {selectedType.description}
                  </p>
                )}
              </div>

              {selectedType.categories.length === 0 ? (
                <div className="card">
                  <p style={{ color: 'var(--color-foregroundAlt)' }}>
                    No categories in this agent type yet
                  </p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1.5rem' }}>
                  {selectedType.categories.map((category) => (
                    <div key={category.id} className="card">
                      <button
                        onClick={() => toggleCategoryExpansion(category.id)}
                        style={{
                          width: '100%',
                          padding: '1rem',
                          backgroundColor: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          textAlign: 'left',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: expandedCategories.has(category.id) ? '0.5rem' : '0',
                        }}
                      >
                        <div>
                          <h3 style={{ fontWeight: '600', marginBottom: '0.25rem', color: 'var(--color-foreground)' }}>
                            {category.name}
                          </h3>
                          {category.description && (
                            <p style={{ fontSize: '0.75rem', color: 'var(--color-foregroundAlt)', marginBottom: 0 }}>
                              {category.description}
                            </p>
                          )}
                        </div>
                        <span style={{ marginLeft: '1rem', color: 'var(--color-accent)', fontWeight: 'bold' }}>
                          {expandedCategories.has(category.id) ? '▼' : '▶'}
                        </span>
                      </button>

                      {expandedCategories.has(category.id) && category.prompts.length > 0 && (
                        <div style={{ borderTop: '2px solid var(--color-border)', paddingTop: '0.75rem' }}>
                          {category.prompts.map((prompt) => (
                            <div
                              key={prompt.id}
                              style={{
                                padding: '0.75rem',
                                backgroundColor: 'var(--color-background)',
                                borderRadius: '0.375rem',
                                marginBottom: '0.5rem',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = 'var(--color-backgroundAlt)'
                                e.currentTarget.style.borderLeft = '3px solid var(--color-accent)'
                                e.currentTarget.style.paddingLeft = 'calc(0.75rem - 3px)'
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = 'var(--color-background)'
                                e.currentTarget.style.borderLeft = 'none'
                                e.currentTarget.style.paddingLeft = '0.75rem'
                              }}
                            >
                              <p style={{ fontWeight: '500', marginBottom: '0.25rem', color: 'var(--color-foreground)' }}>
                                {prompt.name}
                              </p>
                              {prompt.description && (
                                <p style={{ fontSize: '0.75rem', color: 'var(--color-foregroundAlt)', marginBottom: 0 }}>
                                  {prompt.description}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {expandedCategories.has(category.id) && category.prompts.length === 0 && (
                        <div style={{ padding: '0.75rem', color: 'var(--color-foregroundAlt)', fontSize: '0.875rem' }}>
                          No prompts in this category yet
                        </div>
                      )}

                      <div style={{ padding: '0.5rem 1rem 0', fontSize: '0.75rem', color: 'var(--color-foregroundAlt)' }}>
                        {category.prompts.length} prompt{category.prompts.length !== 1 ? 's' : ''}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="card">
              <p style={{ color: 'var(--color-foregroundAlt)' }}>Select an agent type to view categories and prompts</p>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
