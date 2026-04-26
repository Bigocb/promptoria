import { NextRequest, NextResponse } from 'next/server'
import { verifyAccessToken } from '@/lib/jwt'
import { getQuotaStatus } from '@/lib/quota'

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    let userId: string
    try {
      const decoded = verifyAccessToken(token)
      userId = decoded.userId
    } catch {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const status = await getQuotaStatus(userId)
    return NextResponse.json(status, { status: 200 })
  } catch (error: any) {
    console.error('Get quota error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}