/**
 * @jest-environment jsdom
 */

import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import DashboardPage from '@/app/dashboard/page'

const mockPush = jest.fn()

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}))

jest.mock('@/app/providers', () => ({
  useAuth: () => ({
    user: { id: '1', email: 'test@example.com' },
    loading: false,
    login: jest.fn(),
    signup: jest.fn(),
    logout: jest.fn(),
  }),
}))

jest.mock('@/lib/api-config', () => ({
  API_ENDPOINTS: {
    dashboard: { stats: 'http://localhost:3000/api/dashboard/stats' },
  },
}))

describe('Dashboard Page', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    Storage.prototype.getItem = jest.fn(() => 'mock-token')
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        workspace: { name: 'Test' },
        resources: { prompts: 0, snippets: 0 },
        recent: { prompts: [], snippets: [] },
      }),
    })
  })

  test('renders welcome back heading', async () => {
    render(<DashboardPage />)
    await waitFor(() => {
      expect(screen.getByText(/welcome back/i)).toBeTruthy()
    })
  })

  test('renders quick action links', async () => {
    render(<DashboardPage />)
    await waitFor(() => {
      expect(screen.getByText(/new prompt/i)).toBeTruthy()
      expect(screen.getByText(/new snippet/i)).toBeTruthy()
      expect(screen.getByText(/library/i)).toBeTruthy()
      expect(screen.getByText(/test runner/i)).toBeTruthy()
    })
  })

  test('renders recent prompts section', async () => {
    render(<DashboardPage />)
    await waitFor(() => {
      expect(screen.getByText(/recent prompts/i)).toBeTruthy()
    })
  })

  test('renders recent snippets section', async () => {
    render(<DashboardPage />)
    await waitFor(() => {
      expect(screen.getByText(/recent snippets/i)).toBeTruthy()
    })
  })

  test('shows prompt count after loading', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        workspace: { name: 'Test Workspace' },
        resources: { prompts: 5, snippets: 3 },
        recent: { prompts: [], snippets: [] },
      }),
    })
    render(<DashboardPage />)
    await waitFor(() => {
      expect(screen.getByText(/5 prompts/i)).toBeTruthy()
      expect(screen.getByText(/3 snippets/i)).toBeTruthy()
    })
  })

  test('shows no prompts yet when count is zero', async () => {
    render(<DashboardPage />)
    await waitFor(() => {
      expect(screen.getByText(/no prompts yet/i) || screen.getByText(/0 prompts/i)).toBeTruthy()
    })
  })
})