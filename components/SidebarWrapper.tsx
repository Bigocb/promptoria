'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/app/providers'
import { Sidebar } from './Sidebar'
import { BottomNav } from './BottomNav'

export default function SidebarWrapper() {
  const { user, loading } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    const main = document.querySelector('main.layout-main') as HTMLElement | null
    if (!main) return
    if (user && !loading) {
      main.style.marginLeft = '240px'
      const mq = window.matchMedia('(max-width: 767px)')
      const handler = (e: MediaQueryListEvent | MediaQueryList) => {
        main.style.marginLeft = e.matches ? '0' : '240px'
      }
      handler(mq)
      mq.addEventListener('change', handler)
      return () => mq.removeEventListener('change', handler)
    } else {
      main.style.marginLeft = '0'
    }
  }, [user, loading])

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
        .sidebar {
          transform: translateX(-100%);
          transition: transform 0.3s ease;
        }
        .sidebar.sidebar-open {
          transform: translateX(0);
        }

        @media (max-width: 767px) {
          .sidebar-toggle { display: none !important; }
          .sidebar-overlay { display: block !important; }
          .sidebar.sidebar-closed { transform: translateX(-100%); }
          .sidebar.sidebar-open { transform: translateX(0); }
        }
        @media (min-width: 768px) {
          .sidebar-toggle { display: none !important; }
          .sidebar-overlay { display: none !important; }
          .sidebar { transform: translateX(0) !important; }
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
      <BottomNav />
    </>
  )
}
