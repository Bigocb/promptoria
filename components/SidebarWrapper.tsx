'use client'

import { useAuth } from '@/app/providers'
import { Sidebar } from './Sidebar'

export default function SidebarWrapper() {
  const { user, loading } = useAuth()

  // Don't render sidebar until auth is checked
  if (loading) {
    return null
  }

  // Only show sidebar for authenticated users
  if (!user) {
    return null
  }

  return <Sidebar />
}
