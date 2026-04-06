'use client'

import { useState, useEffect } from 'react'
import { API_ENDPOINTS } from '@/lib/api-config'
import { useAuth } from '@/app/providers'

interface Snippet {
  id: string
  name: string
  content: string
}

interface TestResult {
  id: string
  timestamp: string
  model: string
  temperature: number
  maxTokens: number
  variables: Record<string, string>
  output: string
}

type SuggestionFocus = 'effectiveness' | 'constraints'

interface InteractionType {
  id: string
  name: string
  emoji?: string
}

interface Category {
  id: string
  name: string
}

export default function WorkbenchPage() {
  const { user } = useAuth()
  const [snippets, setSnippets] = useState<Snippet[]>([])
  const [promptName, setPromptName] = useState('')
  const [promptContent, setPromptContent] = useState('')
  const [variables, setVariables] = useState('')
  const [loading, setLoading] = useState(true)

  // Taxonomy state
  const [interactionTypes, setInteractionTypes] = useState<InteractionType[]>([])
  const [selectedInteractionTypeId, setSelectedInteractionTypeId] = useState<string>('')
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('')

  // Category management state
  const [showAddCategory, setShowAddCategory] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [newCategoryDesc, setNewCategoryDesc] = useState('')
  const [creatingCategory, setCreatingCategory] = useState(false)

  // Tags state
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [suggestedTags, setSuggestedTags] = useState<string[]>([])
  const [tagsLoading, setTagsLoading] = useState(false)

  // Suggestions panel state
  const [showSuggestionsPanel, setShowSuggestionsPanel] = useState(false)
  const [suggestionFocus, setSuggestionFocus] = useState<Set<SuggestionFocus>>(new Set(['effectiveness']))
  const [suggestions, setSuggestions] = useState<string | null>(null)
  const [suggestionsLoading, setSuggestionsLoading] = useState(false)

  // Test panel state
  const [showTestPanel, setShowTestPanel] = useState(false)
  const [testModel, setTestModel] = useState('llama3.2')
  const [testTemperature, setTestTemperature] = useState(0.7)
  const [testMaxTokens, setTestMaxTokens] = useState(500)
  const [testVariables, setTestVariables] = useState<Record<string, string>>({})
  const [testOutput, setTestOutput] = useState<string | null>(null)
  const [testLoading, setTestLoading] = useState(false)
  const [testResults, setTestResults] = useState<TestResult[]>([])

  useEffect(() => {
    fetchSnippets()
    fetchInteractionTypes()
  }, [user])

  const fetchSnippets = async () => {
    try {
      const token = localStorage.getItem('auth-token')
      const res = await fetch(API_ENDPOINTS.snippets.list, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
      const data = await res.json()
      // Backend returns array directly, not wrapped in object
      setSnippets(Array.isArray(data) ? data : (data.snippets || []))
    } catch (error) {
      console.error('Failed to fetch snippets:', error)
      setSnippets([])
    } finally {
      setLoading(false)
    }
  }

  const fetchInteractionTypes = async () => {
    try {
      const token = localStorage.getItem('auth-token')
      const res = await fetch(API_ENDPOINTS.taxonomy.interactionTypes, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
      const data = await res.json()
      // Backend returns array directly, not wrapped in object
      setInteractionTypes(Array.isArray(data) ? data : (data.types || []))
    } catch (error) {
      console.error('Failed to fetch interaction types:', error)
      setInteractionTypes([])
    }
  }

  const fetchCategories = async (typeId: string) => {
    if (!typeId) {
      setCategories([])
      setSelectedCategoryId('')
      return
    }
    try {
      const token = localStorage.getItem('auth-token')
      const res = await fetch(API_ENDPOINTS.taxonomy.categories(typeId), {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
      const data = await res.json()
      // Backend returns array directly, not wrapped in object
      setCategories(Array.isArray(data) ? data : (data.categories || []))
      setSelectedCategoryId('')
    } catch (error) {
      console.error('Failed to fetch categories:', error)
      setCategories([])
    }
  }

  const handleInteractionTypeChange = (typeId: string) => {
    setSelectedInteractionTypeId(typeId)
    fetchCategories(typeId)
  }

  const createCategory = async () => {
    if (!newCategoryName.trim()) {
      alert('Please enter a category name')
      return
    }

    if (!selectedInteractionTypeId) {
      alert('Please select an interaction type first')
      return
    }

    setCreatingCategory(true)
    try {
      const token = localStorage.getItem('auth-token')
      const res = await fetch(API_ENDPOINTS.taxonomy.categories(selectedInteractionTypeId), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: newCategoryName,
          description: newCategoryDesc,
          agent_interaction_type_id: selectedInteractionTypeId,
        }),
      })

      if (!res.ok) {
        const error = await res.json()
        alert(`Error: ${error.detail || 'Failed to create category'}`)
        return
      }

      // Refresh categories list
      await fetchCategories(selectedInteractionTypeId)
      setNewCategoryName('')
      setNewCategoryDesc('')
      setShowAddCategory(false)
    } catch (error) {
      console.error('Error creating category:', error)
      alert('Failed to create category')
    } finally {
      setCreatingCategory(false)
    }
  }

  const addTag = (tag: string) => {
    const trimmed = tag.trim().toLowerCase()
    if (trimmed && !tags.includes(trimmed) && tags.length < 15) {
      setTags([...tags, trimmed])
      setTagInput('')
    }
  }

  const removeTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag))
  }

  const acceptSuggestedTag = (tag: string) => {
    addTag(tag)
    setSuggestedTags(suggestedTags.filter(t => t !== tag))
  }

  const acceptAllSuggestedTags = () => {
    const availableSlots = 15 - tags.length
    const tagsToAdd = suggestedTags.slice(0, availableSlots)
    setTags([...tags, ...tagsToAdd])
    setSuggestedTags([])
  }

  const getTagSuggestions = async () => {
    if (!promptContent.trim()) {
      alert('Please enter prompt content before getting tag suggestions')
      return
    }

    setTagsLoading(true)
    try {
      const varsList = variables ? variables.split(', ').filter(v => v.trim()).join(', ') : 'none'

      // Simulate Ollama API response for tag suggestions
      const mockSuggestedTags = [
        'instruction-following',
        'structured-output',
        'reasoning',
        'creative-writing',
        'analysis',
      ].filter(tag => !tags.includes(tag))

      setSuggestedTags(mockSuggestedTags)
    } catch (error) {
      console.error('Error getting tag suggestions:', error)
    } finally {
      setTagsLoading(false)
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

      // Initialize test variables
      const newTestVars: Record<string, string> = {}
      vars.forEach(v => {
        newTestVars[v] = testVariables[v] || ''
      })
      setTestVariables(newTestVars)
    }
  }

  const compilePrompt = (): string => {
    let compiled = promptContent
    Object.entries(testVariables).forEach(([key, value]) => {
      compiled = compiled.replace(new RegExp(`\\{${key}\\}`, 'g'), value)
    })
    return compiled
  }

  const toggleSuggestionFocus = (focus: SuggestionFocus) => {
    const newFocus = new Set(suggestionFocus)
    if (newFocus.has(focus)) {
      newFocus.delete(focus)
    } else {
      newFocus.add(focus)
    }
    setSuggestionFocus(newFocus)
  }

  const getSuggestions = async () => {
    if (!promptContent.trim()) {
      alert('Please enter prompt content before getting suggestions')
      return
    }

    setSuggestionsLoading(true)
    try {
      const focusAreas = Array.from(suggestionFocus).join(', ')
      const token = localStorage.getItem('auth-token')

      const res = await fetch(API_ENDPOINTS.suggestions, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          promptContent,
          focusAreas,
        }),
      })

      if (!res.ok) {
        const error = await res.json()
        setSuggestions(`Error: ${error.error || 'Failed to get suggestions'}`)
        return
      }

      const data = await res.json()
      setSuggestions(data.suggestions)
    } catch (error) {
      setSuggestions(`Error getting suggestions: ${error instanceof Error ? error.message : String(error)}`)
    } finally {
      setSuggestionsLoading(false)
    }
  }

  const runTest = async () => {
    if (!promptContent.trim()) {
      alert('Please save the prompt first, then test it')
      return
    }

    setTestLoading(true)
    try {
      const compiled = compilePrompt()

      // For now, show that testing would use Ollama
      // (Full integration requires saving prompt first to get prompt_version_id)
      const mockResponse = `Testing with Ollama (${testModel})\n\nCompiled prompt:\n"${compiled.substring(0, 150)}${compiled.length > 150 ? '...' : ''}"\n\nTemperature: ${testTemperature}\nMax Tokens: ${testMaxTokens}\n\nNote: Save your prompt first to test it against the live Ollama backend.`

      setTestOutput(mockResponse)

      const result: TestResult = {
        id: Date.now().toString(),
        timestamp: new Date().toLocaleTimeString(),
        model: testModel,
        temperature: testTemperature,
        maxTokens: testMaxTokens,
        variables: { ...testVariables },
        output: mockResponse,
      }

      setTestResults([result, ...testResults])
    } catch (error) {
      setTestOutput(`Error running test: ${error instanceof Error ? error.message : String(error)}`)
    } finally {
      setTestLoading(false)
    }
  }

  const savePrompt = async () => {
    if (!promptName.trim() || !promptContent.trim()) {
      alert('Please enter a prompt name and content')
      return
    }

    try {
      const token = localStorage.getItem('auth-token')
      const res = await fetch(API_ENDPOINTS.prompts.create, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: promptName,
          template_body: promptContent,
          tags,
          ...(selectedCategoryId && { category_id: selectedCategoryId }),
        }),
      })

      if (!res.ok) {
        const error = await res.json()
        const errorMsg = error.error || error.detail || 'Failed to save prompt'
        alert(`Error: ${typeof errorMsg === 'string' ? errorMsg : JSON.stringify(errorMsg)}`)
        return
      }

      alert('Prompt saved successfully!')
      setPromptName('')
      setPromptContent('')
      setVariables('')
      setTags([])
      setSelectedInteractionTypeId('')
      setSelectedCategoryId('')
    } catch (error) {
      alert(`Failed to save prompt: ${error}`)
      console.error('Save error:', error)
    }
  }

  return (
    <div style={{ padding: '2rem' }}>
      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>⚡ Prompt Workbench</h1>
        <p style={{ color: 'var(--color-foregroundAlt)', marginBottom: '1.5rem' }}>
          Craft and refine prompts with AI suggestions, compose snippets, and test execution
        </p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '2rem' }}>
        {/* Main Editor */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
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

          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.75rem', fontWeight: '600' }}>
              📂 Organize
            </label>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.375rem', fontWeight: '500', fontSize: '0.875rem' }}>
                Interaction type
              </label>
              <select
                value={selectedInteractionTypeId}
                onChange={(e) => handleInteractionTypeChange(e.target.value)}
                className="input"
                style={{ width: '100%', fontSize: '0.875rem' }}
              >
                <option value="">Select a type...</option>
                {interactionTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.emoji ? `${type.emoji} ` : ''}{type.name}
                  </option>
                ))}
              </select>
            </div>

            {selectedInteractionTypeId && (
              <div>
                {categories.length > 0 && (
                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.375rem', fontWeight: '500', fontSize: '0.875rem' }}>
                      Category
                    </label>
                    <select
                      value={selectedCategoryId}
                      onChange={(e) => setSelectedCategoryId(e.target.value)}
                      className="input"
                      style={{ width: '100%', fontSize: '0.875rem' }}
                    >
                      <option value="">Select a category...</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {!showAddCategory ? (
                  <button
                    onClick={() => setShowAddCategory(true)}
                    style={{
                      padding: '0.5rem 0.75rem',
                      backgroundColor: 'transparent',
                      border: '1px solid var(--color-accent)',
                      borderRadius: '0.375rem',
                      cursor: 'pointer',
                      fontSize: '0.875rem',
                      color: 'var(--color-accent)',
                      width: '100%',
                      transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--color-accent)'
                      e.currentTarget.style.color = 'var(--color-background)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent'
                      e.currentTarget.style.color = 'var(--color-accent)'
                    }}
                  >
                    + Add Category
                  </button>
                ) : (
                  <div style={{
                    padding: '0.75rem',
                    backgroundColor: 'var(--color-backgroundAlt)',
                    borderRadius: '0.375rem',
                    border: '1px solid var(--color-border)',
                  }}>
                    <label style={{ display: 'block', marginBottom: '0.375rem', fontWeight: '500', fontSize: '0.875rem' }}>
                      Category Name
                    </label>
                    <input
                      type="text"
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      placeholder="e.g., Advanced Research"
                      className="input"
                      style={{ width: '100%', fontSize: '0.875rem', marginBottom: '0.75rem' }}
                    />
                    <label style={{ display: 'block', marginBottom: '0.375rem', fontWeight: '500', fontSize: '0.875rem' }}>
                      Description (optional)
                    </label>
                    <input
                      type="text"
                      value={newCategoryDesc}
                      onChange={(e) => setNewCategoryDesc(e.target.value)}
                      placeholder="Brief description"
                      className="input"
                      style={{ width: '100%', fontSize: '0.875rem', marginBottom: '0.75rem' }}
                    />
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        onClick={createCategory}
                        disabled={creatingCategory}
                        className="btn btn-primary"
                        style={{ flex: 1, fontSize: '0.875rem' }}
                      >
                        {creatingCategory ? 'Creating...' : 'Create'}
                      </button>
                      <button
                        onClick={() => {
                          setShowAddCategory(false)
                          setNewCategoryName('')
                          setNewCategoryDesc('')
                        }}
                        style={{
                          flex: 1,
                          padding: '0.5rem 0.75rem',
                          backgroundColor: 'var(--color-background)',
                          border: '1px solid var(--color-border)',
                          borderRadius: '0.375rem',
                          cursor: 'pointer',
                          fontSize: '0.875rem',
                          color: 'var(--color-foreground)',
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
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

        {/* Right Sidebar */}
        <aside style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Combined Suggestions & Tags Panel */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <h3 style={{ fontWeight: '600', fontSize: '0.95rem', margin: 0 }}>
                💡 Refine & Tag
              </h3>
              <button
                onClick={() => setShowSuggestionsPanel(!showSuggestionsPanel)}
                style={{
                  padding: '0.25rem 0.5rem',
                  backgroundColor: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '0.75rem',
                  color: 'var(--color-accent)',
                }}
              >
                {showSuggestionsPanel ? '▼' : '▶'}
              </button>
            </div>

            {showSuggestionsPanel && (
              <>
                {/* Tags Section */}
                <div style={{ marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid var(--color-border)' }}>
                  <p style={{ fontSize: '0.75rem', fontWeight: '500', color: 'var(--color-foregroundAlt)', marginBottom: '0.5rem' }}>
                    Tags ({tags.length}/15)
                  </p>

                  {/* Current Tags */}
                  {tags.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem', marginBottom: '0.75rem' }}>
                      {tags.map((tag) => (
                        <button
                          key={tag}
                          onClick={() => removeTag(tag)}
                          style={{
                            padding: '0.375rem 0.75rem',
                            backgroundColor: 'var(--color-accent)',
                            color: 'var(--color-background)',
                            border: 'none',
                            borderRadius: '0.5rem',
                            fontSize: '0.7rem',
                            fontWeight: '500',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.opacity = '0.8'
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.opacity = '1'
                          }}
                          title="Click to remove"
                        >
                          {tag} ✕
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Manual Tag Input */}
                  <div style={{ display: 'flex', gap: '0.375rem', marginBottom: '0.75rem' }}>
                    <input
                      type="text"
                      placeholder="Add tag..."
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          addTag(tagInput)
                        }
                      }}
                      className="input"
                      style={{ flex: 1, fontSize: '0.75rem' }}
                      disabled={tags.length >= 15}
                    />
                    <button
                      className="btn btn-primary"
                      onClick={() => addTag(tagInput)}
                      disabled={tags.length >= 15}
                      style={{ fontSize: '0.7rem', padding: '0.375rem 0.75rem' }}
                    >
                      +
                    </button>
                  </div>

                  {/* Tag Suggestions */}
                  <button
                    className="btn btn-primary"
                    onClick={getTagSuggestions}
                    disabled={tagsLoading || tags.length >= 15}
                    style={{ width: '100%', marginBottom: '0.75rem', fontSize: '0.75rem' }}
                  >
                    {tagsLoading ? '⏳ Analyzing...' : '🏷️ Get Suggestions'}
                  </button>

                  {suggestedTags.length > 0 && (
                    <div style={{ marginBottom: '0.75rem' }}>
                      <p style={{ fontSize: '0.7rem', fontWeight: '500', color: 'var(--color-foregroundAlt)', marginBottom: '0.375rem' }}>
                        Suggested Tags
                      </p>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem', marginBottom: '0.5rem' }}>
                        {suggestedTags.map((tag) => (
                          <button
                            key={tag}
                            onClick={() => acceptSuggestedTag(tag)}
                            style={{
                              padding: '0.375rem 0.75rem',
                              backgroundColor: 'var(--color-background)',
                              border: '1px dashed var(--color-accent)',
                              borderRadius: '0.5rem',
                              fontSize: '0.7rem',
                              color: 'var(--color-foreground)',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = 'var(--color-backgroundAlt)'
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = 'var(--color-background)'
                            }}
                            title="Click to add"
                          >
                            {tag}
                          </button>
                        ))}
                      </div>
                      {suggestedTags.length > 0 && (
                        <button
                          onClick={acceptAllSuggestedTags}
                          style={{
                            padding: '0.375rem 0.75rem',
                            backgroundColor: 'transparent',
                            border: '1px solid var(--color-accent)',
                            borderRadius: '0.375rem',
                            fontSize: '0.7rem',
                            color: 'var(--color-accent)',
                            cursor: 'pointer',
                            width: '100%',
                          }}
                        >
                          Add All
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Suggestions Section */}
                <div>
                  <p style={{ fontSize: '0.75rem', fontWeight: '500', color: 'var(--color-foregroundAlt)', marginBottom: '0.5rem' }}>
                    Improvement Suggestions
                  </p>
                  <div style={{ marginBottom: '0.75rem' }}>
                    <p style={{ fontSize: '0.7rem', fontWeight: '500', color: 'var(--color-foregroundAlt)', marginBottom: '0.375rem' }}>
                      Focus On
                    </p>
                    <div style={{ display: 'flex', gap: '0.375rem' }}>
                      {(['effectiveness', 'constraints'] as const).map((focus) => (
                        <button
                          key={focus}
                          onClick={() => toggleSuggestionFocus(focus)}
                          style={{
                            padding: '0.375rem 0.75rem',
                            backgroundColor: suggestionFocus.has(focus) ? 'var(--color-accent)' : 'var(--color-background)',
                            border: `1px solid ${suggestionFocus.has(focus) ? 'var(--color-accent)' : 'var(--color-border)'}`,
                            borderRadius: '0.375rem',
                            cursor: 'pointer',
                            fontSize: '0.7rem',
                            fontWeight: '500',
                            color: suggestionFocus.has(focus) ? 'var(--color-background)' : 'var(--color-foreground)',
                            transition: 'all 0.2s ease',
                          }}
                        >
                          {focus === 'effectiveness' ? '✨' : '🚧'}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    className="btn btn-primary"
                    onClick={getSuggestions}
                    disabled={suggestionsLoading}
                    style={{ width: '100%', marginBottom: '0.75rem', fontSize: '0.75rem' }}
                  >
                    {suggestionsLoading ? '⏳ Analyzing...' : '💭 Get Suggestions'}
                  </button>

                  {suggestions && (
                    <div style={{
                      backgroundColor: 'var(--color-background)',
                      border: '1px solid var(--color-border)',
                      borderRadius: '0.375rem',
                      padding: '0.75rem',
                      fontSize: '0.7rem',
                      lineHeight: '1.4',
                      color: 'var(--color-foreground)',
                      maxHeight: '200px',
                      overflowY: 'auto',
                      whiteSpace: 'pre-wrap',
                    }}>
                      {suggestions}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Snippets Panel */}
          <div className="card">
            <h3 style={{ fontWeight: '600', marginBottom: '1rem', fontSize: '0.95rem' }}>
              📚 Snippets
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

          {/* Test Panel */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <h3 style={{ fontWeight: '600', fontSize: '0.95rem', margin: 0 }}>
                🧪 Test
              </h3>
              <button
                onClick={() => setShowTestPanel(!showTestPanel)}
                style={{
                  padding: '0.25rem 0.5rem',
                  backgroundColor: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '0.75rem',
                  color: 'var(--color-accent)',
                }}
              >
                {showTestPanel ? '▼' : '▶'}
              </button>
            </div>

            {showTestPanel && (
              <>
                <div style={{ marginBottom: '0.75rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.375rem', fontWeight: '500', fontSize: '0.75rem' }}>
                    Model
                  </label>
                  <select
                    value={testModel}
                    onChange={(e) => setTestModel(e.target.value)}
                    className="input"
                    style={{ width: '100%', fontSize: '0.75rem' }}
                  >
                    <option value="llama3.2">Llama 3.2</option>
                    <option value="gpt-oss:120b-cloud">GPT-OSS 120B (Cloud)</option>
                    <option value="mistral">Mistral</option>
                    <option value="neural-chat">Neural Chat</option>
                  </select>
                </div>

                <div style={{ marginBottom: '0.75rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.375rem', fontWeight: '500', fontSize: '0.75rem' }}>
                    Temperature: {testTemperature.toFixed(1)}
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="2"
                    step="0.1"
                    value={testTemperature}
                    onChange={(e) => setTestTemperature(parseFloat(e.target.value))}
                    style={{ width: '100%' }}
                  />
                </div>

                <div style={{ marginBottom: '0.75rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.375rem', fontWeight: '500', fontSize: '0.75rem' }}>
                    Max Tokens
                  </label>
                  <input
                    type="number"
                    value={testMaxTokens}
                    onChange={(e) => setTestMaxTokens(parseInt(e.target.value) || 500)}
                    className="input"
                    style={{ width: '100%', fontSize: '0.75rem' }}
                  />
                </div>

                {Object.keys(testVariables).length > 0 && (
                  <div style={{ marginBottom: '0.75rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.375rem', fontWeight: '500', fontSize: '0.75rem' }}>
                      Variables
                    </label>
                    {Object.entries(testVariables).map(([key]) => (
                      <input
                        key={key}
                        type="text"
                        placeholder={`{${key}}`}
                        value={testVariables[key]}
                        onChange={(e) => setTestVariables({ ...testVariables, [key]: e.target.value })}
                        className="input"
                        style={{ width: '100%', marginBottom: '0.5rem', fontSize: '0.7rem' }}
                      />
                    ))}
                  </div>
                )}

                <button
                  className="btn btn-primary"
                  onClick={runTest}
                  disabled={testLoading}
                  style={{ width: '100%', marginBottom: '0.75rem', fontSize: '0.75rem' }}
                >
                  {testLoading ? '⏳ Running...' : '▶ Run Test'}
                </button>

                {testOutput && (
                  <div style={{ marginBottom: '0.75rem' }}>
                    <p style={{ fontSize: '0.7rem', color: 'var(--color-foregroundAlt)', marginBottom: '0.375rem', fontWeight: '500' }}>
                      Output
                    </p>
                    <div style={{
                      backgroundColor: 'var(--color-background)',
                      border: '1px solid var(--color-border)',
                      borderRadius: '0.375rem',
                      padding: '0.5rem',
                      fontSize: '0.7rem',
                      fontFamily: 'monospace',
                      maxHeight: '150px',
                      overflowY: 'auto',
                      color: 'var(--color-foreground)',
                    }}>
                      {testOutput}
                    </div>
                  </div>
                )}

                {testResults.length > 0 && (
                  <div>
                    <p style={{ fontSize: '0.7rem', color: 'var(--color-foregroundAlt)', marginBottom: '0.375rem', fontWeight: '500' }}>
                      History ({testResults.length})
                    </p>
                    <div style={{ maxHeight: '120px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                      {testResults.map((result) => (
                        <button
                          key={result.id}
                          onClick={() => setTestOutput(result.output)}
                          style={{
                            padding: '0.375rem',
                            backgroundColor: 'var(--color-background)',
                            border: '1px solid var(--color-border)',
                            borderRadius: '0.25rem',
                            cursor: 'pointer',
                            textAlign: 'left',
                            fontSize: '0.65rem',
                            transition: 'all 0.2s ease',
                            color: 'var(--color-foreground)',
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
                          <div style={{ fontWeight: '500' }}>{result.model} @ {result.timestamp}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </aside>
      </div>
    </div>
  )
}
