'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

type Version = {
  id: string
  promptId: string
  promptName: string
  versionNumber: number
  template_body: string
  changeLog: string
  createdAt: string
  createdBy: string
}

export default function HistoryPage() {
  // Mock data
  const [versions] = useState<Version[]>([
    {
      id: '1',
      promptId: 'p1',
      promptName: 'Product Description Generator',
      versionNumber: 1,
      template_body: 'You are a product writer. Create a description for {{product_name}}.',
      changeLog: 'Initial version',
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      createdBy: 'user@example.com',
    },
    {
      id: '2',
      promptId: 'p1',
      promptName: 'Product Description Generator',
      versionNumber: 2,
      template_body: `You are a professional product writer with expertise in e-commerce. Your task is to create a compelling product description for {{product_name}}.

Requirements:
- Keep it under 150 words
- Highlight key features
- Use persuasive language
- Include a call-to-action`,
      changeLog: 'Added requirements section and improved instructions',
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      createdBy: 'user@example.com',
    },
    {
      id: '3',
      promptId: 'p1',
      promptName: 'Product Description Generator',
      versionNumber: 3,
      template_body: `You are a professional product writer with expertise in {{product_category}}.

Your task is to create a compelling product description for {{product_name}}.

Requirements:
- Keep it under 150 words
- Highlight {{num_features}} key features
- Use persuasive language
- Include a call-to-action

Target audience: {{target_audience}}`,
      changeLog: 'Added dynamic category and feature count, target audience variable',
      createdAt: new Date().toISOString(),
      createdBy: 'user@example.com',
    },
  ])

  const [selectedVersionIds, setSelectedVersionIds] = useState<[string, string] | null>(null)

  const toggleVersionSelection = (versionId: string) => {
    if (selectedVersionIds === null) {
      setSelectedVersionIds([versionId, ''])
    } else if (selectedVersionIds[0] === versionId) {
      setSelectedVersionIds(null)
    } else if (selectedVersionIds[1] === '') {
      setSelectedVersionIds([selectedVersionIds[0], versionId])
    } else {
      setSelectedVersionIds([versionId, ''])
    }
  }

  const selectedVersions = selectedVersionIds
    ? [
        versions.find((v) => v.id === selectedVersionIds[0]),
        versions.find((v) => v.id === selectedVersionIds[1]),
      ].filter(Boolean) as Version[]
    : []

  const getHighlightedDiff = (oldText: string, newText: string) => {
    const oldLines = oldText.split('\n')
    const newLines = newText.split('\n')
    const diffs: { type: 'add' | 'remove' | 'same'; text: string }[] = []

    const maxLines = Math.max(oldLines.length, newLines.length)
    for (let i = 0; i < maxLines; i++) {
      const oldLine = oldLines[i] || ''
      const newLine = newLines[i] || ''

      if (oldLine !== newLine) {
        if (oldLine) diffs.push({ type: 'remove', text: oldLine })
        if (newLine) diffs.push({ type: 'add', text: newLine })
      } else {
        diffs.push({ type: 'same', text: oldLine })
      }
    }

    return diffs
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
              <h1 className="text-3xl font-bold text-white">Version History</h1>
              <p className="text-slate-400">Compare and track prompt versions</p>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-4 py-8">
        {selectedVersions.length === 2 && (
          <Card className="mb-8 bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">
                Diff: {selectedVersions[0].promptName} v{selectedVersions[0].versionNumber}{' '}
                → v{selectedVersions[1].versionNumber}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-slate-400 mb-3">Changes</p>
                  <div className="bg-slate-900 rounded p-4 space-y-1 text-sm font-mono max-h-96 overflow-y-auto">
                    {getHighlightedDiff(
                      selectedVersions[0].template_body,
                      selectedVersions[1].template_body
                    ).map((line, idx) => (
                      <div
                        key={idx}
                        className={`${
                          line.type === 'remove'
                            ? 'bg-red-900 text-red-100'
                            : line.type === 'add'
                            ? 'bg-green-900 text-green-100'
                            : 'text-slate-300'
                        } px-2 py-0.5 whitespace-pre-wrap break-words`}
                      >
                        {line.type === 'remove' && <span className="font-bold">- </span>}
                        {line.type === 'add' && <span className="font-bold">+ </span>}
                        {line.text}
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-sm text-slate-400 mb-3">Changelog</p>
                  <div className="bg-slate-900 p-4 rounded text-slate-200 text-sm">
                    {selectedVersions[1].changeLog}
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setSelectedVersionIds(null)}
                  >
                    Clear Comparison
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Version List */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-white mb-4">All Versions</h2>

          {versions.map((version) => (
            <Card
              key={version.id}
              className={`bg-slate-800 border-slate-700 cursor-pointer transition-colors ${
                selectedVersionIds?.includes(version.id)
                  ? 'ring-2 ring-blue-500'
                  : 'hover:border-slate-600'
              }`}
              onClick={() => toggleVersionSelection(version.id)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={selectedVersionIds?.includes(version.id) || false}
                        onChange={() => {}}
                        className="w-4 h-4"
                        onClick={(e) => e.stopPropagation()}
                      />
                      <div>
                        <CardTitle className="text-white">
                          v{version.versionNumber} • {version.promptName}
                        </CardTitle>
                        <p className="text-sm text-slate-400 mt-1">
                          {version.changeLog}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-400">
                      {new Date(version.createdAt).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-slate-500">
                      by {version.createdBy}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <pre className="bg-slate-900 p-4 rounded text-slate-200 text-sm overflow-auto max-h-32">
                  {version.template_body}
                </pre>
              </CardContent>
            </Card>
          ))}
        </div>

        {selectedVersionIds?.[1] === '' && (
          <div className="mt-8 p-4 bg-blue-900/20 border border-blue-700 rounded text-blue-100 text-sm">
            Select another version to compare with v{
              versions.find((v) => v.id === selectedVersionIds[0])?.versionNumber
            }
          </div>
        )}
      </main>
    </div>
  )
}
