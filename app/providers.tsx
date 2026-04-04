'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { ThemeName, themes, defaultTheme } from '@/lib/themes'
import { API_ENDPOINTS } from '@/lib/api-config'

interface ThemeContextType {
  currentTheme: ThemeName
  setTheme: (theme: ThemeName) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [currentTheme, setCurrentTheme] = useState<ThemeName>(defaultTheme)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)

    // Load theme from localStorage
    const saved = localStorage.getItem('promptoria-theme') as ThemeName | null
    if (saved && saved in themes) {
      setCurrentTheme(saved)
    }

    // Listen for theme changes from SettingsProvider
    const handleThemeChanged = (event: CustomEvent) => {
      const newTheme = event.detail.theme as ThemeName
      if (newTheme in themes) {
        setCurrentTheme(newTheme)
      }
    }

    window.addEventListener('theme-changed', handleThemeChanged as EventListener)
    return () => window.removeEventListener('theme-changed', handleThemeChanged as EventListener)
  }, [])

  const handleSetTheme = (theme: ThemeName) => {
    setCurrentTheme(theme)
    localStorage.setItem('promptoria-theme', theme)
  }

  // Apply theme to document
  useEffect(() => {
    const theme = themes[currentTheme]
    const root = document.documentElement

    Object.entries(theme.colors).forEach(([key, value]) => {
      root.style.setProperty(`--color-${key}`, value)
    })
  }, [currentTheme])

  return (
    <ThemeContext.Provider value={{ currentTheme, setTheme: handleSetTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)

  if (!context) {
    // Return default theme during SSR/hydration
    return {
      currentTheme: defaultTheme,
      setTheme: () => {},
    }
  }

  return context
}

// ============================================================
// Auth Provider
// ============================================================

interface User {
  id: string
  email: string
}

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  signup: (email: string, password: string, confirmPassword: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  // Initialize auth from localStorage
  useEffect(() => {
    const token = localStorage.getItem('auth-token')
    const userStr = localStorage.getItem('auth-user')

    if (token && userStr) {
      try {
        const userData = JSON.parse(userStr)
        setUser(userData)
      } catch (error) {
        console.error('Failed to parse user data:', error)
        localStorage.removeItem('auth-token')
        localStorage.removeItem('auth-user')
      }
    }

    setLoading(false)
  }, [])

  const login = async (email: string, password: string) => {
    try {
      const res = await fetch(API_ENDPOINTS.auth.login, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.detail || error.error || 'Login failed')
      }

      const data = await res.json()
      localStorage.setItem('auth-token', data.access_token)
      localStorage.setItem('auth-user', JSON.stringify(data.user))
      setUser(data.user)
    } catch (error) {
      throw error
    }
  }

  const signup = async (email: string, password: string, confirmPassword: string) => {
    try {
      const res = await fetch(API_ENDPOINTS.auth.signup, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.detail || error.error || 'Signup failed')
      }

      const data = await res.json()
      localStorage.setItem('auth-token', data.access_token)
      localStorage.setItem('auth-user', JSON.stringify(data.user))
      setUser(data.user)
    } catch (error) {
      throw error
    }
  }

  const logout = () => {
    localStorage.removeItem('auth-token')
    localStorage.removeItem('auth-user')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    // Return default during SSR/hydration
    return {
      user: null,
      loading: true,
      login: async () => {},
      signup: async () => {},
      logout: () => {},
    }
  }

  return context
}

// ============================================================
// Settings Provider
// ============================================================

export interface UserSettings {
  theme: ThemeName
  suggestionsEnabled: boolean
  defaultModel: string
  defaultTemperature: number
  defaultMaxTokens: number
}

interface SettingsContextType {
  settings: UserSettings
  updateSetting: (key: keyof UserSettings, value: any) => Promise<void>
  loading: boolean
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined)

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<UserSettings>({
    theme: defaultTheme,
    suggestionsEnabled: true,
    defaultModel: 'claude-3-haiku',
    defaultTemperature: 0.7,
    defaultMaxTokens: 500,
  })
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  // Initialize settings from localStorage and fetch from database
  useEffect(() => {
    const loadSettings = async () => {
      try {
        // Try to load from localStorage first
        const saved = localStorage.getItem('user-settings')
        if (saved) {
          setSettings(JSON.parse(saved))
        }

        // If user is logged in, fetch from database
        if (user) {
          const token = localStorage.getItem('auth-token')
          if (token) {
            const res = await fetch(API_ENDPOINTS.settings.get, {
              headers: {
                'Authorization': `Bearer ${token}`,
              },
            })
            if (res.ok) {
              const data = await res.json()
              setSettings(data)
              localStorage.setItem('user-settings', JSON.stringify(data))
            }
          }
        }
      } catch (error) {
        console.error('Failed to load settings:', error)
      } finally {
        setLoading(false)
      }
    }

    loadSettings()
  }, [user])

  const updateSetting = async (key: keyof UserSettings, value: any) => {
    const updated = { ...settings, [key]: value }
    setSettings(updated)
    localStorage.setItem('user-settings', JSON.stringify(updated))

    // If theme is being updated, also update the ThemeProvider's localStorage key
    if (key === 'theme') {
      localStorage.setItem('promptoria-theme', value)
      // Trigger a custom event so ThemeProvider can react to it
      window.dispatchEvent(new CustomEvent('theme-changed', { detail: { theme: value } }))
    }

    // Save to database if user is logged in
    if (user) {
      try {
        const token = localStorage.getItem('auth-token')
        if (token) {
          await fetch(API_ENDPOINTS.settings.update, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify(updated),
          })
        }
      } catch (error) {
        console.error('Failed to save settings:', error)
      }
    }
  }

  return (
    <SettingsContext.Provider value={{ settings, updateSetting, loading }}>
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettings() {
  const context = useContext(SettingsContext)

  if (!context) {
    // Return default during SSR/hydration
    return {
      settings: {
        theme: defaultTheme,
        suggestionsEnabled: true,
        defaultModel: 'claude-3-haiku',
        defaultTemperature: 0.7,
        defaultMaxTokens: 500,
      },
      updateSetting: async () => {},
      loading: true,
    }
  }

  return context
}
