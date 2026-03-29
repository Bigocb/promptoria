'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Plus, Edit2, Trash2, Copy, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

type Snippet = {
  id: string
  name: string
  description: string
  content: string
  version: number
  createdAt: string
}

export default function SnippetsPage() {
  const [snippets, setSnippets] = useState<Snippet[]>([])
  const [isCreating, setIsCreating] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    content: '',
  })

  const handleCreateOrUpdate = () => {
    if (!formData.name || !formData.content) {
      alert('Name and content are required')
      return
    }

    if (editingId) {
      setSnippets(
        snippets.map((s) =>
          s.id === editingId
            ? {
                ...s,
                ...formData,
                version: s.version + 1,
              }
            : s
        )
      )
      setEditingId(null)
    } else {
      const newSnippet: Snippet = {
        id: Math.random().toString(36).substr(2, 9),
        ...formData,
        version: 1,
        createdAt: new Date().toISOString(),
      }
      setSnippets([...snippets, newSnippet])
    }

    setFormData({ name: '', description: '', content: '' })
    setIsCreating(false)
  }

  const handleEdit = (snippet: Snippet) => {
    setFormData({
      name: snippet.name,
      description: snippet.description,
      content: snippet.content,
    })
    setEditingId(snippet.id)
    setIsCreating(true)
  }

  const handleDelete = (id: string) => {
    if (confirm('Are you sure?')) {
      setSnippets(snippets.filter((s) => s.id !== id))
    }
  }

  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content)
    alert('Copied to clipboard!')
  }

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <header className="border-b border-slate-700 bg-slate-800/50 backdrop-blur">
        <div className="container mx-auto px-4 py-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-white">Snippet Library</h1>
              <p className="text-slate-400">Manage reusable text blocks</p>
            </div>
          </div>
          <Button onClick={() => setIsCreating(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            New Snippet
          </Button>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-4 py-8">
        {isCreating && (
          <Card className="mb-8 bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">
                {editingId ? 'Edit Snippet' : 'Create New Snippet'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name" className="text-white">
                  Name
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="e.g., Brand Voice"
                  className="mt-2 bg-slate-700 border-slate-600 text-white"
                />
              </div>

              <div>
                <Label htmlFor="description" className="text-white">
                  Description (optional)
                </Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="What is this snippet for?"
                  className="mt-2 bg-slate-700 border-slate-600 text-white"
                />
              </div>

              <div>
                <Label htmlFor="content" className="text-white">
                  Content
                </Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) =>
                    setFormData({ ...formData, content: e.target.value })
                  }
                  placeholder="Enter the snippet content..."
                  className="mt-2 bg-slate-700 border-slate-600 text-white min-h-32"
                />
              </div>

              <div className="flex gap-2">
                <Button onClick={handleCreateOrUpdate}>
                  {editingId ? 'Update' : 'Create'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsCreating(false)
                    setEditingId(null)
                    setFormData({ name: '', description: '', content: '' })
                  }}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Snippets Grid */}
        <div className="grid gap-4">
          {snippets.length === 0 ? (
            <Card className="bg-slate-800 border-slate-700">
              <CardContent className="pt-6 text-center">
                <p className="text-slate-400">No snippets yet. Create one to get started!</p>
              </CardContent>
            </Card>
          ) : (
            snippets.map((snippet) => (
              <Card key={snippet.id} className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-white">{snippet.name}</CardTitle>
                      {snippet.description && (
                        <p className="text-sm text-slate-400 mt-1">
                          {snippet.description}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleEdit(snippet)}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleCopy(snippet.content)}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleDelete(snippet.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <pre className="bg-slate-900 p-4 rounded text-slate-200 text-sm overflow-auto max-h-48">
                    {snippet.content}
                  </pre>
                  <p className="text-xs text-slate-500 mt-2">
                    v{snippet.version} • {new Date(snippet.createdAt).toLocaleDateString()}
                  </p>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </main>
    </div>
  )
}
