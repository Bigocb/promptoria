/**
 * @jest-environment jsdom
 */

import React from 'react'
import { render, screen } from '@testing-library/react'

const mockPush = jest.fn()

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}))

jest.mock('@/app/providers', () => ({
  useAuth: () => ({
    user: null,
    loading: false,
    login: jest.fn(),
    signup: jest.fn(),
    logout: jest.fn(),
  }),
  useSettings: () => ({
    settings: { theme: 'gruvbox-dark', defaultModel: 'llama3.2', suggestionsEnabled: true, defaultTemperature: 0.7, defaultMaxTokens: 500 },
    updateSetting: jest.fn(),
    loading: false,
  }),
  useTheme: () => ({ currentTheme: 'gruvbox-dark', setTheme: jest.fn() }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SettingsProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  ThemeProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

import Home from '@/app/page'

describe('Landing Page', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('renders hero headline', () => {
    render(<Home />)
    expect(screen.getByText(/Save prompts you love/i)).toBeTruthy()
  })

  test('renders call to action buttons', () => {
    render(<Home />)
    expect(screen.getByText(/start for free/i)).toBeTruthy()
    expect(screen.getByText(/see how it works/i)).toBeTruthy()
  })

  test('renders how it works section', () => {
    render(<Home />)
    expect(screen.getAllByText(/save it/i).length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText(/tweak it/i)).toBeTruthy()
    expect(screen.getByText(/test it/i)).toBeTruthy()
    expect(screen.getByText(/version it/i)).toBeTruthy()
  })

  test('renders feature grid', () => {
    render(<Home />)
    expect(screen.getByText(/snippet library/i)).toBeTruthy()
    expect(screen.getByText(/smart tags/i)).toBeTruthy()
    expect(screen.getByText(/a\/b testing/i)).toBeTruthy()
    expect(screen.getAllByText(/version history/i).length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText(/workbench/i)).toBeTruthy()
  })

  test('renders recipe book badge', () => {
    render(<Home />)
    expect(screen.getByText(/prompt recipe book/i)).toBeTruthy()
  })

  test('renders navigation with login/signup links', () => {
    render(<Home />)
    expect(screen.getByText(/log in/i)).toBeTruthy()
    expect(screen.getAllByText(/get started/i).length).toBeGreaterThanOrEqual(1)
  })

  test('renders footer', () => {
    render(<Home />)
    expect(screen.getByText(/2026 promptoria/i)).toBeTruthy()
  })

  test('renders social proof quotes', () => {
    render(<Home />)
    expect(screen.getByText(/used to keep prompts/i)).toBeTruthy()
  })
})