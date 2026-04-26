import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization')
    return NextResponse.json({
      ok: true,
      hasAuth: !!authHeader,
      timestamp: Date.now(),
      version: 'diagnostic-2026-04-26',
    })
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  }
}
