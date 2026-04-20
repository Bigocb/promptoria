import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyAccessToken } from '@/lib/jwt'

export async function POST(request: NextRequest) {
  try {
    // Verify JWT token
    const authHeader = request.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized - missing or invalid token' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)
    let userId: string
    try {
      const decoded = verifyAccessToken(token)
      userId = decoded.userId
    } catch (error) {
      return NextResponse.json(
        { error: 'Unauthorized - invalid or expired token' },
        { status: 401 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { device_type, device_name, app_version } = body

    // Validate required fields
    if (!device_type || !device_name || !app_version) {
      return NextResponse.json(
        { error: 'device_type, device_name, and app_version are required' },
        { status: 400 }
      )
    }

    // Validate device_type
    if (!['ios', 'android'].includes(device_type)) {
      return NextResponse.json(
        { error: 'device_type must be "ios" or "android"' },
        { status: 400 }
      )
    }

    // Create device record
    const device = await prisma.device.create({
      data: {
        user_id: userId,
        device_type,
        device_name,
        app_version,
      },
    })

    return NextResponse.json(
      {
        device: {
          id: device.id,
          device_type: device.device_type,
          device_name: device.device_name,
          app_version: device.app_version,
          created_at: device.created_at,
        },
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('Register device error:', error)
    return NextResponse.json(
      { error: 'Server error: ' + error.message },
      { status: 500 }
    )
  }
}
