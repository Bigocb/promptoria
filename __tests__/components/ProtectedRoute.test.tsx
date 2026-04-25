/**
 * @jest-environment jsdom
 */

import React from 'react'
import { render, screen } from '@testing-library/react'
import { ProtectedRoute } from '@/components/ProtectedRoute'

const mockPush = jest.fn()

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => '/',
}))

let authState = { user: null as any, loading: false, logout: jest.fn() }

jest.mock('@/app/providers', () => ({
  useAuth: () => authState,
}))

describe('ProtectedRoute', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    authState = { user: null, loading: false, logout: jest.fn() }
  })

  test('renders children when user is authenticated', () => {
    authState.user = { id: '1', email: 'test@test.com' }

    render(
      <ProtectedRoute>
        <div data-testid="protected">Protected Content</div>
      </ProtectedRoute>
    )

    expect(screen.getByTestId('protected')).toBeTruthy()
  })

  test('renders nothing when user is null and not loading', () => {
    authState.user = null
    authState.loading = false

    const { container } = render(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    )

    expect(container.innerHTML).toBe('')
  })

  test('renders nothing while loading', () => {
    authState.user = null
    authState.loading = true

    const { container } = render(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    )

    expect(container.innerHTML).toBe('')
  })

  test('redirects to login when user becomes null', async () => {
    authState.user = null
    authState.loading = false

    render(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    )

    expect(mockPush).toHaveBeenCalledWith('/auth/login')
  })

  test('does not redirect when user is authenticated', () => {
    authState.user = { id: '1', email: 'test@test.com' }

    render(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    )

    expect(mockPush).not.toHaveBeenCalled()
  })
})