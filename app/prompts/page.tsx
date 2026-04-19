'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { API_ENDPOINTS } from '@/lib/api-config'
import { useAuth } from '@/app/providers'

interface OllamaModel {
  id: string
  name: string
  size: string | null
  parameter_size: string | null
  quantization_level: string | null
  family: string | null
  description: string
}

interface Snippet {
  id: string
  name: string
  content: string
}

interface PromptVersion {
  id: string
  version_number: number
  template_body: string
  config?: Record<string, any>
  created_at: string
  updated_at: string
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

interface LoadablePrompt {
  id: string
  name: string
  description?: string
  created_at: string
}

interface VariableSet {
  id: string
  name: string
  values: Record<string, string>
  createdAt: string
  updatedAt: string
}

export default function WorkbenchPage() {
  const { user } = useAuth()
  const searchParams = useSearchParams()
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
  const [ollamaModels, setOllamaModels] = useState<OllamaModel[]>([])
  const [testFamilyFilter, setTestFamilyFilter] = useState('all')
  const [testTemperature, setTestTemperature] = useState(0.7)
  const [testMaxTokens, setTestMaxTokens] = useState(500)
  const [testVariables, setTestVariables] = useState<Record<string, string>>({})
  const [testOutput, setTestOutput] = useState<string | null>(null)
  const [testLoading, setTestLoading] = useState(false)
  const [testResults, setTestResults] = useState<TestResult[]>([])
  const [showVersionHistory, setShowVersionHistory] = useState(false)
  const [versions, setVersions] = useState<PromptVersion[]>([])
  const [activeMobileSection, setActiveMobileSection] = useState<string>('refine')
  const [selectedVersionForView, setSelectedVersionForView] = useState<PromptVersion | null>(null)
  const [compareVersionForDiff, setCompareVersionForDiff] = useState<PromptVersion | null>(null)
  const [showDiffView, setShowDiffView] = useState(false)
  const [fillCopied, setFillCopied] = useState(false)

  // Variable sets state
  const [variableSets, setVariableSets] = useState<VariableSet[]>([])
  const [activeSetId, setActiveSetId] = useState<string | null>(null)
  const [showSaveSetInput, setShowSaveSetInput] = useState(false)
  const [newSetName, setNewSetName] = useState('')
  const [setUpdateFeedback, setSetUpdateFeedback] = useState(false)

  // Load prompt state
  const [availablePrompts, setAvailablePrompts] = useState<LoadablePrompt[]>([])
  const [loadedPromptId, setLoadedPromptId] = useState<string | null>(null)
  const [currentPromptVersionId, setCurrentPromptVersionId] = useState<string | null>(null)
  const [loadedPromptDescription, setLoadedPromptDescription] = useState('')
  const [loadedPromptModel, setLoadedPromptModel] = useState('gpt-4')
  const [promptsLoading, setPromptsLoading] = useState(false)

  useEffect(() => {
    fetchSnippets()
    fetchInteractionTypes()
    // Lazy load prompts only when load selector is opened
  }, [user])

  // Fetch Ollama models for test panel
  useEffect(() => {
    const fetchModels = async () => {
      try {
        const res = await fetch(API_ENDPOINTS.models)
        if (res.ok) {
          const data = await res.json()
          if (data.models?.length > 0) {
            setOllamaModels(data.models)
            setTestModel(data.models[0].id)
          }
        }
      } catch {
        // Silently fall back to static model list
      }
    }
    fetchModels()
  }, [])

  // Auto-load prompt from URL parameter
  useEffect(() => {
    const promptId = searchParams?.get('load')
    if (promptId && user) {
      loadPrompt(promptId)
    }
  }, [searchParams, user])

  // Load saved variable sets whenever the active prompt changes
  useEffect(() => {
    const key = `variable-sets-${loadedPromptId || 'draft'}`
    try {
      const raw = localStorage.getItem(key)
      setVariableSets(raw ? JSON.parse(raw) : [])
    } catch {
      setVariableSets([])
    }
    setActiveSetId(null)
  }, [loadedPromptId])

  // Auto-detect variables as prompt content changes
  useEffect(() => {
    const matches = promptContent.match(/\{([^}]+)\}/g)
    if (matches) {
      const vars = matches.map(m => m.slice(1, -1)).filter((v, i, a) => a.indexOf(v) === i)
      setVariables(vars.join(', '))
      setTestVariables(prev => {
        const next: Record<string, string> = {}
        vars.forEach(v => { next[v] = prev[v] || '' })
        return next
      })
    } else {
      setVariables('')
      setTestVariables({})
    }
  }, [promptContent])

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

