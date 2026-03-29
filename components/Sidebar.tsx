'use client'

import { useTheme } from '@/app/providers'
import { themes } from '@/lib/themes'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'

export function Sidebar() {
  const { currentTheme, setTheme } = useTheme()
  const pathname = usePathname()
  const [showThemeMenu, setShowThemeMenu] = useState(false)

  const isActive = (path: string) => pathname === path

  const navItems = [
    { label: '📚 Snippets', href: '/snippets' },
    { label: '⚡ Prompts', href: '/prompts' },
    { label: '📊 History', href: '/history' },
    { label: '▶️ Test', href: '/test' },
  ]

  return (
    <aside
      style={{
        backgroundColor: 'var(--color-backgroundAlt)',
        borderRight: '1px solid var(--color-border)',
        width: '240px',
        minHeight: '100vh',
        padding: '1.5rem 0',
        position: 'fixed',
        left: 0,
        top: 0,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Logo */}
      <div
        style={{
          padding: '1rem 1.5rem 1.5rem',
          borderBottom: '1px solid var(--color-border)',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
        }}
      >
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', textDecoration: 'none' }}>
          <img src="/logo.svg" alt="Promptoria" style={{ width: '40px', height: '40px' }} />
          <h1 style={{ fontSize: '1.125rem', fontWeight: 'bold', color: 'var(--color-foreground)', margin: 0 }}>Promptoria</h1>
        </Link>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1 }}>
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            style={{
              display: 'block',
              padding: '0.75rem 1.5rem',
              color: 'var(--color-foreground)',
              textDecoration: 'none',
              borderLeft: isActive(item.href) ? '3px solid var(--color-accent)' : '3px solid transparent',
              backgroundColor: isActive(item.href) ? 'var(--color-background)' : 'transparent',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              if (!isActive(item.href)) {
                e.currentTarget.style.backgroundColor = 'var(--color-background)'
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive(item.href)) {
                e.currentTarget.style.backgroundColor = 'transparent'
              }
            }}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      {/* Theme Switcher */}
      <div
        style={{
          borderTop: '1px solid var(--color-border)',
          padding: '1.5rem',
          position: 'relative',
        }}
      >
        <button
          onClick={() => setShowThemeMenu(!showThemeMenu)}
          className="btn btn-secondary"
          style={{
            width: '100%',
            textAlign: 'left',
            marginBottom: showThemeMenu ? '0.75rem' : 0,
          }}
        >
          🎨 {themes[currentTheme].label}
        </button>

        {showThemeMenu && (
          <div
            style={{
              backgroundColor: 'var(--color-background)',
              border: '1px solid var(--color-border)',
              borderRadius: '0.5rem',
              overflow: 'hidden',
            }}
          >
            {Object.entries(themes).map(([key, theme]) => (
              <button
                key={key}
                onClick={() => {
                  setTheme(key as any)
                  setShowThemeMenu(false)
                }}
                style={{
                  display: 'block',
                  width: '100%',
                  padding: '0.5rem 0.75rem',
                  textAlign: 'left',
                  backgroundColor:
                    currentTheme === key ? 'var(--color-accent)' : 'transparent',
                  color: currentTheme === key ? 'var(--color-background)' : 'var(--color-foreground)',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  transition: 'background-color 0.2s',
                }}
                onMouseEnter={(e) => {
                  if (currentTheme !== key) {
                    e.currentTarget.style.backgroundColor = 'var(--color-backgroundAlt)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (currentTheme !== key) {
                    e.currentTarget.style.backgroundColor = 'transparent'
                  }
                }}
              >
                {theme.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </aside>
  )
}
