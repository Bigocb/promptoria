'use client'

import { useAuth } from '@/app/providers'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'

interface SidebarProps {
  isOpen?: boolean
  onClose?: () => void
}

export function Sidebar({ isOpen = true, onClose }: SidebarProps) {
  const { user, logout } = useAuth()
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = () => {
    logout()
    router.push('/auth/login')
  }

  const isActive = (path: string) => pathname === path

  const navItems = [
    { label: '📚 Snippets', href: '/snippets' },
    { label: '⚡ Workbench', href: '/prompts' },
    { label: '🔍 Library', href: '/library' },
    { label: '📊 History', href: '/history' },
    { label: '▶️ Test', href: '/test' },
    { label: '⚙️ Settings', href: '/settings' },
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
        zIndex: 1000,
        transform: `translateX(${isOpen ? '0' : '-100%'})`,
        transition: 'transform 0.3s ease',
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
            onClick={() => onClose?.()}
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

      {/* User Info & Logout */}
      {user && (
        <div
          style={{
            borderTop: '1px solid var(--color-border)',
            padding: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
          }}
        >
          <div
            style={{
              color: 'var(--color-text-secondary)',
              fontSize: '0.875rem',
              wordBreak: 'break-all',
            }}
          >
            {user.email}
          </div>
          <button
            onClick={handleLogout}
            style={{
              width: '100%',
              padding: '0.5rem',
              backgroundColor: 'var(--color-accent)',
              color: 'var(--color-background)',
              border: 'none',
              borderRadius: '0.25rem',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: '500',
              transition: 'opacity 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = '0.9'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = '1'
            }}
          >
            Logout
          </button>
        </div>
      )}
    </aside>
  )
}
