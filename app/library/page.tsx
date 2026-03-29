'use client'

import { useState } from 'react'
import { Plus, Search, Filter, Copy, Heart, Share2, Download, Upload, Trash2, Edit2, ChevronDown, Star, Clock, TrendingUp } from 'lucide-react'

type LibraryItem = {
  id: string
  type: 'prompt' | 'skill' | 'instruction' | 'template' | 'snippet'
  name: string
  description: string
  category: string
  content: string
  tags: string[]
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  use_count: number
  rating: number
  last_used: string
  created_by: string
  instructions?: string
  example_output?: string
}

const MOCK_LIBRARY: LibraryItem[] = [
  {
    id: '1',
    type: 'prompt',
    name: 'E-commerce Product Description',
    description: 'Generate compelling product descriptions for e-commerce listings',
    category: 'marketing',
    content: 'You are a professional product writer. Create a compelling product description for {{product_name}}. Features: {{features}}. Price: {{price}}. Keep it under 150 words.',
    tags: ['ecommerce', 'sales', 'seo'],
    difficulty: 'intermediate',
    use_count: 247,
    rating: 4.8,
    last_used: '2 hours ago',
    created_by: 'john@example.com',
    example_output: 'Premium Wireless Headphones deliver studio-quality audio wherever you go...',
  },
  {
    id: '2',
    type: 'skill',
    name: 'Brand Voice Consistency',
    description: 'Maintain consistent brand voice across all content',
    category: 'content',
    content: 'You are a content writer who maintains brand voice consistency. Key principles: {{principles}}. Apply these consistently to all outputs.',
    tags: ['branding', 'consistency', 'voice'],
    difficulty: 'beginner',
    use_count: 156,
    rating: 4.9,
    last_used: '1 day ago',
    created_by: 'sarah@example.com',
  },
  {
    id: '3',
    type: 'instruction',
    name: 'SEO-Optimized Content Guidelines',
    description: 'Step-by-step instructions for SEO-optimized content creation',
    category: 'seo',
    content: '1. Keyword research: Find 3-5 relevant keywords\n2. Include keywords naturally\n3. Write compelling meta descriptions\n4. Use headers for structure\n5. Include internal links',
    tags: ['seo', 'content', 'marketing'],
    difficulty: 'intermediate',
    use_count: 312,
    rating: 4.7,
    last_used: '3 hours ago',
    created_by: 'mike@example.com',
    instructions: 'Follow these steps in order for best results.',
  },
  {
    id: '4',
    type: 'template',
    name: 'Email Marketing Template',
    description: 'Template for creating engaging marketing emails',
    category: 'email',
    content: 'Subject: {{subject}}\n\nHi {{first_name}},\n\n{{body}}\n\nBest regards,\n{{company_name}}',
    tags: ['email', 'marketing', 'templates'],
    difficulty: 'beginner',
    use_count: 89,
    rating: 4.5,
    last_used: '1 week ago',
    created_by: 'team@example.com',
  },
  {
    id: '5',
    type: 'prompt',
    name: 'Code Review Assistant',
    description: 'Review code and provide constructive feedback',
    category: 'technical',
    content: 'You are an expert code reviewer. Review the following code: {{code}}. Provide feedback on: readability, performance, security, and best practices.',
    tags: ['code', 'review', 'technical'],
    difficulty: 'advanced',
    use_count: 534,
    rating: 4.9,
    last_used: '30 mins ago',
    created_by: 'dev-team@example.com',
  },
]

const CATEGORIES = ['All', 'marketing', 'content', 'seo', 'email', 'technical', 'social']
const TYPES = ['All', 'prompt', 'skill', 'instruction', 'template', 'snippet']
const DIFFICULTIES = ['All', 'beginner', 'intermediate', 'advanced']

