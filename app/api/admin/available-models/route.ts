export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyAccessToken } from '@/lib/jwt'
import { isAdmin } from '@/lib/is-admin'
import { inferModelMetadata } from '@/lib/model-enrichment'

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434'
const OLLAMA_API_KEY = process.env.OLLAMA_API_KEY || ''

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    let decoded: { userId: string; email: string; tier?: string }
    try {
      decoded = verifyAccessToken(token)
    } catch {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userIsAdmin = await isAdmin(decoded.userId)
    if (!userIsAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Fetch all models from Ollama Cloud
    let allOllamaModels: any[] = []
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (OLLAMA_API_KEY) headers['Authorization'] = `Bearer ${OLLAMA_API_KEY}`

      const res = await fetch(`${OLLAMA_BASE_URL}/api/tags`, { headers })
      if (res.ok) {
        const data = await res.json()
        allOllamaModels = data.models || []
      }
    } catch (err) {
      console.error('Ollama Cloud fetch error:', err)
      return NextResponse.json({ error: 'Could not reach Ollama Cloud' }, { status: 502 })
    }

    // Fetch all models we already have in DB
    const dbPresets = await prisma.modelPreset.findMany({
      select: { ollama_id: true, tier_required: true, is_active: true },
    })

    const dbIds = new Set(dbPresets.map((p) => p.ollama_id))

    const unassigned = allOllamaModels
      .filter((m: any) => !dbIds.has(m.name || m.model))
      .map((m: any) => {
        const ollamaId = m.name || m.model
        // Ollama sometimes doesn't populate details; fall back to our inference
        const inferred = inferModelMetadata(ollamaId)
        const paramSize = m.details?.parameter_size || inferred.parameter_size || 'unknown'
        const paramNum = paramSize !== 'unknown'
          ? parseFloat(paramSize.replace(/[a-z]/gi, '')) * (paramSize.toLowerCase().endsWith('m') ? 0.001 : 1)
          : null
        const costEstimate = paramNum <= 3 ? 'cheap' : paramNum <= 14 ? 'medium' : 'expensive'
        return {
          id: ollamaId,
          name: m.name || m.model,
          size: m.size,
          family: m.details?.family || inferred.family || 'unknown',
          parameter_size: paramSize,
          cost_estimate: costEstimate,
          quantization_level: m.details?.quantization_level || 'unknown',
        }
      })

    return NextResponse.json({
      ollama_total: allOllamaModels.length,
      curated_total: dbPresets.length,
      unassigned,
    }, { status: 200 })
  } catch (error: any) {
    console.error('Admin available models error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
