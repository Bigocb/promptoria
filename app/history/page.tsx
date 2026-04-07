'use client'

import { useState } from 'react'
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
    <div style={{ padding: '2rem' }}>
      <header style={{ marginBottom: '2rem' }}>
        <div style={{ marginBottom: '1rem' }}>
          <Link href="/dashboard" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', color: 'var(--color-foregroundAlt)', textDecoration: 'none', fontSize: '0.875rem', padding: '0.375rem 0.75rem', border: '1px solid var(--color-border)', borderRadius: '0.375rem' }}>
            ← Dashboard
          </Link>
        </div>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>📊 Version History</h1>
        <p style={{ color: 'var(--color-foregroundAlt)', marginBottom: '1.5rem' }}>
          Compare and track all versions of your prompts
        </p>

        <div className="card" style={{ backgroundColor: 'var(--color-background)', padding: '1rem' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: '600', color: 'var(--color-accent)', marginBottom: '0.75rem' }}>
            🔍 How to use Version History
          </h3>
          <ul style={{ fontSize: '0.875rem', color: 'var(--color-foregroundAlt)', marginLeft: '1.5rem', listStyle: 'disc' }}>
            <li style={{ marginBottom: '0.5rem' }}>Every time you save a prompt, a new version is created</li>
            <li style={{ marginBottom: '0.5rem' }}>Click on versions to see the full template</li>
            <li style={{ marginBottom: '0.5rem' }}>Select TWO versions to compare changes side-by-side</li>
            <li style={{ marginBottom: '0.5rem' }}>Rollback to any previous version with one click</li>
            <li>Each version includes a changelog explaining what changed</li>
          </ul>
        </div>
      </header>

      {selectedVersions.length === 2 && (
        <div className="card" style={{ marginBottom: '2rem', backgroundColor: 'var(--color-background)' }}>
          <h2 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1rem', color: 'var(--color-accent)' }}>
            Diff: {selectedVersions[0].promptName} v{selectedVersions[0].versionNumber}{' '}
            → v{selectedVersions[1].versionNumber}
          </h2>

          <div style={{ marginBottom: '1.5rem' }}>
            <p style={{ fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.75rem', color: 'var(--color-accent)' }}>Changes</p>
            <div style={{
              backgroundColor: 'var(--color-background)',
              padding: '1rem',
              borderRadius: '0.25rem',
              fontFamily: 'monospace',
              maxHeight: '400px',
              overflow: 'auto',
              fontSize: '0.8rem',
              lineHeight: '1.4',
            }}>
              {getHighlightedDiff(
                selectedVersions[0].template_body,
                selectedVersions[1].template_body
              ).map((line, idx) => (
                <div
                  key={idx}
                  style={{
                    backgroundColor: line.type === 'remove' ? 'var(--color-error)' : line.type === 'add' ? 'var(--color-success)' : 'transparent',
                    color: line.type === 'remove' ? '#fff' : line.type === 'add' ? '#000' : 'var(--color-foregroundAlt)',
                    padding: '0.25rem 0.5rem',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                  }}
                >
                  {line.type === 'remove' && <span style={{ fontWeight: 'bold' }}>- </span>}
                  {line.type === 'add' && <span style={{ fontWeight: 'bold' }}>+ </span>}
                  {line.text}
                </div>
              ))}
            </div>
          </div>

          <div>
            <p style={{ fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.75rem', color: 'var(--color-accent)' }}>Changelog</p>
            <div style={{ backgroundColor: 'var(--color-background)', padding: '1rem', borderRadius: '0.25rem', fontSize: '0.875rem', color: 'var(--color-foregroundAlt)' }}>
              {selectedVersions[1].changeLog}
            </div>
          </div>

          <button
            onClick={() => setSelectedVersionIds(null)}
            className="btn btn-secondary"
            style={{ marginTop: '1rem' }}
          >
            Clear Comparison
          </button>
        </div>
      )}

      <div>
        <h2 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1rem', color: 'var(--color-foreground)' }}>All Versions</h2>

        <div style={{ display: 'grid', gap: '1rem' }}>
          {versions.map((version) => (
            <div
              key={version.id}
              className="card"
              onClick={() => toggleVersionSelection(version.id)}
              style={{
                cursor: 'pointer',
                borderColor: selectedVersionIds?.includes(version.id) ? 'var(--color-accent)' : 'var(--color-border)',
                borderWidth: selectedVersionIds?.includes(version.id) ? '2px' : '1px',
              }}
            >
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                  <input
                    type="checkbox"
                    checked={selectedVersionIds?.includes(version.id) || false}
                    onChange={() => {}}
                    style={{ cursor: 'pointer' }}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.25rem' }}>
                      v{version.versionNumber} • {version.promptName}
                    </h3>
                    <p style={{ fontSize: '0.875rem', color: 'var(--color-foregroundAlt)' }}>
                      {version.changeLog}
                    </p>
                  </div>
                  <div style={{ textAlign: 'right', fontSize: '0.75rem', color: 'var(--color-foregroundAlt)' }}>
                    <p>{new Date(version.createdAt).toLocaleDateString()}</p>
                    <p>by {version.createdBy}</p>
                  </div>
                </div>
              </div>
              <pre style={{
                backgroundColor: 'var(--color-background)',
                padding: '0.75rem',
                borderRadius: '0.25rem',
                fontSize: '0.8rem',
                overflow: 'auto',
                maxHeight: '200px',
                fontFamily: 'monospace',
                color: 'var(--color-foregroundAlt)',
              }}>
                {version.template_body}
              </pre>
            </div>
          ))}
        </div>

        {selectedVersionIds?.[1] === '' && (
          <div style={{
            marginTop: '1.5rem',
            padding: '1rem',
            backgroundColor: 'var(--color-background)',
            border: `1px solid var(--color-accent)`,
            borderRadius: '0.5rem',
            fontSize: '0.875rem',
            color: 'var(--color-accent)',
          }}>
            📌 Select another version to compare with v{
              versions.find((v) => v.id === selectedVersionIds[0])?.versionNumber
            }
          </div>
        )}
      </div>
    </div>
  )
}
