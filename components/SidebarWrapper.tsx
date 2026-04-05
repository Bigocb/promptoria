'use client'

import { useState } from 'react'
import { useAuth } from '@/app/providers'
import { Sidebar } from './Sidebar'

export default function SidebarWrapper() {
  const { user, loading } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Don't render sidebar until auth is checked
  if (loading) {
    return null
  }

  // Only show sidebar for authenticated users
  if (!user) {
    return null
  }

  return (
    <>
      {/* Mobile hamburger menu */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        style={{
          display: 'none',
          '@media (max-width: 767px)': {
            display: 'block',
          },
          position: 'fixed',
          top: '1rem',
          left: '1rem',
          zIndex: 1001,
          background: 'var(--color-accent)',
          color: 'white',
          border: 'none',
          padding: '0.5rem 0.75rem',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '1.25rem',
        }}
      >
        ☰
      </button>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{
            display: 'none',
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            zIndex: 999,
            '@media (max-width: 767px)': {
              display: 'block',
            },
          }}
        />
      )}

      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
    </>
  )
}