export default function LibraryPage() {
  const [items, setItems] = useState<LibraryItem[]>(MOCK_LIBRARY)
  const [selectedItem, setSelectedItem] = useState<LibraryItem | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('All')
  const [typeFilter, setTypeFilter] = useState('All')
  const [difficultyFilter, setDifficultyFilter] = useState('All')
  const [sortBy, setSortBy] = useState<'recent' | 'popular' | 'rated'>('popular')
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [showFilters, setShowFilters] = useState(false)

  const filteredItems = items.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))

    const matchesCategory = categoryFilter === 'All' || item.category === categoryFilter
    const matchesType = typeFilter === 'All' || item.type === typeFilter
    const matchesDifficulty = difficultyFilter === 'All' || item.difficulty === difficultyFilter

    return matchesSearch && matchesCategory && matchesType && matchesDifficulty
  })

  const sortedItems = [...filteredItems].sort((a, b) => {
    if (sortBy === 'recent') {
      return new Date(b.last_used).getTime() - new Date(a.last_used).getTime()
    } else if (sortBy === 'popular') {
      return b.use_count - a.use_count
    } else {
      return b.rating - a.rating
    }
  })

  const handleCopy = (content: string, id: string) => {
    navigator.clipboard.writeText(content)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'prompt':
        return 'bg-blue-100 text-blue-800'
      case 'skill':
        return 'bg-purple-100 text-purple-800'
      case 'instruction':
        return 'bg-green-100 text-green-800'
      case 'template':
        return 'bg-orange-100 text-orange-800'
      case 'snippet':
        return 'bg-pink-100 text-pink-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return 'text-green-600'
      case 'intermediate':
        return 'text-yellow-600'
      case 'advanced':
        return 'text-red-600'
      default:
        return 'text-gray-600'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white">
      {/* Header */}
      <header className="border-b border-slate-700 bg-slate-800/50 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-3xl font-bold">Library</h1>
              <p className="text-slate-400 text-sm">Browse and manage your saved prompts, skills, and instructions</p>
            </div>
            <div className="flex gap-2">
              <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium flex items-center gap-2">
                <Plus className="w-4 h-4" />
                New Item
              </button>
              <button className="px-4 py-2 border border-slate-600 hover:bg-slate-700 rounded-lg flex items-center gap-2">
                <Upload className="w-4 h-4" />
                Import
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search by name, description, or tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-700 border border-slate-600 text-white px-4 py-2 pl-10 rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-4 py-2 border border-slate-600 hover:bg-slate-700 rounded-lg flex items-center gap-2"
            >
              <Filter className="w-4 h-4" />
              Filters
            </button>
          </div>

          {/* Filters */}
          {showFilters && (
            <div className="mt-4 grid grid-cols-4 gap-4">
              <div>
                <label className="text-sm text-slate-400 block mb-2">Category</label>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full bg-slate-700 border border-slate-600 text-white px-3 py-2 rounded-lg text-sm"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm text-slate-400 block mb-2">Type</label>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="w-full bg-slate-700 border border-slate-600 text-white px-3 py-2 rounded-lg text-sm"
                >
                  {TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm text-slate-400 block mb-2">Difficulty</label>
                <select
                  value={difficultyFilter}
                  onChange={(e) => setDifficultyFilter(e.target.value)}
                  className="w-full bg-slate-700 border border-slate-600 text-white px-3 py-2 rounded-lg text-sm"
                >
                  {DIFFICULTIES.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm text-slate-400 block mb-2">Sort By</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="w-full bg-slate-700 border border-slate-600 text-white px-3 py-2 rounded-lg text-sm"
                >
                  <option value="popular">Most Used</option>
                  <option value="rated">Highest Rated</option>
                  <option value="recent">Recently Used</option>
                </select>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-3 gap-6">
          {/* List */}
          <div className="col-span-2 space-y-4">
            <div className="flex justify-between items-center mb-4">
              <p className="text-slate-400">
                Found <span className="font-bold text-white">{sortedItems.length}</span> items
              </p>
            </div>

            {sortedItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setSelectedItem(item)}
                className={`w-full text-left p-4 rounded-lg border transition-all ${
                  selectedItem?.id === item.id
                    ? 'bg-blue-900/30 border-blue-500'
                    : 'bg-slate-800 border-slate-700 hover:border-slate-600'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${getTypeColor(item.type)}`}>
                        {item.type}
                      </span>
                      <h3 className="font-bold text-lg">{item.name}</h3>
                    </div>
                    <p className="text-sm text-slate-400">{item.description}</p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1 justify-end">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm font-bold">{item.rating.toFixed(1)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-3">
                  {item.tags.map((tag) => (
                    <span key={tag} className="bg-slate-700 text-slate-200 text-xs px-2 py-1 rounded">
                      {tag}
                    </span>
                  ))}
                </div>

                <div className="flex justify-between items-center text-xs text-slate-500">
                  <div className="flex gap-4">
                    <span className="flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      {item.use_count} uses
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {item.last_used}
                    </span>
                  </div>
                  <span className={`font-medium ${getDifficultyColor(item.difficulty)}`}>
                    {item.difficulty}
                  </span>
                </div>
              </button>
            ))}
          </div>

          {/* Detail Panel */}
          <div>
            {selectedItem ? (
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 sticky top-24">
                <h2 className="text-2xl font-bold mb-2">{selectedItem.name}</h2>
                <p className="text-slate-400 text-sm mb-4">{selectedItem.description}</p>

                <div className="space-y-4 mb-6">
                  <div>
                    <p className="text-xs text-slate-400 uppercase">Category</p>
                    <p className="font-medium">{selectedItem.category}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 uppercase">Created by</p>
                    <p className="font-medium text-sm">{selectedItem.created_by}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 uppercase">Rating</p>
                    <div className="flex items-center gap-2">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${
                            i < Math.floor(selectedItem.rating)
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-slate-600'
                          }`}
                        />
                      ))}
                      <span className="text-sm">({selectedItem.use_count} ratings)</span>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-900 p-4 rounded mb-6 max-h-32 overflow-auto">
                  <p className="text-xs text-slate-400 uppercase mb-2">Content Preview</p>
                  <p className="text-sm text-slate-200 font-mono">{selectedItem.content.substring(0, 150)}...</p>
                </div>

                <div className="space-y-2">
                  <button
                    onClick={() => handleCopy(selectedItem.content, selectedItem.id)}
                    className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium flex items-center justify-center gap-2"
                  >
                    {copiedId === selectedItem.id ? (
                      <>
                        <span>✓</span>
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        Copy to Clipboard
                      </>
                    )}
                  </button>
                  <button className="w-full px-4 py-2 border border-slate-600 hover:bg-slate-700 rounded-lg font-medium flex items-center justify-center gap-2">
                    <Share2 className="w-4 h-4" />
                    Use in Prompt
                  </button>
                  <button className="w-full px-4 py-2 border border-slate-600 hover:bg-slate-700 rounded-lg font-medium flex items-center justify-center gap-2">
                    <Download className="w-4 h-4" />
                    Fork
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 text-center text-slate-400">
                <p>Select an item to view details</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
