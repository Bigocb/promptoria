export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyAccessToken } from '@/lib/jwt'
import { isAdmin } from '@/lib/is-admin'

export async function POST(request: NextRequest) {
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

    const body = await request.json()
    const { ollama_id, display_name, family, parameter_size, tier_required } = body

    if (!ollama_id || !display_name) {
      return NextResponse.json({ error: 'ollama_id and display_name required' }, { status: 400 })
    }

    const created = await prisma.modelPreset.create({
      data: {
        ollama_id,
        display_name,
        family: family || 'unknown',
        parameter_size: parameter_size || null,
        description: body.description || null,
        context_window: body.context_window || null,
        max_tokens: body.max_tokens || null,
        tier_required: tier_required || 'free',
        cost_estimate: body.cost_estimate || null,
        is_byok: body.is_byok || false,
        sort_order: body.sort_order || 0,
      },
    })

    return NextResponse.json({ model: created }, { status: 201 })
  } catch (error: any) {
    console.error('Admin create model error:', error)
    return NextResponse.json({ error: 'Server error: ' + error.message }, { status: 500 })
  }
}