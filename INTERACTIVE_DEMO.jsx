'use client'

import React, { useState } from 'react'
import { Plus, Edit2, Trash2, Copy, Check, Play, ArrowLeft, AlertCircle, Loader, X } from 'lucide-react'

// Shadcn Button Component
const Button = ({ onClick, variant = 'default', size = 'md', children, disabled = false, className = '' }) => {
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-md transition-colors focus:outline-none'
  const variants = {
    default: 'bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50',
    outline: 'border border-gray-300 text-gray-700 hover:bg-gray-50',
    ghost: 'hover:bg-gray-100 text-gray-700',
  }
  const sizes = {
    sm: 'px-3 py-1 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
    icon: 'w-10 h-10',
  }
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {children}
    </button>
  )
}

// Card Component
const Card = ({ children, className = '' }) => (
  <div className={`bg-white border border-gray-200 rounded-lg shadow-sm ${className}`}>
    {children}
  </div>
)

const CardHeader = ({ children }) => <div className="px-6 py-4 border-b border-gray-200">{children}</div>
const CardTitle = ({ children }) => <h2 className="text-xl font-bold text-gray-900">{children}</h2>
const CardContent = ({ children }) => <div className="px-6 py-4">{children}</div>

export default function PromptArchitectDemo() {
  const [currentView, setCurrentView] = useState('home')
  const [snippets, setSnippets] = useState([
    {
      id: '1',
      name: 'Brand Voice',
      description: 'Our brand tone and personality',
      content: 'You are a friendly, professional assistant. Be clear, concise, and persuasive.',
      version: 1,
    },
    {
      id: '2',
      name: 'Format Instructions',
      description: 'Output formatting rules',
      content: 'Always respond in clear sections. Use bullet points for lists.',
      version: 1,
    },
  ])
  const [prompts, setPrompts] = useState([
    {
      id: 'p1',
      name: 'Product Description Generator',
      description: 'Generates compelling product descriptions',
      template_body: 'Write a product description for {{product_name}}. Category: {{category}}. Key features: {{features}}.',
      snippets: ['1', '2'],
      model: 'gpt-4',
      versions: 2,
    },
  ])
  const [testResults, setTestResults] = useState([])
  const [selectedSnippetId, setSelectedSnippetId] = useState(null)
  const [copiedField, setCopiedField] = useState(null)
  const [testVars, setTestVars] = useState({
    product_name: 'Premium Wireless Headphones',
    category: 'Audio Equipment',
    features: 'Noise cancellation, 40hr battery, premium sound',
  })
  const [isExecuting, setIsExecuting] = useState(false)
  const [lastTestResult, setLastTestResult] = useState(null)

  const handleExecuteTest = async () => {
    setIsExecuting(true)
    // Simulate API call
    await new Promise((r) => setTimeout(r, 2000))

    const result = {
      id: `test_${Date.now()}`,
      timestamp: new Date().toLocaleString(),
      output: `Premium Wireless Headphones deliver studio-quality audio wherever you go. 

These professional-grade headphones feature advanced noise cancellation technology that blocks out 99% of ambient sound. With an impressive 40-hour battery life, you'll enjoy uninterrupted listening for days.

Key Features:
• Industry-leading noise cancellation
• Extended 40-hour battery life
• Premium sound signature
• Comfortable all-day design
• Professional-grade build quality

Experience the difference premium audio makes. Order today and save 15%.`,
      inputTokens: 187,
      outputTokens: 142,
      totalTokens: 329,
      costUsd: 0.0089,
      latencyMs: 1847,
      status: 'success',
    }

    setTestResults([result, ...testResults.slice(0, 9)])
    setLastTestResult(result)
    setIsExecuting(false)
  }

  const copyToClipboard = (text, fieldName) => {
    navigator.clipboard.writeText(text)
    setCopiedField(fieldName)
    setTimeout(() => setCopiedField(null), 2000)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800">
      {/* Header */}
      <header className="border-b border-slate-700 bg-slate-800/50 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">PromptArchitect</h1>
            <p className="text-slate-400 text-sm">Modular, versioned prompt management</p>
          </div>
          {currentView !== 'home' && (
            <Button variant="ghost" onClick={() => setCurrentView('home')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Home
            </Button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {currentView === 'home' && (
          <div>
            <div className="grid md:grid-cols-4 gap-6 mb-12">
              {[
                { icon: '📚', title: 'Snippet Library', desc: 'Manage reusable text blocks', view: 'snippets' },
                { icon: '⚡', title: 'Prompt Workspace', desc: 'Build and compose prompts', view: 'prompts' },
                { icon: '📊', title: 'Version History', desc: 'Compare and manage versions', view: 'history' },
                { icon: '▶️', title: 'Test Runner', desc: 'Execute and test prompts', view: 'test' },
              ].map((card, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentView(card.view)}
                  className="bg-slate-800 border border-slate-700 rounded-lg p-6 hover:border-slate-600 hover:shadow-lg transition-all text-left"
                >
                  <div className="text-3xl mb-3">{card.icon}</div>
                  <h3 className="text-white font-bold text-lg">{card.title}</h3>
                  <p className="text-slate-400 text-sm mt-1">{card.desc}</p>
                </button>
              ))}
            </div>

            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Getting Started</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-slate-300">
                <div>
                  <h4 className="font-bold text-white mb-2">1. Create a Snippet</h4>
                  <p className="text-sm">Go to Snippet Library and create a reusable text block like "Brand Voice"</p>
                </div>
                <div>
                  <h4 className="font-bold text-white mb-2">2. Build a Prompt</h4>
                  <p className="text-sm">In Prompt Workspace, compose a prompt from snippets and add variables</p>
                </div>
                <div>
                  <h4 className="font-bold text-white mb-2">3. Test & Monitor</h4>
                  <p className="text-sm">Run tests in Test Runner to see LLM outputs, track tokens, and monitor costs</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {currentView === 'snippets' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white">Snippet Library</h2>
            <div className="grid gap-4">
              {snippets.map((snippet) => (
                <Card key={snippet.id} className="bg-slate-800 border-slate-700">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-white">{snippet.name}</CardTitle>
                        <p className="text-slate-400 text-sm mt-1">{snippet.description}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="icon"
                          variant="outline"
                          onClick={() => copyToClipboard(snippet.content, `snippet_${snippet.id}`)}
                        >
                          {copiedField === `snippet_${snippet.id}` ? (
                            <Check className="w-4 h-4 text-green-500" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-slate-900 p-4 rounded text-slate-200 text-sm font-mono max-h-32 overflow-auto">
                      {snippet.content}
                    </div>
                    <p className="text-xs text-slate-500 mt-2">v{snippet.version}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {currentView === 'prompts' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white">Prompt Workspace</h2>
            <div className="grid gap-4">
              {prompts.map((prompt) => (
                <Card key={prompt.id} className="bg-slate-800 border-slate-700">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-white">{prompt.name}</CardTitle>
                        <p className="text-slate-400 text-sm mt-1">{prompt.description}</p>
                      </div>
                      <Button size="icon" variant="outline" onClick={() => setCurrentView('test')}>
                        <Play className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-xs text-slate-400 mb-2">Snippets ({prompt.snippets.length})</p>
                      <div className="flex flex-wrap gap-2">
                        {prompt.snippets.map((snippetId) => {
                          const snippet = snippets.find((s) => s.id === snippetId)
                          return (
                            <span key={snippetId} className="bg-blue-900 text-blue-100 text-xs px-2 py-1 rounded">
                              {snippet?.name}
                            </span>
                          )
                        })}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 mb-2">Template</p>
                      <div className="bg-slate-900 p-3 rounded text-slate-200 text-sm font-mono max-h-24 overflow-auto">
                        {prompt.template_body}
                      </div>
                    </div>
                    <div className="text-xs text-slate-400">
                      Model: {prompt.model} • v{prompt.versions}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {currentView === 'history' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white">Version History</h2>
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Product Description Generator</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border-t border-slate-700 pt-4">
                  <h4 className="font-bold text-white mb-2">v1: Initial version</h4>
                  <p className="text-sm text-slate-300 mb-2">Write description for {{product_name}}</p>
                </div>
                <div className="border-t border-slate-700 pt-4">
                  <h4 className="font-bold text-white mb-2">v2: Enhanced with variables (current)</h4>
                  <p className="text-sm text-slate-300 mb-2">
                    Write description for {{product_name}}. Category: {{category}}. Features: {{features}}.
                  </p>
                  <div className="bg-green-900/20 border border-green-700 p-2 rounded text-sm text-green-100">
                    ✓ Added category and features variables
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {currentView === 'test' && (
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Left Panel */}
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-white mb-4">Test Runner</h2>
              </div>

              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">Prompt Selection</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-white text-sm">Prompt</label>
                    <div className="mt-2 bg-slate-700 p-3 rounded text-slate-200">Product Description Generator</div>
                  </div>
                  <div>
                    <label className="text-white text-sm">Version</label>
                    <div className="mt-2 bg-slate-700 p-3 rounded text-slate-200">v2 (Active)</div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">Variables</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {Object.entries(testVars).map(([key, value]) => (
                    <div key={key}>
                      <label className="text-white text-sm">{'{{'}{key}{'}}'}</label>
                      <input
                        value={value}
                        onChange={(e) => setTestVars({ ...testVars, [key]: e.target.value })}
                        className="mt-1 w-full bg-slate-700 border border-slate-600 text-white px-3 py-2 rounded text-sm"
                      />
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Button
                onClick={handleExecuteTest}
                disabled={isExecuting}
                className="w-full h-12 text-base gap-2"
              >
                {isExecuting ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    Executing...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    Execute Prompt
                  </>
                )}
              </Button>
            </div>

            {/* Right Panel */}
            <div className="space-y-6">
              {lastTestResult && lastTestResult.status === 'success' && (
                <>
                  <Card className="bg-slate-800 border-slate-700">
                    <CardHeader>
                      <div className="flex justify-between items-center">
                        <CardTitle className="text-white">Output</CardTitle>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => copyToClipboard(lastTestResult.output, 'output')}
                        >
                          {copiedField === 'output' ? (
                            <Check className="w-4 h-4 text-green-500" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="bg-slate-900 p-4 rounded text-slate-200 text-sm max-h-64 overflow-y-auto whitespace-pre-wrap">
                        {lastTestResult.output}
                      </div>
                    </CardContent>
                  </Card>

                  <div className="grid grid-cols-2 gap-4">
                    <Card className="bg-slate-800 border-slate-700">
                      <CardContent className="pt-6">
                        <p className="text-slate-400 text-xs mb-1">Input Tokens</p>
                        <p className="text-2xl font-bold text-white">{lastTestResult.inputTokens}</p>
                      </CardContent>
                    </Card>
                    <Card className="bg-slate-800 border-slate-700">
                      <CardContent className="pt-6">
                        <p className="text-slate-400 text-xs mb-1">Output Tokens</p>
                        <p className="text-2xl font-bold text-white">{lastTestResult.outputTokens}</p>
                      </CardContent>
                    </Card>
                    <Card className="bg-slate-800 border-slate-700">
                      <CardContent className="pt-6">
                        <p className="text-slate-400 text-xs mb-1">Cost</p>
                        <p className="text-2xl font-bold text-green-400">${lastTestResult.costUsd.toFixed(4)}</p>
                      </CardContent>
                    </Card>
                    <Card className="bg-slate-800 border-slate-700">
                      <CardContent className="pt-6">
                        <p className="text-slate-400 text-xs mb-1">Latency</p>
                        <p className="text-2xl font-bold text-blue-400">{lastTestResult.latencyMs}ms</p>
                      </CardContent>
                    </Card>
                  </div>

                  {testResults.length > 1 && (
                    <Card className="bg-slate-800 border-slate-700">
                      <CardHeader>
                        <CardTitle className="text-white text-sm">Recent Tests</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {testResults.slice(0, 5).map((test) => (
                            <div
                              key={test.id}
                              className="p-3 bg-slate-700 rounded hover:bg-slate-600 cursor-pointer transition-colors text-sm"
                            >
                              <div className="flex justify-between">
                                <span className="text-slate-200">{test.timestamp}</span>
                                <span className="text-green-400 text-xs font-bold">SUCCESS</span>
                              </div>
                              <div className="text-xs text-slate-400 mt-2">
                                💰 ${test.costUsd.toFixed(4)} • ⚡ {test.latencyMs}ms • 📊 {test.totalTokens} tokens
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </>
              )}

              {!lastTestResult && !isExecuting && (
                <Card className="bg-slate-800 border-slate-700 flex items-center justify-center min-h-96">
                  <CardContent className="text-center">
                    <p className="text-slate-400">Execute a prompt to see results</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
