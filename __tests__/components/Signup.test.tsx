/**
 * @jest-environment jsdom
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import SignupPage from '@/app/auth/signup/page'

const mockPush = jest.fn()
const mockSignup = jest.fn()

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}))

jest.mock('@/app/providers', () => ({
  useAuth: () => ({
    user: null,
    loading: false,
    signup: mockSignup,
    login: jest.fn(),
    logout: jest.fn(),
    loginWithGoogle: jest.fn(),
  }),
}))

describe('Signup Page', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('renders signup form with all fields', () => {
    render(<SignupPage />)
    expect(screen.getByLabelText(/email/i)).toBeTruthy()
    expect(screen.getAllByLabelText(/password/i).length).toBeGreaterThanOrEqual(1)
    expect(screen.getByLabelText(/confirm password/i)).toBeTruthy()
  })

  test('renders create account button', () => {
    render(<SignupPage />)
    expect(screen.getByRole('button', { name: /create account/i })).toBeTruthy()
  })

  test('renders link to login page', () => {
    render(<SignupPage />)
    expect(screen.getByText(/sign in/i)).toBeTruthy()
  })

  test('renders Promptoria branding', () => {
    render(<SignupPage />)
    expect(screen.getByText('Promptoria')).toBeTruthy()
  })

  test('renders tagline', () => {
    render(<SignupPage />)
    expect(screen.getByText(/recipe book/i)).toBeTruthy()
  })

  test('shows password requirements hint', () => {
    render(<SignupPage />)
    expect(screen.getByText(/uppercase, lowercase, and a number/i)).toBeTruthy()
  })

  test('shows error message on signup failure', async () => {
    mockSignup.mockRejectedValueOnce(new Error('Email already exists'))
    render(<SignupPage />)

    const emailInput = screen.getByLabelText(/email/i)
    const passwordInputs = screen.getAllByLabelText(/password/i)
    const confirmInput = screen.getByLabelText(/confirm password/i)
    const submitButton = screen.getByRole('button', { name: /create account/i })

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    fireEvent.change(passwordInputs[0], { target: { value: 'Password1' } })
    fireEvent.change(confirmInput, { target: { value: 'Password1' } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/email already exists/i)).toBeTruthy()
    })
  })
})