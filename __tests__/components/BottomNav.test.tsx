/**
 * @jest-environment jsdom
 */

import React from 'react'
import { render, screen } from '@testing-library/react'
import { BottomNav } from '@/components/BottomNav'

const mockPush = jest.fn()
const mockLogout = jest.fn()

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => '/prompts',
}))

jest.mock('@/app/providers', () => ({
  useAuth: () => ({
    user: { id: '1', email: 'test@test.com' },
    loading: false,
    logout: mockLogout,
  }),
}))

describe('BottomNav', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('renders all nav items', () => {
    render(<BottomNav />)

    expect(screen.getByText('Workbench')).toBeTruthy()
    expect(screen.getByText('Test')).toBeTruthy()
    expect(screen.getByText('Library')).toBeTruthy()
    expect(screen.getByText('Settings')).toBeTruthy()
  })

  test('renders logout button', () => {
    render(<BottomNav />)

    expect(screen.getByText('Logout')).toBeTruthy()
  })

  test('calls logout on logout button click', () => {
    render(<BottomNav />)

    screen.getByText('Logout').click()
    expect(mockLogout).toHaveBeenCalled()
  })

  test('highlights active route', () => {
    render(<BottomNav />)

    const workbenchLink = screen.getByText('Workbench').closest('a')
    expect(workbenchLink?.className).toContain('bottom-nav-active')
  })
})