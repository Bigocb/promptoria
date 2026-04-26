import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyAccessToken } from '@/lib/jwt'

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'bobby.cloutier@gmail.com'

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
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
    const allowed = [
      'display_name',
      'description',
      'context_window',
      'max_tokens',
      'is_active',
      'tier_required',
      'cost_estimate',
      'sort_order',
    ]

    const updateData: Record<string, any> = {}
    for (const key of allowed) {
      if (body[key] !== undefined) updateData[key] = body[key]
    }

    const updated = await prisma.modelPreset.update({
      where: { id: params.id },
      data: updateData,
    })

    return NextResponse.json({ model: updated }, { status: 200 })
  } catch (error: any) {
    console.error('Admin update model error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}