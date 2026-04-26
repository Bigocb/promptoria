import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyAccessToken } from '@/lib/jwt'

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'bobby.cloutier@gmail.com'

export async function GET(request: NextRequest) {
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

    const presets = await prisma.modelPreset.findMany({
      orderBy: [{ tier_required: 'asc' }, { sort_order: 'asc' }],
    })

    return NextResponse.json({ models: presets }, { status: 200 })
  } catch (error: any) {
    console.error('Admin models error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}