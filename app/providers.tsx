'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { ThemeName, themes, defaultTheme } from '@/lib/themes'

interface ThemeContextType {
  currentTheme: ThemeName
  setTheme: (theme: ThemeName) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [currentTheme, setCurrentTheme] = useState<ThemeName>(defaultTheme)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    // Load theme from localStorage
    const saved = localStorage.getItem('promptoria-theme') as ThemeName | null
    if (saved && saved in themes) {
      setCurrentTheme(saved)
    }
    setMounted(true)
  }, [])

  const handleSetTheme = (theme: ThemeName) => {
    setCurrentTheme(theme)
    localStorage.setItem('promptoria-theme', theme)
  }

  // Apply theme to document
  useEffect(() => {
    if (!mounted) return

    const theme = themes[currentTheme]
    const root = document.documentElement

    Object.entries(theme.colors).forEach(([key, value]) => {
      root.style.setProperty(`--color-${key}`, value)
    })
  }, [currentTheme, mounted])

  if (!mounted) {
    return <>{children}</>
  }

  return (
    <ThemeContext.Provider value={{ currentTheme, setTheme: handleSetTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within ThemeProvider')
  }
  return context
}
