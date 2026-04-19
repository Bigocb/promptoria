'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/app/providers'

const navItems = [
  { label: 'Workbench', href: '/prompts', icon: '⚡' },
  { label: 'Test', href: '/test', icon: '🧪' },
  { label: 'Library', href: '/library', icon: '🔍' },
  { label: 'Settings', href: '/settings', icon: '⚙️' },
]

export function BottomNav() {
  const pathname = usePathname()
  const router = useRouter()
  const { logout } = useAuth()

  const handleLogout = () => {
    logout()
    router.push('/auth/login')
  }

  return (
    <nav className="bottom-nav">
      {navItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={`bottom-nav-item${pathname === item.href ? ' bottom-nav-active' : ''}`}
        >
          <span className="bottom-nav-icon">{item.icon}</span>
          <span className="bottom-nav-label">{item.label}</span>
        </Link>
      ))}
      <button onClick={handleLogout} className="bottom-nav-item bottom-nav-logout">
        <span className="bottom-nav-icon">⏻</span>
        <span className="bottom-nav-label">Logout</span>
      </button>
    </nav>
  )
}
