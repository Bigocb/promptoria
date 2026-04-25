import { NextRequest, NextResponse } from 'next/server'

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434'
const OLLAMA_API_KEY = process.env.OLLAMA_API_KEY || ''

interface ModelInfo {
  id: string
  name: string
  description: string
  family: string
  parameter_size: string | null
  quantization_level: string | null
  contextWindow: string
  maxTokens: number
}

function inferFamily(modelId: string): string {
  const lower = modelId.toLowerCase()
  if (lower.includes('llama')) return 'llama'
  if (lower.includes('mistral')) return 'mistral'
  if (lower.includes('gemma')) return 'gemma'
  if (lower.includes('qwen')) return 'qwen'
  if (lower.includes('phi')) return 'phi'
  if (lower.includes('deepseek')) return 'deepseek'
  if (lower.includes('codellama') || lower.includes('code-llama')) return 'codellama'
  if (lower.includes('neural')) return 'neural-chat'
  if (lower.includes('wizard')) return 'wizard'
  return 'other'
}

function formatName(id: string): string {
  return id.replace(/[-_:]/g, ' ').replace(/\s+/g, ' ').trim()
    .split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
}

function inferContextWindow(family: string): string {
  const windows: Record<string, string> = {
    llama: '8K', mistral: '32K', gemma: '8K', qwen: '32K',
    phi: '4K', deepseek: '64K', codellama: '16K', 'neural-chat': '4K',
    wizard: '4K', other: '4K',
  }
  return windows[family] || '4K'
}

function inferMaxTokens(family: string): number {
  const limits: Record<string, number> = {
    llama: 4096, mistral: 8000, gemma: 8192, qwen: 8192,
    phi: 4096, deepseek: 8192, codellama: 16384, 'neural-chat': 4096,
    wizard: 4096, other: 4096,
  }
  return limits[family] || 4096
}

function describeModel(family: string, paramSize: string | null): string {
  const descs: Record<string, string> = {
    llama: 'Meta Llama - versatile open source model',
    mistral: 'Mistral - efficient, excellent quality-to-speed ratio',
    gemma: 'Google Gemma - lightweight, built for safety',
    qwen: 'Alibaba Qwen - strong multilingual model',
    phi: 'Microsoft Phi - small but capable',
    deepseek: 'DeepSeek - advanced reasoning model',
    codellama: 'Code Llama - specialized for code generation',
    'neural-chat': 'Neural Chat - optimized for conversation',
    wizard: 'Wizard - fine-tuned for instructions',
    other: 'Open source model',
  }
  const base = descs[family] || descs['other']
  return paramSize ? `${base} (${paramSize})` : base
}

export async function GET(request: NextRequest) {
  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    if (OLLAMA_API_KEY) {
      headers['Authorization'] = `Bearer ${OLLAMA_API_KEY}`
    }

    const res = await fetch(`${OLLAMA_BASE_URL}/api/tags`, {
      signal: AbortSignal.timeout(8000),
      headers,
    })

    if (!res.ok) {
      return NextResponse.json({
        models: [],
        error: `Could not reach model server at ${OLLAMA_BASE_URL} (${res.status})`,
      }, { status: 200 })
    }

    const data = await res.json()
    const models: ModelInfo[] = (data.models || []).map((m: any) => {
      const family = m.details?.family || inferFamily(m.name || m.model || '')
      const paramSize = m.details?.parameter_size || null
      const quantLevel = m.details?.quantization_level || null

      return {
        id: m.name || m.model,
        name: formatName(m.name || m.model || 'unknown'),
        description: describeModel(family, paramSize),
        family,
        parameter_size: paramSize,
        quantization_level: quantLevel,
        contextWindow: inferContextWindow(family),
        maxTokens: inferMaxTokens(family),
      }
    })

    return NextResponse.json({ models }, { status: 200 })
  } catch (error: any) {
    console.error('Get models error:', error)
    return NextResponse.json({
      models: [],
      error: `Could not reach model server at ${OLLAMA_BASE_URL}. ${error.message}`,
    }, { status: 200 })
  }
}