  const fetchAvailablePrompts = async () => {
    try {
      const token = localStorage.getItem('auth-token')
      const res = await fetch(API_ENDPOINTS.prompts.list, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
      if (res.ok) {
        const data = await res.json()
        setAvailablePrompts(Array.isArray(data) ? data : (data.prompts || []))
      }
    } catch (error) {
      console.error('Failed to fetch available prompts:', error)
    }
  }

  const loadPrompt = async (promptId: string) => {
    try {
      setPromptsLoading(true)
      const token = localStorage.getItem('auth-token')
      const res = await fetch(API_ENDPOINTS.prompts.detail(promptId), {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (!res.ok) {
        alert('Failed to load prompt')
        return
      }

      const data = await res.json()

      // Load the latest version's content
      const latestVersion = data.versions?.[0] || data.latest_version

      setLoadedPromptId(promptId)
      setCurrentPromptVersionId(latestVersion?.id || null)
      setPromptName(data.name)
      setPromptContent(latestVersion?.template_body || data.template_body || '')
      setLoadedPromptDescription(data.description || '')
      setLoadedPromptModel(data.model || 'gpt-4')
      setTags(data.tags || [])
      setSelectedCategoryId(data.category_id || '')
      setVersions(data.versions || [])
      setSelectedVersionForView(latestVersion || null)
      // Clear diff/comparison view when loading new prompt
      setCompareVersionForDiff(null)
      setShowDiffView(false)
      // Clear suggestions and refinement panels
      setShowSuggestionsPanel(false)
      setSuggestions(null)
      setSuggestedTags([])
      setTagInput('')

      // Extract variables from loaded content
      const matches = (latestVersion?.template_body || data.template_body || '').match(/\{([^}]+)\}/g)
      if (matches) {
        const vars = matches.map(m => m.slice(1, -1)).filter((v, i, a) => a.indexOf(v) === i)
        setVariables(vars.join(', '))
      }
    } catch (error) {
      console.error('Error loading prompt:', error)
      alert('Failed to load prompt')
    } finally {
      setPromptsLoading(false)
    }
  }

  const clearLoadedPrompt = () => {
    setLoadedPromptId(null)
    setCurrentPromptVersionId(null)
    setPromptName('')
    setPromptContent('')
    setLoadedPromptDescription('')
    setLoadedPromptModel('gpt-4')
    setTags([])
    setVariables('')
    setVersions([])
    setSelectedVersionForView(null)
    setCompareVersionForDiff(null)
    setShowDiffView(false)
    setShowSuggestionsPanel(false)
    setSuggestions(null)
    setSuggestedTags([])
    setTagInput('')
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
      const token = localStorage.getItem('auth-token')
      const res = await fetch(API_ENDPOINTS.tags, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          promptContent: promptContent,
        }),
      })

      if (!res.ok) {
        const error = await res.json()
        alert(`Error getting tag suggestions: ${error.detail || 'Unknown error'}`)
        return
      }

