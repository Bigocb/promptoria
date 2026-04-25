/**
 * @jest-environment jsdom
 */

import React from 'react'
import { render, screen } from '@testing-library/react'
import { Sidebar } from '@/components/Sidebar'

const mockPush = jest.fn()
const mockLogout = jest.fn()

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => '/dashboard',
}))

jest.mock('@/app/providers', () => ({
  useAuth: () => ({
    user: { id: '1', email: 'test@example.com' },
    loading: false,
    logout: mockLogout,
  }),
}))

describe('Sidebar', () => {
  test('renders all navigation items', () => {
    render(<Sidebar />)

    expect(screen.getByText(/Dashboard/)).toBeTruthy()
    expect(screen.getByText(/Snippets/)).toBeTruthy()
    expect(screen.getByText(/Workbench/)).toBeTruthy()
    expect(screen.getByText(/Library/)).toBeTruthy()
    expect(screen.getByText(/History/)).toBeTruthy()
    expect(screen.getByText(/Test/)).toBeTruthy()
    expect(screen.getByText(/Settings/)).toBeTruthy()
  })

  test('displays user email', () => {
    render(<Sidebar />)

    expect(screen.getByText('test@example.com')).toBeTruthy()
  })

  test('renders logout button', () => {
    render(<Sidebar />)

    expect(screen.getByText('Logout')).toBeTruthy()
  })

  test('renders logo and brand name', () => {
    render(<Sidebar />)

    expect(screen.getByText('Promptoria')).toBeTruthy()
  })

  test('applies active styling to current route', () => {
    render(<Sidebar />)

    const dashboardLink = screen.getByText(/Dashboard/).closest('a')
    expect(dashboardLink?.style.borderLeft).toContain('3px solid var(--color-accent)')
  })

  test('calls onClose when nav item is clicked', () => {
    const onClose = jest.fn()
    render(<Sidebar onClose={onClose} />)

    const snippetsLink = screen.getByText(/Snippets/)
    snippetsLink.click()

    expect(onClose).toHaveBeenCalled()
  })

  test('handles logout click', () => {
    render(<Sidebar />)

    const logoutBtn = screen.getByText('Logout')
    logoutBtn.click()

    expect(mockLogout).toHaveBeenCalled()
  })
})