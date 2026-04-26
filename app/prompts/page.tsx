'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { API_ENDPOINTS } from '@/lib/api-config'
import { useAuth } from '@/app/providers'

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

interface CompositionItem {
  id: string // unique id for this composition item
  snippetId: string
  snippetName: string
  snippetContent: string
  order: number
}

export default function WorkbenchPage() {
  const { user } = useAuth()
  const searchParams = useSearchParams()
  const [snippets, setSnippets] = useState<Snippet[]>([])
  const [snippetSearch, setSnippetSearch] = useState('')
  const [composition, setComposition] = useState<CompositionItem[]>([])
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null)
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

  const [testVariables, setTestVariables] = useState<Record<string, string>>({})
  const [showVersionHistory, setShowVersionHistory] = useState(false)
  const [versions, setVersions] = useState<PromptVersion[]>([])
  const [activeMobileSection, setActiveMobileSection] = useState<string>('refine')
  const [selectedVersionForView, setSelectedVersionForView] = useState<PromptVersion | null>(null)
  const [compareVersionForDiff, setCompareVersionForDiff] = useState<PromptVersion | null>(null)
  const [showDiffView, setShowDiffView] = useState(false)
  const [fillCopied, setFillCopied] = useState(false)
  const [contentCopied, setContentCopied] = useState(false)

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
  const [loadedPromptModel, setLoadedPromptModel] = useState('')
  const [availableModels, setAvailableModels] = useState<any[]>([])
  const [userTier, setUserTier] = useState('free')
  const [promptsLoading, setPromptsLoading] = useState(false)
  const [modelsLoading, setModelsLoading] = useState(true)

  // Favorite state
  const [isFavorite, setIsFavorite] = useState(false)
  const [favoriteLoading, setFavoriteLoading] = useState(false)

  // Save feedback state
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [saveMessage, setSaveMessage] = useState('')

  useEffect(() => {
    if (!user) return
    Promise.allSettled([fetchSnippets(), fetchInteractionTypes()])
  }, [user])

  // Fetch tiered models on mount
  useEffect(() => {
    if (!user) return
    const fetchModels = async () => {
      try {
        const token = localStorage.getItem('auth-token')
        const res = await fetch(API_ENDPOINTS.models, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        })
        const data = await res.json()
        setAvailableModels(data.models || [])
        setUserTier(data.user_tier || 'free')
        if (!loadedPromptModel && data.models?.length > 0) {
          setLoadedPromptModel(data.models[0].id)
        }
      } catch {
        // silently fail — keep existing model input
      } finally {
        setModelsLoading(false)
      }
    }
    fetchModels()
  }, [user])

  // Auto-load prompt from URL parameter
  const [loadedPromptIdFromUrl, setLoadedPromptIdFromUrl] = useState<string | null>(null)
  useEffect(() => {
    const promptId = searchParams?.get('load')
    if (promptId && user && promptId !== loadedPromptIdFromUrl) {
      setLoadedPromptIdFromUrl(promptId)
      loadPrompt(promptId)
    }
  }, [searchParams, user])

  // Load saved variable sets whenever the active prompt changes
  useEffect(() => {
    const key = `variable-sets-${loadedPromptId || 'draft'}`
    try {
      const raw = localStorage.getItem(key)
      const loaded = raw ? JSON.parse(raw) : []
      setVariableSets(loaded)
      // Debug logging
      console.log(`[Variable Sets] Loaded ${loaded.length} sets from key: ${key}`)
    } catch (err) {
      console.error(`[Variable Sets] Error loading from ${key}:`, err)
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
      const res = await fetch(API_ENDPOINTS.categories.interactions.list, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
      const data = await res.json()
      // Backend returns array directly or wrapped in object
      setInteractionTypes(Array.isArray(data) ? data : (data.interactions || data.types || []))
    } catch (error) {
      console.error('Failed to fetch interaction types:', error)
      setInteractionTypes([])
    }
  }

  const fetchCategories = async (typeId: string, keepSelection?: string) => {
    if (!typeId) {
      setCategories([])
      if (!keepSelection) setSelectedCategoryId('')
      return
    }
    try {
      const token = localStorage.getItem('auth-token')
      const res = await fetch(API_ENDPOINTS.categories.list, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
      const data = await res.json()
      const allCategories = Array.isArray(data) ? data : (data.categories || [])
      const filtered = allCategories.filter((cat: any) => cat.agent_interaction_type_id === typeId)
      setCategories(filtered)
      if (!keepSelection) setSelectedCategoryId('')
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
      const modelInList = availableModels.some((m: any) => m.id === data.model)
      setLoadedPromptModel(modelInList ? data.model : (availableModels[0]?.id || data.model || ''))
      setTags(data.tags || [])
      if (data.agent_interaction_type_id) {
        setSelectedInteractionTypeId(data.agent_interaction_type_id)
        fetchCategories(data.agent_interaction_type_id, data.category_id || '')
      } else {
        setSelectedCategoryId(data.category_id || '')
      }
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

      // Check favorite status
      checkFavoriteStatus(promptId)

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

  const checkFavoriteStatus = async (promptId: string) => {
    try {
      const token = localStorage.getItem('auth-token')
      if (!token) return
      const res = await fetch(API_ENDPOINTS.prompts.favorite(promptId), {
        headers: { 'Authorization': `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setIsFavorite(data.is_favorite)
      }
    } catch {
      // silently fail
    }
  }

  const toggleFavorite = async () => {
    if (!loadedPromptId || favoriteLoading) return
    setFavoriteLoading(true)
    try {
      const token = localStorage.getItem('auth-token')
      if (!token) return
      const method = isFavorite ? 'DELETE' : 'POST'
      const res = await fetch(API_ENDPOINTS.prompts.favorite(loadedPromptId), {
        method,
        headers: { 'Authorization': `Bearer ${token}` },
      })
      if (res.ok) {
        setIsFavorite(!isFavorite)
      }
    } catch {
      // silently fail
    } finally {
      setFavoriteLoading(false)
    }
  }

  const clearLoadedPrompt = () => {
    setLoadedPromptId(null)
    setCurrentPromptVersionId(null)
    setPromptName('')
    setPromptContent('')
    setLoadedPromptDescription('')
    setLoadedPromptModel(availableModels[0]?.id || '')
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
    setIsFavorite(false)
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
      const res = await fetch(API_ENDPOINTS.categories.create, {
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

    if (!loadedPromptId) {
      alert('Please save the prompt first to get tag suggestions')
      return
    }

    setTagsLoading(true)
    try {
      const token = localStorage.getItem('auth-token')

      // Call the new tag suggestions endpoint
      const res = await fetch(`${API_ENDPOINTS.prompts.detail(loadedPromptId)}/tags-suggestions`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (!res.ok) {
        const error = await res.json()
        setSuggestedTags([])
        alert(`Error: ${error.error || 'Failed to get tag suggestions'}`)
        return
      }

      const data = await res.json()
      setSuggestedTags(data.tags || [])
    } catch (error) {
      setSuggestedTags([])
      alert(`Error getting tag suggestions: ${error instanceof Error ? error.message : String(error)}`)
    } finally {
      setTagsLoading(false)
    }
  }

  const insertSnippet = (snippet: Snippet) => {
    const newItem: CompositionItem = {
      id: `comp-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      snippetId: snippet.id,
      snippetName: snippet.name,
      snippetContent: snippet.content,
      order: composition.length,
    }
    setComposition([...composition, newItem])
  }

  const removeFromComposition = (itemId: string) => {
    const updated = composition.filter(item => item.id !== itemId)
    setComposition(updated.map((item, idx) => ({ ...item, order: idx })))
  }

  const moveCompositionItem = (fromIndex: number, direction: 'up' | 'down') => {
    const toIndex = direction === 'up' ? fromIndex - 1 : fromIndex + 1
    if (toIndex < 0 || toIndex >= composition.length) return

    const newComp = [...composition]
    const [item] = newComp.splice(fromIndex, 1)
    newComp.splice(toIndex, 0, item)
    setComposition(newComp.map((item, idx) => ({ ...item, order: idx })))
  }

  const compileFromComposition = (): string => {
    if (composition.length === 0) return promptContent
    return composition.map(item => item.snippetContent).join('\n\n')
  }

  const handleCompositionDragStart = (itemId: string) => {
    setDraggedItemId(itemId)
  }

  const handleCompositionDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleCompositionDrop = (targetItemId: string, e: React.DragEvent) => {
    e.preventDefault()
    if (!draggedItemId || draggedItemId === targetItemId) {
      setDraggedItemId(null)
      return
    }

    const draggedIndex = composition.findIndex(item => item.id === draggedItemId)
    const targetIndex = composition.findIndex(item => item.id === targetItemId)

    if (draggedIndex === -1 || targetIndex === -1) {
      setDraggedItemId(null)
      return
    }

    const newComp = [...composition]
    const [item] = newComp.splice(draggedIndex, 1)
    newComp.splice(targetIndex, 0, item)
    setComposition(newComp.map((item, idx) => ({ ...item, order: idx })))
    setDraggedItemId(null)
  }

  const handleCompositionDragEnd = () => {
    setDraggedItemId(null)
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
    try {
      const key = varSetsKey()
      localStorage.setItem(key, JSON.stringify(sets))
      console.log(`[Variable Sets] Persisted ${sets.length} sets to key: ${key}`)
    } catch (err) {
      console.error('[Variable Sets] Failed to persist:', err)
    }
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

  // Fine-grained diff: character-level changes within lines
  const calculateFineDiff = (oldText: string, newText: string) => {
    const oldLines = oldText.split('\n')
    const newLines = newText.split('\n')
    const maxLength = Math.max(oldLines.length, newLines.length)
    const diffs: Array<{ type: 'add' | 'remove' | 'common' | 'modified'; line: string; chunks?: Array<{ type: string; text: string }> }> = []

    for (let i = 0; i < maxLength; i++) {
      const oldLine = oldLines[i]
      const newLine = newLines[i]

      if (oldLine === newLine) {
        if (oldLine !== undefined) {
          diffs.push({ type: 'common', line: oldLine })
        }
      } else if (oldLine !== undefined && newLine !== undefined) {
        // Both exist but differ - show character-level diff within the line
        diffs.push({ type: 'modified', line: newLine, chunks: getCharDiffs(oldLine, newLine) })
      } else {
        // One is added, one is removed
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

  // Character-level diff helper
  const getCharDiffs = (oldStr: string, newStr: string): Array<{ type: string; text: string }> => {
    const chunks: Array<{ type: string; text: string }> = []
    let oldIdx = 0, newIdx = 0

    while (oldIdx < oldStr.length || newIdx < newStr.length) {
      if (oldStr[oldIdx] === newStr[newIdx]) {
        chunks.push({ type: 'common', text: oldStr[oldIdx] || '' })
        oldIdx++
        newIdx++
      } else {
        let removed = '', added = ''
        while (oldIdx < oldStr.length && oldStr[oldIdx] !== newStr[newIdx]) {
          removed += oldStr[oldIdx]
          oldIdx++
        }
        while (newIdx < newStr.length && oldStr[oldIdx] !== newStr[newIdx]) {
          added += newStr[newIdx]
          newIdx++
        }
        if (removed) chunks.push({ type: 'remove', text: removed })
        if (added) chunks.push({ type: 'add', text: added })
      }
    }
    return chunks
  }

  const calculateDiff = calculateFineDiff

  // Rollback to a previous version
  const handleRollback = async (version: PromptVersion) => {
    if (!confirm(`Restore this prompt to v${version.version_number}?`)) return

    if (!loadedPromptId) {
      alert('Prompt ID not found')
      return
    }

    try {
      const token = localStorage.getItem('auth-token')
      const res = await fetch(API_ENDPOINTS.prompts.rollback(loadedPromptId), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          version_id: version.id,
        }),
      })

      if (!res.ok) {
        const error = await res.json()
        alert(`Rollback failed: ${error.error || 'Unknown error'}`)
        return
      }

      // Load the restored version
      setPromptContent(version.template_body)
      setSelectedVersionForView(version)
      alert(`Restored to v${version.version_number}`)

      // Reload prompt to get updated versions list
      if (loadedPromptId) loadPrompt(loadedPromptId)
    } catch (error) {
      alert(`Error rolling back: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // Export version as file
  const handleExportVersion = (version: PromptVersion) => {
    const data = {
      name: promptName,
      version_number: version.version_number,
      created_at: version.created_at,
      template_body: version.template_body,
      config: version.config,
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${promptName}-v${version.version_number}.json`
    a.click()
    URL.revokeObjectURL(url)
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

    if (!loadedPromptId) {
      alert('Please save the prompt first to get suggestions')
      return
    }

    setSuggestionsLoading(true)
    try {
      const token = localStorage.getItem('auth-token')

      // Use the prompt suggestions endpoint - GET request
      const res = await fetch(API_ENDPOINTS.prompts.suggestions(loadedPromptId), {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (!res.ok) {
        const error = await res.json()
        setSuggestions(`Error: ${error.error || 'Failed to get suggestions'}`)
        return
      }

      const data = await res.json()
      setSuggestions(JSON.stringify(data.suggestions, null, 2))
    } catch (error) {
      setSuggestions(`Error getting suggestions: ${error instanceof Error ? error.message : String(error)}`)
    } finally {
      setSuggestionsLoading(false)
    }
  }

  const savePrompt = async () => {
    if (!promptName.trim() || !promptContent.trim()) {
      setSaveStatus('error')
      setSaveMessage('Please enter a prompt name and content')
      setTimeout(() => setSaveStatus('idle'), 3000)
      return
    }

    setSaveStatus('saving')
    setSaveMessage('Saving...')

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
          setSaveStatus('error')
          setSaveMessage(`Error: ${error.detail || 'Failed to update'}`)
          setTimeout(() => setSaveStatus('idle'), 3000)
          return
        }

        setSaveStatus('saved')
        setSaveMessage('Saved successfully!')
        setTimeout(() => setSaveStatus('idle'), 2000)

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
          setSaveStatus('error')
          setSaveMessage(typeof errorMsg === 'string' ? errorMsg : 'Failed to save')
          setTimeout(() => setSaveStatus('idle'), 3000)
          return
        }

        const newPromptData = await createRes.json()
        setSaveStatus('saved')
        setSaveMessage('Created successfully!')
        setTimeout(() => setSaveStatus('idle'), 2000)

        // Capture the version ID for testing
        if (newPromptData.latest_version?.id) {
          setCurrentPromptVersionId(newPromptData.latest_version.id)
          setLoadedPromptId(newPromptData.id)
        }

        // Refresh prompts list
        await fetchAvailablePrompts()
      }
    } catch (error) {
      setSaveStatus('error')
      setSaveMessage(`Error: ${error instanceof Error ? error.message : 'Failed to save'}`)
      console.error('Save error:', error)
      setTimeout(() => setSaveStatus('idle'), 3000)
    }
  }

  return (
    <div style={{ padding: '1.5rem', paddingBottom: '6rem' }}>
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
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <label style={{ fontWeight: '600' }}>
                {loadedPromptId ? '📂 Editing' : '📂 Load Prompt'}
              </label>
              {loadedPromptId && (
                <button
                  onClick={toggleFavorite}
                  disabled={favoriteLoading}
                  style={{
                    padding: '0.25rem 0.5rem',
                    backgroundColor: 'transparent',
                    border: 'none',
                    cursor: favoriteLoading ? 'not-allowed' : 'pointer',
                    fontSize: '1.1rem',
                    opacity: favoriteLoading ? 0.5 : 1,
                    transition: 'transform 0.2s ease',
                    lineHeight: 1,
                  }}
                  title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                >
                  {isFavorite ? '★' : '☆'}
                </button>
              )}
            </div>
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
            <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem', fontWeight: '600' }}>
              <span>Prompt Content</span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(promptContent)
                  setContentCopied(true)
                  setTimeout(() => setContentCopied(false), 2000)
                }}
                title="Copy prompt content"
                style={{
                  background: 'none',
                  border: '1px solid var(--color-border)',
                  borderRadius: '0.375rem',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  color: contentCopied ? 'var(--color-success)' : 'var(--color-foregroundAlt)',
                  padding: '0.25rem 0.5rem',
                  transition: 'all 0.2s ease',
                  lineHeight: 1,
                }}
              >
                {contentCopied ? '✓' : '⎘'}
              </button>
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
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {setUpdateFeedback && (
                    <div style={{
                      padding: '0.5rem 0.75rem',
                      fontSize: '0.7rem',
                      backgroundColor: 'rgba(142, 192, 124, 0.2)',
                      border: '1px solid #8ec07c',
                      borderRadius: '0.25rem',
                      color: '#8ec07c',
                      textAlign: 'center',
                    }}>
                      ✓ Changes saved to localStorage
                    </div>
                  )}
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
                </div>
              ) : (
                <p style={{ fontSize: '0.75rem', color: 'var(--color-foregroundAlt)', fontStyle: 'italic' }}>
                  No saved sets yet
                </p>
              )}
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
                {userTier !== 'free' && (
                  <span style={{ fontSize: '0.7rem', marginLeft: '0.5rem', padding: '0.1rem 0.4rem', borderRadius: '0.2rem', backgroundColor: 'var(--color-accent)', color: '#1d2021' }}>
                    {userTier}
                  </span>
                )}
              </label>
              <select
                value={loadedPromptModel}
                onChange={(e) => setLoadedPromptModel(e.target.value)}
                className="input"
                style={{ width: '100%', fontSize: '0.875rem' }}
                disabled={modelsLoading || availableModels.length === 0}
              >
                {modelsLoading ? (
                  <option>Loading models...</option>
                ) : availableModels.length === 0 ? (
                  <option>No models available</option>
                ) : (
                  availableModels.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}{m.parameter_size ? ` (${m.parameter_size})` : ''}
                      {m.cost_estimate ? ` — ${m.cost_estimate}` : ''}
                    </option>
                  ))
                )}
              </select>
              {userTier === 'free' && availableModels.some((m) => m.tier_required !== 'free') === false && availableModels.length > 0 && (
                <p style={{ fontSize: '0.75rem', color: 'var(--color-foregroundAlt)', marginTop: '0.25rem', marginBottom: 0 }}>
                  💡 Upgrade to Pro to unlock more powerful models
                </p>
              )}
            </div>
          </div>

          {/* Mobile-only metadata summary */}
          <div className="mobile-only card" style={{ backgroundColor: 'var(--color-backgroundAlt)' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--color-foregroundAlt)' }}>📊</span>
              {tags.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                  {tags.slice(0, 3).map((tag) => (
                    <span key={tag} style={{ padding: '0.15rem 0.5rem', backgroundColor: 'var(--color-accent)', color: 'var(--color-background)', borderRadius: '0.2rem', fontSize: '0.7rem', fontWeight: '500' }}>
                      {tag}
                    </span>
                  ))}
                  {tags.length > 3 && <span style={{ fontSize: '0.7rem', color: 'var(--color-foregroundAlt)' }}>+{tags.length - 3}</span>}
                </div>
              )}
              {selectedInteractionTypeId && (
                <span style={{ fontSize: '0.75rem', color: 'var(--color-foreground)' }}>
                  {interactionTypes.find(t => t.id === selectedInteractionTypeId)?.emoji} {interactionTypes.find(t => t.id === selectedInteractionTypeId)?.name}
                </span>
              )}
              {selectedCategoryId && (
                <span style={{ fontSize: '0.75rem', color: 'var(--color-foreground)' }}>
                  {categories.find(c => c.id === selectedCategoryId)?.name}
                </span>
              )}
              <span style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: 'var(--color-foregroundAlt)' }}>
                {loadedPromptModel || 'No model'}
              </span>
            </div>
          </div>

          {/* Save Feedback Toast */}
          {saveStatus !== 'idle' && (
            <div style={{
              padding: '1rem',
              borderRadius: '0.5rem',
              backgroundColor:
                saveStatus === 'saving' ? 'rgba(184, 187, 38, 0.2)' :
                saveStatus === 'saved' ? 'rgba(142, 192, 124, 0.2)' :
                'rgba(204, 36, 29, 0.2)',
              border: `1px solid ${
                saveStatus === 'saving' ? '#b8bb26' :
                saveStatus === 'saved' ? '#8ec07c' :
                '#cc241d'
              }`,
              color:
                saveStatus === 'saving' ? '#b8bb26' :
                saveStatus === 'saved' ? '#8ec07c' :
                '#cc241d',
              fontSize: '0.875rem',
              fontWeight: '500',
            }}>
              {saveStatus === 'saving' && '⏳ ' }
              {saveStatus === 'saved' && '✓ ' }
              {saveStatus === 'error' && '✗ ' }
              {saveMessage}
            </div>
          )}

          <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem', marginBottom: '0' }}>
            <button
              onClick={savePrompt}
              disabled={saveStatus === 'saving'}
              style={{
                padding: '0.5rem 1.25rem',
                backgroundColor: 'var(--color-accent)',
                color: 'var(--color-background)',
                border: 'none',
                borderRadius: '0.5rem',
                fontSize: '0.85rem',
                fontWeight: '700',
                cursor: saveStatus === 'saving' ? 'not-allowed' : 'pointer',
                opacity: saveStatus === 'saving' ? 0.6 : 1,
                transition: 'opacity 0.2s',
              }}
            >
              {saveStatus === 'saving' ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>

        {/* Right Sidebar */}
        <aside style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Current Metadata (desktop sidebar, mobile main) */}
          <div className="card sidebar-only" style={{ backgroundColor: 'var(--color-backgroundAlt)' }}>
            <label style={{ display: 'block', marginBottom: '0.75rem', fontWeight: '600' }}>
              📊 Metadata
            </label>

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

            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: '500', color: 'var(--color-foregroundAlt)', marginBottom: '0.25rem', textTransform: 'uppercase' }}>
                Model
              </div>
              <div style={{ fontSize: '0.875rem', color: 'var(--color-foreground)', fontFamily: 'monospace' }}>
                {loadedPromptModel || 'Not set'}
              </div>
            </div>
          </div>

          {/* Mobile Section Tabs */}
          <div className="mobile-section-tabs" style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--color-border)' }}>
            {[
              { id: 'refine', label: '💡 Refine' },
              { id: 'composition', label: '🧩 Compose' },
              { id: 'snippets', label: '📚 Snippets' },
              { id: 'versions', label: '📜 Versions' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveMobileSection(tab.id)}
                style={{
                  padding: '6px 10px',
                  minHeight: '32px',
                  backgroundColor: activeMobileSection === tab.id ? 'var(--color-accent)' : 'var(--color-background)',
                  color: activeMobileSection === tab.id ? 'var(--color-background)' : 'var(--color-foreground)',
                  border: `1px solid ${activeMobileSection === tab.id ? 'var(--color-accent)' : 'var(--color-border)'}`,
                  borderRadius: '0.375rem',
                  cursor: 'pointer',
                  fontSize: '0.7rem',
                  fontWeight: '600',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s',
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

          {/* Composition Panel */}
          <div className={`card${activeMobileSection !== 'composition' ? ' mobile-section-hidden' : ''}`}>
            <h3 style={{ fontWeight: '600', marginBottom: '1rem', fontSize: '0.95rem' }}>
              🧩 Composition
            </h3>
            {composition.length === 0 ? (
              <p style={{ fontSize: '0.875rem', color: 'var(--color-foregroundAlt)' }}>
                No snippets in composition yet. Add snippets from the Snippets panel.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {/* Composition Items */}
                {composition.map((item, index) => (
                  <div
                    key={item.id}
                    draggable
                    onDragStart={() => handleCompositionDragStart(item.id)}
                    onDragOver={handleCompositionDragOver}
                    onDrop={(e) => handleCompositionDrop(item.id, e)}
                    onDragEnd={handleCompositionDragEnd}
                    style={{
                      padding: '0.75rem',
                      backgroundColor: draggedItemId === item.id ? 'var(--color-surface)' : 'var(--color-background)',
                      border: draggedItemId === item.id ? '2px dashed var(--color-accent)' : '1px solid var(--color-border)',
                      borderRadius: '0.5rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      justifyContent: 'space-between',
                      cursor: 'grab',
                      opacity: draggedItemId === item.id ? 0.6 : 1,
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: '0', fontWeight: '500', fontSize: '0.875rem', color: 'var(--color-foreground)' }}>
                        ⋮⋮ {index + 1}. {item.snippetName}
                      </p>
                      <p style={{ margin: '0.25rem 0 0', fontSize: '0.75rem', color: 'var(--color-foregroundAlt)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {item.snippetContent.substring(0, 50)}...
                      </p>
                    </div>
                    <button
                      onClick={() => removeFromComposition(item.id)}
                      style={{
                        padding: '0.25rem 0.5rem',
                        fontSize: '0.75rem',
                        backgroundColor: 'rgba(204, 36, 29, 0.2)',
                        border: '1px solid #cc241d',
                        borderRadius: '0.25rem',
                        cursor: 'pointer',
                        color: '#cc241d',
                      }}
                      title="Remove"
                    >
                      ✕
                    </button>
                  </div>
                ))}

                {/* Live Preview */}
                <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid var(--color-border)' }}>
                  <p style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--color-foregroundAlt)', marginBottom: '0.5rem' }}>
                    Preview (Prompt + Composed Snippets):
                  </p>
                  <div style={{
                    fontSize: '0.7rem',
                    backgroundColor: 'var(--color-backgroundAlt)',
                    padding: '0.5rem',
                    borderRadius: '0.25rem',
                    maxHeight: '200px',
                    overflow: 'auto',
                    color: 'var(--color-foregroundAlt)',
                    fontFamily: 'monospace',
                    whiteSpace: 'pre-wrap',
                    wordWrap: 'break-word',
                  }}>
                    {/* Show prompt content with composition context */}
                    <div style={{ marginBottom: '0.5rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--color-border)' }}>
                      <span style={{ color: 'var(--color-accent)', fontWeight: '600' }}>PROMPT:\n</span>
                      {promptContent.substring(0, 150)}
                      {promptContent.length > 150 ? '...' : ''}
                    </div>

                    {/* Show composed snippets */}
                    {composition.length > 0 && (
                      <div>
                        <span style={{ color: 'var(--color-accent)', fontWeight: '600' }}>COMPOSITION:\n</span>
                        {compileFromComposition().substring(0, 200)}
                        {compileFromComposition().length > 200 ? '...' : ''}
                      </div>
                    )}
                  </div>
                </div>

                {/* Clear Button */}
                <button
                  onClick={() => setComposition([])}
                  style={{
                    padding: '0.5rem',
                    backgroundColor: 'rgba(204, 36, 29, 0.2)',
                    border: '1px solid #cc241d',
                    borderRadius: '0.5rem',
                    cursor: 'pointer',
                    color: '#cc241d',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                  }}
                >
                  🗑️ Clear Composition
                </button>
              </div>
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
                {/* Search Input */}
                <input
                  type="text"
                  placeholder="Search snippets..."
                  value={snippetSearch}
                  onChange={(e) => setSnippetSearch(e.target.value)}
                  className="input"
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    fontSize: '0.875rem',
                    marginBottom: '0.5rem',
                  }}
                />

                {/* Filtered Snippets */}
                {(() => {
                  const filtered = snippets.filter(s =>
                    s.name.toLowerCase().includes(snippetSearch.toLowerCase())
                  )

                  return (
                    <>
                      <p style={{ fontSize: '0.75rem', color: 'var(--color-foregroundAlt)', margin: '0' }}>
                        {filtered.length} of {snippets.length} snippets
                      </p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '300px', overflowY: 'auto' }}>
                        {filtered.length === 0 ? (
                          <p style={{ fontSize: '0.875rem', color: 'var(--color-foregroundAlt)', textAlign: 'center' }}>
                            No matching snippets
                          </p>
                        ) : (
                          filtered.map((snippet) => (
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
                          ))
                        )}
                      </div>
                    </>
                  )
                })()}
              </div>
            )}
          </div>

          {/* Version History Panel */}
          <div className={`card${activeMobileSection !== 'versions' ? ' mobile-section-hidden' : ''}`}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <h3 style={{ fontWeight: '600', fontSize: '0.95rem', margin: 0 }}>
                📜 Versions
              </h3>
              <button
                onClick={() => setShowVersionHistory(!showVersionHistory)}
                style={{
                  padding: '0.25rem 0.5rem',
                  backgroundColor: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '0.75rem',
                  color: 'var(--color-accent)',
                }}
              >
                {showVersionHistory ? '▼' : '▶'}
              </button>
            </div>

            {showVersionHistory && (
              <div>
                <p style={{ fontSize: '0.75rem', color: 'var(--color-foregroundAlt)', marginBottom: '0.75rem' }}>
                  Save your prompt first to track version history and compare versions
                </p>

                {versions.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {/* Version List */}
                    <div style={{ marginBottom: '0.75rem' }}>
                      <p style={{ fontSize: '0.65rem', fontWeight: '600', color: 'var(--color-foregroundAlt)', marginBottom: '0.375rem' }}>
                        Available Versions
                      </p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem', maxHeight: '150px', overflowY: 'auto' }}>
                        {versions.map((v) => (
                          <button
                            key={v.id}
                            onClick={() => {
                              setSelectedVersionForView(v)
                              setCompareVersionForDiff(null)
                              setShowDiffView(false)
                            }}
                            style={{
                              padding: '0.375rem 0.5rem',
                              backgroundColor: selectedVersionForView?.id === v.id ? 'var(--color-accent)' : 'var(--color-background)',
                              border: `1px solid ${selectedVersionForView?.id === v.id ? 'var(--color-accent)' : 'var(--color-border)'}`,
                              borderRadius: '0.25rem',
                              cursor: 'pointer',
                              fontSize: '0.65rem',
                              textAlign: 'left',
                              color: selectedVersionForView?.id === v.id ? 'var(--color-background)' : 'var(--color-foreground)',
                              fontWeight: selectedVersionForView?.id === v.id ? '600' : '400',
                              transition: 'all 0.2s ease',
                            }}
                          >
                            <div>v{v.version_number}</div>
                            <div style={{ fontSize: '0.6rem', opacity: 0.8 }}>
                              {new Date(v.created_at).toLocaleDateString()}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Diff Controls */}
                    {selectedVersionForView && (
                      <>
                        <button
                          onClick={() => setShowDiffView(!showDiffView)}
                          style={{
                            padding: '0.375rem 0.5rem',
                            backgroundColor: showDiffView ? 'var(--color-accent)' : 'transparent',
                            border: `1px solid ${showDiffView ? 'var(--color-accent)' : 'var(--color-border)'}`,
                            borderRadius: '0.25rem',
                            cursor: 'pointer',
                            fontSize: '0.65rem',
                            color: showDiffView ? 'var(--color-background)' : 'var(--color-foreground)',
                            fontWeight: '500',
                            width: '100%',
                          }}
                        >
                          {showDiffView ? '✓ Diff On' : 'Compare Versions'}
                        </button>

                        {showDiffView && (
                          <div>
                            <p style={{ fontSize: '0.65rem', fontWeight: '600', color: 'var(--color-foregroundAlt)', marginBottom: '0.375rem' }}>
                              Compare to
                            </p>
                            <select
                              value={compareVersionForDiff?.id || ''}
                              onChange={(e) => {
                                const v = versions.find(ver => ver.id === e.target.value)
                                setCompareVersionForDiff(v || null)
                              }}
                              style={{
                                width: '100%',
                                padding: '0.375rem',
                                fontSize: '0.65rem',
                                borderRadius: '0.25rem',
                                border: '1px solid var(--color-border)',
                                backgroundColor: 'var(--color-background)',
                                color: 'var(--color-foreground)',
                              }}
                            >
                              <option value="">Select version...</option>
                              {versions
                                .filter(v => v.id !== selectedVersionForView?.id)
                                .map((v) => (
                                  <option key={v.id} value={v.id}>
                                    v{v.version_number} - {new Date(v.created_at).toLocaleDateString()}
                                  </option>
                                ))}
                            </select>
                          </div>
                        )}

                        {/* Diff View */}
                        {showDiffView && compareVersionForDiff && selectedVersionForView && (
                          <div style={{ marginTop: '0.75rem', maxHeight: '300px', overflowY: 'auto' }}>
                            <p style={{ fontSize: '0.65rem', fontWeight: '600', color: 'var(--color-foregroundAlt)', marginBottom: '0.375rem' }}>
                              Changes
                            </p>
                            <div
                              style={{
                                backgroundColor: 'var(--color-background)',
                                border: '1px solid var(--color-border)',
                                borderRadius: '0.25rem',
                                padding: '0.5rem',
                                fontSize: '0.6rem',
                                fontFamily: 'monospace',
                                whiteSpace: 'pre-wrap',
                                wordBreak: 'break-word',
                              }}
                            >
                              {calculateDiff(compareVersionForDiff.template_body, selectedVersionForView.template_body).map((diff, idx) => (
                                <div
                                  key={idx}
                                  style={{
                                    backgroundColor:
                                      diff.type === 'add'
                                        ? 'rgba(142, 192, 124, 0.2)'
                                        : diff.type === 'remove'
                                          ? 'rgba(204, 36, 29, 0.2)'
                                          : diff.type === 'modified'
                                            ? 'rgba(184, 187, 38, 0.1)'
                                            : 'transparent',
                                    padding: '0.125rem 0.25rem',
                                    display: 'block',
                                  }}
                                >
                                  {diff.type === 'modified' && diff.chunks ? (
                                    <span>
                                      ~ {' '}
                                      {diff.chunks.map((chunk, chunkIdx) => (
                                        <span
                                          key={chunkIdx}
                                          style={{
                                            backgroundColor:
                                              chunk.type === 'add'
                                                ? 'rgba(142, 192, 124, 0.4)'
                                                : chunk.type === 'remove'
                                                  ? 'rgba(204, 36, 29, 0.4)'
                                                  : 'transparent',
                                            color:
                                              chunk.type === 'add'
                                                ? '#8ec07c'
                                                : chunk.type === 'remove'
                                                  ? '#cc241d'
                                                  : 'inherit',
                                            textDecoration:
                                              chunk.type === 'remove'
                                                ? 'line-through'
                                                : 'none',
                                          }}
                                        >
                                          {chunk.text}
                                        </span>
                                      ))}
                                    </span>
                                  ) : (
                                    <span style={{
                                      color:
                                        diff.type === 'add'
                                          ? '#8ec07c'
                                          : diff.type === 'remove'
                                            ? '#cc241d'
                                            : 'inherit',
                                    }}>
                                      {diff.type === 'add' && '+ '}
                                      {diff.type === 'remove' && '- '}
                                      {diff.line}
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* View Version Button */}
                        <button
                          onClick={() => {
                            setPromptContent(selectedVersionForView.template_body)
                          }}
                          style={{
                            padding: '0.375rem 0.5rem',
                            backgroundColor: 'var(--color-background)',
                            border: '1px solid var(--color-accent)',
                            borderRadius: '0.25rem',
                            cursor: 'pointer',
                            fontSize: '0.65rem',
                            color: 'var(--color-accent)',
                            fontWeight: '500',
                            width: '100%',
                            marginTop: '0.375rem',
                          }}
                        >
                          Load into Editor
                        </button>

                        {/* Rollback Button */}
                        <button
                          onClick={() => handleRollback(selectedVersionForView)}
                          style={{
                            padding: '0.375rem 0.5rem',
                            backgroundColor: 'var(--color-background)',
                            border: '1px solid rgba(204, 36, 29, 0.5)',
                            borderRadius: '0.25rem',
                            cursor: 'pointer',
                            fontSize: '0.65rem',
                            color: '#cc241d',
                            fontWeight: '500',
                            width: '100%',
                            marginTop: '0.375rem',
                          }}
                        >
                          ↺ Rollback to v{selectedVersionForView.version_number}
                        </button>

                        {/* Export Button */}
                        <button
                          onClick={() => handleExportVersion(selectedVersionForView)}
                          style={{
                            padding: '0.375rem 0.5rem',
                            backgroundColor: 'var(--color-background)',
                            border: '1px solid rgba(142, 192, 124, 0.5)',
                            borderRadius: '0.25rem',
                            cursor: 'pointer',
                            fontSize: '0.65rem',
                            color: '#8ec07c',
                            fontWeight: '500',
                            width: '100%',
                            marginTop: '0.375rem',
                          }}
                        >
                          ↓ Export as JSON
                        </button>
                      </>
                    )}
                  </div>
                ) : (
                  <p style={{ fontSize: '0.7rem', color: 'var(--color-foregroundAlt)' }}>
                    No versions yet
                  </p>
                )}
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  )
}
