'use client'

import { useState } from 'react'
import { Settings, Plus, Trash2, Check, AlertCircle, Eye, EyeOff, Copy, CheckCircle, Loader } from 'lucide-react'

const PROVIDERS = [
  { id: 'openai', name: 'OpenAI', icon: '🔴', color: 'bg-black' },
  { id: 'anthropic', name: 'Anthropic (Claude)', icon: '🤖', color: 'bg-orange-600' },
  { id: 'cohere', name: 'Cohere', icon: '🌊', color: 'bg-blue-600' },
  { id: 'azure', name: 'Azure OpenAI', icon: '☁️', color: 'bg-blue-500' },
  { id: 'ollama', name: 'Ollama (Local)', icon: '🦙', color: 'bg-gray-700' },
]

const MODELS_BY_PROVIDER = {
  openai: [
    { id: 'gpt-4', name: 'GPT-4', costPerMTok: '$0.03/$0.06' },
    { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', costPerMTok: '$0.01/$0.03' },
    { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', costPerMTok: '$0.50/$1.50' },
  ],
  anthropic: [
    { id: 'claude-3-opus', name: 'Claude 3 Opus', costPerMTok: '$0.015/$0.75' },
    { id: 'claude-3-sonnet', name: 'Claude 3 Sonnet', costPerMTok: '$0.003/$0.15' },
    { id: 'claude-3-haiku', name: 'Claude 3 Haiku', costPerMTok: '$0.0025/$0.0125' },
  ],
  cohere: [
    { id: 'command', name: 'Command', costPerMTok: '$0.001/$0.001' },
    { id: 'command-light', name: 'Command Light', costPerMTok: '$0.0003/$0.0006' },
  ],
  azure: [
    { id: 'gpt-4', name: 'GPT-4', costPerMTok: 'Variable' },
    { id: 'gpt-35-turbo', name: 'GPT-3.5 Turbo', costPerMTok: 'Variable' },
  ],
  ollama: [
    { id: 'llama2', name: 'Llama 2', costPerMTok: 'Free' },
    { id: 'mistral', name: 'Mistral', costPerMTok: 'Free' },
    { id: 'neural-chat', name: 'Neural Chat', costPerMTok: 'Free' },
  ],
}

type ProviderConfig = {
  id: string
  provider: string
  name: string
  description: string
  default_model: string
  is_default: boolean
  is_enabled: boolean
  is_public: boolean
  total_tokens_used: number
  total_cost: number
  request_count: number
  tested_at?: string
}

export default function SettingsPage() {
  const [configs, setConfigs] = useState<ProviderConfig[]>([
    {
      id: '1',
      provider: 'openai',
      name: 'Production OpenAI',
      description: 'Main production account',
      default_model: 'gpt-4',
      is_default: true,
      is_enabled: true,
      is_public: false,
      total_tokens_used: 125430,
      total_cost: 3.45,
      request_count: 247,
      tested_at: '2 hours ago',
    },
    {
      id: '2',
      provider: 'anthropic',
      name: 'Claude Testing',
      description: 'For testing Claude models',
      default_model: 'claude-3-sonnet',
      is_default: false,
      is_enabled: true,
      is_public: true,
      total_tokens_used: 45230,
      total_cost: 1.23,
      request_count: 89,
      tested_at: '1 day ago',
    },
  ])

  const [isCreating, setIsCreating] = useState(false)
  const [showNewForm, setShowNewForm] = useState(false)
  const [selectedProvider, setSelectedProvider] = useState('openai')
  const [newConfig, setNewConfig] = useState({
    name: '',
    description: '',
    provider: 'openai',
    apiKey: '',
    apiKeyVisible: false,
    default_model: 'gpt-4',
    default_temperature: 0.7,
    default_max_tokens: 2000,
    default_top_p: 0.9,
  })
  const [testingId, setTestingId] = useState<string | null>(null)
  const [testResult, setTestResult] = useState<{ id: string; message: string; success: boolean } | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const handleAddConfig = () => {
    if (!newConfig.name || !newConfig.apiKey || !newConfig.default_model) {
      alert('Please fill in all required fields')
      return
    }

    const config: ProviderConfig = {
      id: Math.random().toString(36).substr(2, 9),
      provider: newConfig.provider,
      name: newConfig.name,
      description: newConfig.description,
      default_model: newConfig.default_model,
      is_default: configs.length === 0,
      is_enabled: true,
      is_public: false,
      total_tokens_used: 0,
      total_cost: 0,
      request_count: 0,
    }

    setConfigs([...configs, config])
    setShowNewForm(false)
    setNewConfig({
      name: '',
      description: '',
      provider: 'openai',
      apiKey: '',
      apiKeyVisible: false,
      default_model: 'gpt-4',
      default_temperature: 0.7,
      default_max_tokens: 2000,
      default_top_p: 0.9,
    })
  }

  const handleSetDefault = (id: string) => {
    setConfigs(
      configs.map((c) => ({
        ...c,
        is_default: c.id === id,
      }))
    )
  }

  const handleDeleteConfig = (id: string) => {
    if (confirm('Delete this configuration? This cannot be undone.')) {
      setConfigs(configs.filter((c) => c.id !== id))
    }
  }

  const handleTestConnection = async (id: string) => {
    setTestingId(id)
    await new Promise((r) => setTimeout(r, 2000))

    setTestResult({
      id,
      message: 'Connection successful!',
      success: true,
    })
    setTestingId(null)
    setTimeout(() => setTestResult(null), 3000)
  }

  const handleCopyApiKey = (apiKey: string) => {
    navigator.clipboard.writeText(apiKey)
    setCopiedId('api-key')
    setTimeout(() => setCopiedId(null), 2000)
  }

  const getProviderInfo = (provider: string) => {
    return PROVIDERS.find((p) => p.id === provider)
  }

  const getAvailableModels = (provider: string) => {
    return MODELS_BY_PROVIDER[provider as keyof typeof MODELS_BY_PROVIDER] || []
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white">
      {/* Header */}
      <header className="border-b border-slate-700 bg-slate-800/50 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Settings className="w-8 h-8 text-blue-400" />
              <div>
                <h1 className="text-3xl font-bold">Settings</h1>
                <p className="text-slate-400 text-sm">Configure AI providers and models</p>
              </div>
            </div>
            <button
              onClick={() => setShowNewForm(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Provider
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* New Provider Form */}
        {showNewForm && (
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 mb-8">
            <h2 className="text-2xl font-bold mb-6">Add New AI Provider</h2>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="text-sm text-slate-400 block mb-2">Provider *</label>
                <select
                  value={newConfig.provider}
                  onChange={(e) => {
                    setNewConfig({ ...newConfig, provider: e.target.value, default_model: '' })
                  }}
                  className="w-full bg-slate-700 border border-slate-600 text-white px-3 py-2 rounded-lg"
                >
                  {PROVIDERS.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.icon} {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm text-slate-400 block mb-2">Configuration Name *</label>
                <input
                  type="text"
                  value={newConfig.name}
                  onChange={(e) => setNewConfig({ ...newConfig, name: e.target.value })}
                  placeholder="e.g., Production OpenAI"
                  className="w-full bg-slate-700 border border-slate-600 text-white px-3 py-2 rounded-lg"
                />
              </div>

              <div className="col-span-2">
                <label className="text-sm text-slate-400 block mb-2">Description</label>
                <input
                  type="text"
                  value={newConfig.description}
                  onChange={(e) => setNewConfig({ ...newConfig, description: e.target.value })}
                  placeholder="What is this configuration for?"
                  className="w-full bg-slate-700 border border-slate-600 text-white px-3 py-2 rounded-lg"
                />
              </div>

              <div>
                <label className="text-sm text-slate-400 block mb-2">API Key *</label>
                <div className="relative">
                  <input
                    type={newConfig.apiKeyVisible ? 'text' : 'password'}
                    value={newConfig.apiKey}
                    onChange={(e) => setNewConfig({ ...newConfig, apiKey: e.target.value })}
                    placeholder="sk-..."
                    className="w-full bg-slate-700 border border-slate-600 text-white px-3 py-2 rounded-lg pr-10"
                  />
                  <button
                    onClick={() => setNewConfig({ ...newConfig, apiKeyVisible: !newConfig.apiKeyVisible })}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2"
                  >
                    {newConfig.apiKeyVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-sm text-slate-400 block mb-2">Default Model *</label>
                <select
                  value={newConfig.default_model}
                  onChange={(e) => setNewConfig({ ...newConfig, default_model: e.target.value })}
                  className="w-full bg-slate-700 border border-slate-600 text-white px-3 py-2 rounded-lg"
                >
                  <option value="">Select a model</option>
                  {getAvailableModels(newConfig.provider).map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} - {m.costPerMTok}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm text-slate-400 block mb-2">Temperature: {newConfig.default_temperature}</label>
                <input
                  type="range"
                  min="0"
                  max="2"
                  step="0.1"
                  value={newConfig.default_temperature}
                  onChange={(e) => setNewConfig({ ...newConfig, default_temperature: parseFloat(e.target.value) })}
                  className="w-full"
                />
              </div>

              <div>
                <label className="text-sm text-slate-400 block mb-2">Max Tokens: {newConfig.default_max_tokens}</label>
                <input
                  type="range"
                  min="100"
                  max="4000"
                  step="100"
                  value={newConfig.default_max_tokens}
                  onChange={(e) => setNewConfig({ ...newConfig, default_max_tokens: parseInt(e.target.value) })}
                  className="w-full"
                />
              </div>

              <div>
                <label className="text-sm text-slate-400 block mb-2">Top P: {newConfig.default_top_p}</label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={newConfig.default_top_p}
                  onChange={(e) => setNewConfig({ ...newConfig, default_top_p: parseFloat(e.target.value) })}
                  className="w-full"
                />
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={handleAddConfig}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg font-medium"
              >
                Save Configuration
              </button>
              <button
                onClick={() => setShowNewForm(false)}
                className="px-4 py-2 border border-slate-600 hover:bg-slate-700 rounded-lg font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Configurations List */}
        <div className="grid gap-6">
          {configs.length === 0 ? (
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-12 text-center">
              <p className="text-slate-400 mb-4">No AI providers configured yet</p>
              <button
                onClick={() => setShowNewForm(true)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium inline-flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add First Provider
              </button>
            </div>
          ) : (
            configs.map((config) => {
              const provider = getProviderInfo(config.provider)
              return (
                <div key={config.id} className="bg-slate-800 border border-slate-700 rounded-lg p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 ${provider?.color} rounded-lg flex items-center justify-center text-2xl`}>
                        {provider?.icon}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-xl font-bold">{config.name}</h3>
                          {config.is_default && (
                            <span className="bg-green-900 text-green-100 text-xs px-2 py-1 rounded">
                              DEFAULT
                            </span>
                          )}
                          {config.tested_at && (
                            <span className="bg-blue-900 text-blue-100 text-xs px-2 py-1 rounded flex items-center gap-1">
                              <CheckCircle className="w-3 h-3" />
                              Tested {config.tested_at}
                            </span>
                          )}
                        </div>
                        <p className="text-slate-400 text-sm">{config.description}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {!config.is_default && (
                        <button
                          onClick={() => handleSetDefault(config.id)}
                          className="px-3 py-1 border border-slate-600 hover:bg-slate-700 rounded text-sm"
                        >
                          Set Default
                        </button>
                      )}
                      <button
                        onClick={() => handleTestConnection(config.id)}
                        disabled={testingId === config.id}
                        className={`px-3 py-1 rounded text-sm flex items-center gap-1 ${
                          testingId === config.id
                            ? 'bg-slate-700 text-slate-400'
                            : 'border border-slate-600 hover:bg-slate-700'
                        }`}
                      >
                        {testingId === config.id ? (
                          <>
                            <Loader className="w-3 h-3 animate-spin" />
                            Testing...
                          </>
                        ) : (
                          'Test'
                        )}
                      </button>
                      <button
                        onClick={() => handleDeleteConfig(config.id)}
                        className="px-3 py-1 border border-red-600 hover:bg-red-900/20 rounded text-sm text-red-400"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {testResult?.id === config.id && (
                    <div className={`mb-4 p-3 rounded flex items-center gap-2 ${testResult.success ? 'bg-green-900/20 text-green-200' : 'bg-red-900/20 text-red-200'}`}>
                      {testResult.success ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                      {testResult.message}
                    </div>
                  )}

                  <div className="grid grid-cols-4 gap-4 mb-4">
                    <div className="bg-slate-700 p-3 rounded">
                      <p className="text-xs text-slate-400 mb-1">Provider</p>
                      <p className="font-bold">{provider?.name}</p>
                    </div>
                    <div className="bg-slate-700 p-3 rounded">
                      <p className="text-xs text-slate-400 mb-1">Default Model</p>
                      <p className="font-bold text-sm">{config.default_model}</p>
                    </div>
                    <div className="bg-slate-700 p-3 rounded">
                      <p className="text-xs text-slate-400 mb-1">Requests</p>
                      <p className="font-bold">{config.request_count}</p>
                    </div>
                    <div className="bg-slate-700 p-3 rounded">
                      <p className="text-xs text-slate-400 mb-1">Total Cost</p>
                      <p className="font-bold text-green-400">${config.total_cost.toFixed(2)}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 text-sm text-slate-400">
                    <div>
                      <p className="text-xs mb-1">Tokens Used</p>
                      <p className="font-mono font-bold text-white">{config.total_tokens_used.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-xs mb-1">Avg Cost per Request</p>
                      <p className="font-mono font-bold text-white">${(config.total_cost / (config.request_count || 1)).toFixed(4)}</p>
                    </div>
                    <div>
                      <p className="text-xs mb-1">Status</p>
                      <p className={`font-bold ${config.is_enabled ? 'text-green-400' : 'text-red-400'}`}>
                        {config.is_enabled ? 'Enabled' : 'Disabled'}
                      </p>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Provider Guide */}
        <div className="mt-12 bg-slate-800 border border-slate-700 rounded-lg p-6">
          <h2 className="text-2xl font-bold mb-4">AI Providers Overview</h2>
          <div className="grid grid-cols-2 gap-6">
            {PROVIDERS.map((provider) => {
              const models = getAvailableModels(provider.id)
              return (
                <div key={provider.id} className="bg-slate-700 p-4 rounded">
                  <h3 className="font-bold mb-2 flex items-center gap-2">
                    <span className="text-2xl">{provider.icon}</span>
                    {provider.name}
                  </h3>
                  <p className="text-sm text-slate-400 mb-3">
                    {models.length} available models
                  </p>
                  <div className="space-y-1">
                    {models.slice(0, 3).map((m) => (
                      <div key={m.id} className="text-xs text-slate-300">
                        • {m.name} - {m.costPerMTok}
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </main>
    </div>
  )
}
