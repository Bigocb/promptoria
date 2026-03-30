'use client'

import { useAuth } from '@/app/providers'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

interface ProtectedRouteProps {
  children: React.ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login')
    }
  }, [user, loading, router])

  // Show nothing while checking auth status
  if (!isClient || loading) {
    return null
  }

  // If user is not authenticated, the useEffect will redirect them
  if (!user) {
    return null
  }

  return <>{children}</>
}