      const data = await res.json()
      // Filter out tags that are already added
      const newTags = data.tags.filter((tag: string) => !tags.includes(tag))
      setSuggestedTags(newTags)
    } catch (error) {
      console.error('Error getting tag suggestions:', error)
      alert(`Failed to get tag suggestions: ${error instanceof Error ? error.message : String(error)}`)
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

  const handleCopyFilled = async () => {
    const filled = compilePrompt()
    await navigator.clipboard.writeText(filled)
    setFillCopied(true)
    setTimeout(() => setFillCopied(false), 2000)
  }

  // Variable sets — localStorage helpers
  const varSetsKey = () => `variable-sets-${loadedPromptId || 'draft'}`

  const persistSets = (sets: VariableSet[]) => {
    try { localStorage.setItem(varSetsKey(), JSON.stringify(sets)) } catch {}
  }

  const handleSaveSet = () => {
    if (!newSetName.trim()) return
    const newSet: VariableSet = {
      id: Date.now().toString(),
      name: newSetName.trim(),
      values: { ...testVariables },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    const updated = [...variableSets, newSet]
    setVariableSets(updated)
    persistSets(updated)
    setActiveSetId(newSet.id)
    setNewSetName('')
    setShowSaveSetInput(false)
  }

  const handleLoadSet = (set: VariableSet) => {
    setTestVariables({ ...set.values })
    setActiveSetId(set.id)
  }

  const handleUpdateSet = () => {
    if (!activeSetId) return
    const updated = variableSets.map(s =>
      s.id === activeSetId
        ? { ...s, values: { ...testVariables }, updatedAt: new Date().toISOString() }
        : s
    )
    setVariableSets(updated)
    persistSets(updated)
    setSetUpdateFeedback(true)
    setTimeout(() => setSetUpdateFeedback(false), 1500)
  }

  const handleDeleteSet = (setId: string) => {
    const updated = variableSets.filter(s => s.id !== setId)
    setVariableSets(updated)
    persistSets(updated)
    if (activeSetId === setId) setActiveSetId(null)
  }

  const calculateDiff = (oldText: string, newText: string) => {
    const oldLines = oldText.split('\n')
    const newLines = newText.split('\n')
    const maxLength = Math.max(oldLines.length, newLines.length)
    const diffs: Array<{ type: 'add' | 'remove' | 'common'; line: string }> = []

    for (let i = 0; i < maxLength; i++) {
      const oldLine = oldLines[i]
      const newLine = newLines[i]

      if (oldLine === newLine) {
        if (oldLine !== undefined) {
          diffs.push({ type: 'common', line: oldLine })
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
    if (!currentPromptVersionId) {
      alert('Please save the prompt first, then test it')
      return
    }

    setTestLoading(true)
    try {
      const token = localStorage.getItem('auth-token')
      const res = await fetch(API_ENDPOINTS.execute.run, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          prompt_version_id: currentPromptVersionId,
          variables: testVariables,
        })
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.detail || 'Test execution failed')
      }

      const result = await res.json()
      setTestOutput(result.output)

      const testResult: TestResult = {
        id: result.id,
        timestamp: new Date().toLocaleTimeString(),
        model: result.model,
        temperature: testTemperature,
        maxTokens: testMaxTokens,
        variables: { ...testVariables },
        output: result.output,
      }

      setTestResults([testResult, ...testResults])
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error)
      setTestOutput(`Error running test: ${errorMsg}`)
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

      if (loadedPromptId) {
        // Updating existing prompt
        const updateRes = await fetch(API_ENDPOINTS.prompts.update(loadedPromptId), {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: promptName,
            description: loadedPromptDescription,
            tags,
            model: loadedPromptModel,
            template_body: promptContent,
            ...(selectedCategoryId && { category_id: selectedCategoryId }),
          }),
        })

        if (!updateRes.ok) {
          const error = await updateRes.json()
          alert(`Error updating prompt: ${error.detail || 'Unknown error'}`)
          return
        }

        alert('Prompt updated successfully!')
        // Reload the prompt to get updated versions
        await loadPrompt(loadedPromptId)
        // Capture the latest version ID for testing
        if (loadedPromptId) {
          const freshRes = await fetch(API_ENDPOINTS.prompts.get(loadedPromptId), {
            headers: { 'Authorization': `Bearer ${token}` }
          })
          if (freshRes.ok) {
            const freshData = await freshRes.json()
            if (freshData.latest_version?.id) {
              setCurrentPromptVersionId(freshData.latest_version.id)
            }
          }
        }
      } else {
        // Creating new prompt
        const createRes = await fetch(API_ENDPOINTS.prompts.create, {
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

        if (!createRes.ok) {
          const error = await createRes.json()
          const errorMsg = error.error || error.detail || 'Failed to save prompt'
          alert(`Error: ${typeof errorMsg === 'string' ? errorMsg : JSON.stringify(errorMsg)}`)
          return
        }

        const newPromptData = await createRes.json()
        alert('Prompt saved successfully!')

        // Capture the version ID for testing
        if (newPromptData.latest_version?.id) {
          setCurrentPromptVersionId(newPromptData.latest_version.id)
          setLoadedPromptId(newPromptData.id)
        }

        // Refresh prompts list
        await fetchAvailablePrompts()
      }
    } catch (error) {
      alert(`Failed to save prompt: ${error}`)
      console.error('Save error:', error)
    }
  }

  return (
    <div style={{ padding: '1.5rem' }}>
      <header style={{ marginBottom: '2rem' }}>
        <div style={{ marginBottom: '1rem' }}>
          <Link href="/dashboard" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', color: 'var(--color-foregroundAlt)', textDecoration: 'none', fontSize: '0.875rem', padding: '0.375rem 0.75rem', border: '1px solid var(--color-border)', borderRadius: '0.375rem' }}>
            ← Dashboard
          </Link>
        </div>
        <h1 style={{ fontSize: 'clamp(1.25rem, 5vw, 2rem)', fontWeight: 'bold', marginBottom: '0.5rem' }}>⚡ Workbench</h1>
        <p style={{ color: 'var(--color-foregroundAlt)', marginBottom: '1.5rem' }}>
          Craft and refine prompts with AI suggestions, compose snippets, and test execution
        </p>
      </header>

      <div className="workbench-grid">
        {/* Main Editor */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {/* Load Prompt Section */}
          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.75rem', fontWeight: '600' }}>
              {loadedPromptId ? '📂 Editing' : '📂 Load Prompt'}
            </label>
            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.75rem' }}>
              <select
                value={loadedPromptId || ''}
                onChange={(e) => {
                  if (e.target.value) {
                    loadPrompt(e.target.value)
                  }
                }}
                onFocus={() => {
                  if (availablePrompts.length === 0 && !promptsLoading) {
                    fetchAvailablePrompts()
                  }
                }}
                disabled={promptsLoading}
                className="input"
                style={{ flex: 1, fontSize: '0.875rem' }}
              >
                <option value="">
                  {promptsLoading ? 'Loading prompts...' : 'Select a prompt to edit...'}
                </option>
                {availablePrompts.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              {loadedPromptId && (
                <button
                  onClick={clearLoadedPrompt}
                  title="New prompt"
                  style={{
                    padding: '0.375rem 0.625rem',
                    backgroundColor: 'transparent',
                    border: '1px solid var(--color-border)',
                    borderRadius: '0.375rem',
                    cursor: 'pointer',
                    fontSize: '1rem',
                    color: 'var(--color-foreground)',
                    lineHeight: 1,
                    flexShrink: 0,
                  }}
                >
                  +
                </button>
              )}
            </div>
            {loadedPromptId && (
              <p style={{ fontSize: '0.75rem', color: 'var(--color-foregroundAlt)', marginBottom: 0 }}>
                You are editing an existing prompt. Save to create a new version.
              </p>
            )}
          </div>

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

          {/* Fill Variables & Copy */}
          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <label style={{ fontWeight: '600' }}>
                📋 Fill Variables
              </label>
              {promptContent.trim() && (
                <button
                  onClick={handleCopyFilled}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.375rem',
                    padding: '0.375rem 0.875rem',
                    backgroundColor: fillCopied ? 'var(--color-success)' : 'var(--color-accent)',
                    color: '#1d2021',
                    border: 'none',
                    borderRadius: '0.5rem',
                    cursor: 'pointer',
                    fontSize: '0.8rem',
                    fontWeight: '700',
                    transition: 'all 0.2s ease',
                    fontFamily: '\'Fraunces\', serif',
                  }}
                >
                  {fillCopied ? '✓ Copied!' : '⎘ Copy Filled Prompt'}
                </button>
              )}
            </div>

            {Object.keys(testVariables).length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {Object.entries(testVariables).map(([key]) => (
                  <div key={key}>
                    <label style={{
                      display: 'block',
                      marginBottom: '0.25rem',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      color: 'var(--color-accent)',
                      fontFamily: '\'JetBrains Mono\', monospace',
                    }}>
                      {'{' + key + '}'}
                    </label>
                    <input
                      type="text"
                      placeholder={`Value for ${key}…`}
                      value={testVariables[key]}
                      onChange={(e) => {
                        setTestVariables({ ...testVariables, [key]: e.target.value })
                        setActiveSetId(null)
                      }}
                      className="input"
                      style={{ width: '100%', fontSize: '0.875rem' }}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ fontSize: '0.875rem', color: 'var(--color-foregroundAlt)' }}>
                {promptContent.trim()
                  ? 'No variables detected — use {variable_name} syntax in your prompt.'
                  : 'Variables you add with {variable_name} syntax will appear here to fill in.'}
              </p>
            )}

            {/* Saved Sets */}
            <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid var(--color-border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.625rem' }}>
                <span style={{ fontSize: '0.7rem', fontWeight: '700', color: 'var(--color-foregroundAlt)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Saved Sets
                </span>
                <div style={{ display: 'flex', gap: '0.375rem' }}>
                  {activeSetId && (
                    <button
                      onClick={handleUpdateSet}
                      style={{
                        padding: '0.25rem 0.625rem',
                        backgroundColor: setUpdateFeedback ? 'var(--color-success)' : 'transparent',
                        border: `1px solid ${setUpdateFeedback ? 'var(--color-success)' : 'var(--color-accent)'}`,
                        borderRadius: '0.375rem',
                        cursor: 'pointer',
                        fontSize: '0.72rem',
                        fontWeight: '600',
                        color: setUpdateFeedback ? '#1d2021' : 'var(--color-accent)',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      {setUpdateFeedback ? '✓ Saved' : '↑ Update'}
                    </button>
                  )}
                  {!showSaveSetInput && (
                    <button
                      onClick={() => setShowSaveSetInput(true)}
                      style={{
                        padding: '0.25rem 0.625rem',
                        backgroundColor: 'var(--color-accent)',
                        border: 'none',
                        borderRadius: '0.375rem',
                        cursor: 'pointer',
                        fontSize: '0.72rem',
                        fontWeight: '700',
                        color: '#1d2021',
                      }}
                    >
                      + Save Set
                    </button>
                  )}
                </div>
              </div>

              {showSaveSetInput && (
                <div style={{ display: 'flex', gap: '0.375rem', marginBottom: '0.625rem' }}>
                  <input
                    type="text"
                    placeholder="Set name…"
                    value={newSetName}
                    onChange={(e) => setNewSetName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveSet()
                      if (e.key === 'Escape') { setShowSaveSetInput(false); setNewSetName('') }
                    }}
                    autoFocus
                    className="input"
                    style={{ flex: 1, fontSize: '0.8rem' }}
                  />
                  <button
                    onClick={handleSaveSet}
                    style={{ padding: '0.25rem 0.625rem', backgroundColor: 'var(--color-accent)', border: 'none', borderRadius: '0.375rem', cursor: 'pointer', fontSize: '0.75rem', fontWeight: '700', color: '#1d2021' }}
                  >
                    Save
                  </button>
                  <button
                    onClick={() => { setShowSaveSetInput(false); setNewSetName('') }}
                    style={{ padding: '0.25rem 0.5rem', backgroundColor: 'transparent', border: '1px solid var(--color-border)', borderRadius: '0.375rem', cursor: 'pointer', fontSize: '0.75rem', color: 'var(--color-foregroundAlt)' }}
                  >
                    ✕
                  </button>
                </div>
              )}

              {variableSets.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                  {variableSets.map((set) => {
                    const isActive = activeSetId === set.id
                    return (
                      <div
                        key={set.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.375rem',
                          padding: '0.375rem 0.625rem',
                          backgroundColor: isActive ? 'rgba(254,128,25,0.08)' : 'var(--color-background)',
                          border: `1px solid ${isActive ? 'var(--color-accent)' : 'var(--color-border)'}`,
                          borderRadius: '0.375rem',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <button
                          onClick={() => handleLoadSet(set)}
                          style={{
                            flex: 1,
                            textAlign: 'left',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: '0.8rem',
                            fontWeight: isActive ? '600' : '400',
                            color: isActive ? 'var(--color-accent)' : 'var(--color-foreground)',
                            padding: 0,
                          }}
                        >
                          {isActive && '▸ '}{set.name}
                        </button>
                        <span style={{ fontSize: '0.65rem', color: 'var(--color-foregroundAlt)' }}>
                          {Object.keys(set.values).length}v
                        </span>
                        <button
                          onClick={() => handleDeleteSet(set.id)}
                          title="Delete set"
                          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.7rem', color: 'var(--color-foregroundAlt)', padding: '0 0.125rem', lineHeight: 1, opacity: 0.7 }}
                          onMouseEnter={(e) => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.color = 'var(--color-error)' }}
                          onMouseLeave={(e) => { e.currentTarget.style.opacity = '0.7'; e.currentTarget.style.color = 'var(--color-foregroundAlt)' }}
                        >
                          ✕
                        </button>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p style={{ fontSize: '0.75rem', color: 'var(--color-foregroundAlt)', fontStyle: 'italic' }}>
                  No saved sets yet
                </p>
              )}
            </div>
          </div>

          {/* Current Metadata Display */}
          <div className="card" style={{ marginBottom: '1.5rem', backgroundColor: 'var(--color-backgroundAlt)' }}>
            <label style={{ display: 'block', marginBottom: '0.75rem', fontWeight: '600' }}>
              📊 Current Metadata
            </label>

            {/* Tags Display */}
            <div style={{ marginBottom: '0.75rem' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: '500', color: 'var(--color-foregroundAlt)', marginBottom: '0.375rem', textTransform: 'uppercase' }}>
                Tags
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {tags.length > 0 ? (
                  tags.map((tag) => (
                    <span key={tag} style={{
                      display: 'inline-block',
                      padding: '0.25rem 0.75rem',
                      backgroundColor: 'var(--color-accent)',
                      color: 'var(--color-background)',
                      borderRadius: '0.25rem',
                      fontSize: '0.75rem',
                      fontWeight: '500'
                    }}>
                      {tag}
                    </span>
                  ))
                ) : (
                  <span style={{ fontSize: '0.875rem', color: 'var(--color-foregroundAlt)' }}>None</span>
                )}
              </div>
            </div>

            {/* Interaction Type Display */}
            {selectedInteractionTypeId && (
              <div style={{ marginBottom: '0.75rem' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: '500', color: 'var(--color-foregroundAlt)', marginBottom: '0.25rem', textTransform: 'uppercase' }}>
                  Interaction Type
                </div>
                <div style={{ fontSize: '0.875rem', color: 'var(--color-foreground)' }}>
                  {interactionTypes.find(t => t.id === selectedInteractionTypeId)?.emoji} {interactionTypes.find(t => t.id === selectedInteractionTypeId)?.name}
                </div>
              </div>
            )}

            {/* Category Display */}
            {selectedCategoryId && (
              <div style={{ marginBottom: '0.75rem' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: '500', color: 'var(--color-foregroundAlt)', marginBottom: '0.25rem', textTransform: 'uppercase' }}>
                  Category
                </div>
                <div style={{ fontSize: '0.875rem', color: 'var(--color-foreground)' }}>
                  {categories.find(c => c.id === selectedCategoryId)?.name}
                </div>
              </div>
            )}

            {/* Model Display */}
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: '500', color: 'var(--color-foregroundAlt)', marginBottom: '0.25rem', textTransform: 'uppercase' }}>
                Model
              </div>
              <div style={{ fontSize: '0.875rem', color: 'var(--color-foreground)', fontFamily: 'monospace' }}>
                {loadedPromptModel || 'Not set'}
              </div>
            </div>
          </div>

          {/* Metadata Editor */}
          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.75rem', fontWeight: '600' }}>
              📋 Metadata
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

            {/* Description Field */}
            <div style={{ marginTop: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.375rem', fontWeight: '500', fontSize: '0.875rem' }}>
                Description
              </label>
              <textarea
                value={loadedPromptDescription}
                onChange={(e) => setLoadedPromptDescription(e.target.value)}
                placeholder="Brief description of what this prompt does"
                className="input"
                style={{
                  width: '100%',
                  fontSize: '0.875rem',
                  minHeight: '60px',
                  resize: 'vertical'
                }}
              />
            </div>

            {/* Model Field */}
            <div style={{ marginTop: '0.75rem' }}>
              <label style={{ display: 'block', marginBottom: '0.375rem', fontWeight: '500', fontSize: '0.875rem' }}>
                Model
              </label>
              <input
                type="text"
                value={loadedPromptModel}
                onChange={(e) => setLoadedPromptModel(e.target.value)}
                placeholder="e.g., gpt-4"
                className="input"
                style={{ width: '100%', fontSize: '0.875rem' }}
              />
            </div>
          </div>

          <div className="btn-group-mobile" style={{ display: 'flex', gap: '1rem' }}>
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
          {/* Mobile Section Tabs */}
          <div className="mobile-section-tabs">
            {[
              { id: 'refine', label: '💡 Refine' },
              { id: 'snippets', label: '📚 Snippets' },
              { id: 'test', label: '🧪 Test' },
              { id: 'versions', label: '📜 Versions' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveMobileSection(tab.id)}
                style={{
                  padding: '8px 14px',
                  minHeight: '40px',
                  backgroundColor: activeMobileSection === tab.id ? 'var(--color-accent)' : 'var(--color-background)',
                  color: activeMobileSection === tab.id ? 'var(--color-background)' : 'var(--color-foreground)',
                  border: `2px solid ${activeMobileSection === tab.id ? 'var(--color-accent)' : 'var(--color-border)'}`,
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  fontSize: '0.8rem',
                  fontWeight: '600',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.2s',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Combined Suggestions & Tags Panel */}
          <div className={`card${activeMobileSection !== 'refine' ? ' mobile-section-hidden' : ''}`}>
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
          <div className={`card${activeMobileSection !== 'snippets' ? ' mobile-section-hidden' : ''}`}>
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
          <div className={`card${activeMobileSection !== 'test' ? ' mobile-section-hidden' : ''}`}>
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
                  {ollamaModels.length > 0 && (() => {
                    const families = Array.from(new Set(ollamaModels.map(m => m.family).filter(Boolean))) as string[]
                    if (families.length === 0) return null
                    return (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem', marginBottom: '0.5rem' }}>
                        <button
                          onClick={() => setTestFamilyFilter('all')}
                          style={{
                            fontSize: '0.65rem', padding: '0.15rem 0.5rem', borderRadius: '9999px', cursor: 'pointer',
                            backgroundColor: testFamilyFilter === 'all' ? 'var(--color-accent)' : 'var(--color-surface)',
                            color: testFamilyFilter === 'all' ? '#1d2021' : 'var(--color-foregroundAlt)',
                            border: '1px solid var(--color-border)',
                          }}
                        >all</button>
                        {families.map(f => (
                          <button key={f} onClick={() => setTestFamilyFilter(f)} style={{
                            fontSize: '0.65rem', padding: '0.15rem 0.5rem', borderRadius: '9999px', cursor: 'pointer',
                            backgroundColor: testFamilyFilter === f ? 'var(--color-accent)' : 'var(--color-surface)',
                            color: testFamilyFilter === f ? '#1d2021' : 'var(--color-foregroundAlt)',
                            border: '1px solid var(--color-border)',
                          }}>{f}</button>
                        ))}
                      </div>
                    )
                  })()}
                  <select
                    value={testModel}
                    onChange={(e) => setTestModel(e.target.value)}
                    className="input"
                    style={{ width: '100%', fontSize: '0.75rem' }}
                  >
                    {ollamaModels.length > 0 ? (
                      ollamaModels
                        .filter(m => testFamilyFilter === 'all' || m.family === testFamilyFilter)
                        .map(m => (
                          <option key={m.id} value={m.id}>{m.name}{m.parameter_size ? ` (${m.parameter_size})` : ''}</option>
                        ))
                    ) : (
                      <>
                        <option value="llama3.2">Llama 3.2</option>
                        <option value="mistral">Mistral</option>
                        <option value="neural-chat">Neural Chat</option>
                      </>
                    )}
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
                          onClick={