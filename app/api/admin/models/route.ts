import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyAccessToken } from '@/lib/jwt'

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'bobby.cloutier@gmail.com'

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    let userEmail: string
    try {
      const decoded = verifyAccessToken(token)
      userEmail = decoded.email
    } catch {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (userEmail !== ADMIN_EMAIL) {
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