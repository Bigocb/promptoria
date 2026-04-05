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
      <style>{`
        @media (max-width: 767px) {
          .sidebar-toggle { display: block !important; }
          .sidebar-overlay { display: block !important; }
        }
        @media (min-width: 768px) {
          .sidebar-toggle { display: none !important; }
          .sidebar-overlay { display: none !important; }
        }
      `}</style>

      {/* Mobile hamburger menu */}
      <button
        className="sidebar-toggle"
        onClick={() => setSidebarOpen(!sidebarOpen)}
        style={{
          display: 'none',
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
          className="sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
          style={{
            display: 'none',
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            zIndex: 999,
          }}
        />
      )}

      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
    </>
  )
}
