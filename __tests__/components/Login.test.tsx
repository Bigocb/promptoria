/**
 * @jest-environment jsdom
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import LoginPage from '@/app/auth/login/page'

const mockPush = jest.fn()
const mockLogin = jest.fn()

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}))

jest.mock('@/app/providers', () => ({
  useAuth: () => ({
    user: null,
    loading: false,
    login: mockLogin,
    signup: jest.fn(),
    logout: jest.fn(),
  }),
}))

describe('Login Page', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('renders login form with email and password fields', () => {
    render(<LoginPage />)
    expect(screen.getByLabelText(/email/i)).toBeTruthy()
    expect(screen.getByLabelText(/password/i)).toBeTruthy()
  })

  test('renders sign in button', () => {
    render(<LoginPage />)
    expect(screen.getByRole('button', { name: /sign in/i })).toBeTruthy()
  })

  test('renders link to signup page', () => {
    render(<LoginPage />)
    expect(screen.getByText(/create one/i)).toBeTruthy()
  })

  test('renders Promptoria branding', () => {
    render(<LoginPage />)
    expect(screen.getByText('Promptoria')).toBeTruthy()
  })

  test('renders tagline', () => {
    render(<LoginPage />)
    expect(screen.getByText(/recipe book/i)).toBeTruthy()
  })

  test('disables button and shows loading state when submitting', async () => {
    mockLogin.mockImplementation(() => new Promise(() => {}))
    render(<LoginPage />)

    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const submitButton = screen.getByRole('button', { name: /sign in/i })

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'password123')
    })
  })

  test('shows error message on login failure', async () => {
    mockLogin.mockRejectedValueOnce(new Error('Invalid credentials'))
    render(<LoginPage />)

    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const submitButton = screen.getByRole('button', { name: /sign in/i })

    fireEvent.change(emailInput, { target: { value: 'bad@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'wrong' } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/invalid credentials/i)).toBeTruthy()
    })
  })

  test('has tagline text', () => {
    render(<LoginPage />)
    expect(screen.getByText(/recipe book/i)).toBeTruthy()
  })
})