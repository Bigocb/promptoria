export type ThemeName = 'gruvbox-dark' | 'gruvbox-light' | 'solarized-dark' | 'monokai' | 'custom-dark'

export interface Theme {
  name: ThemeName
  label: string
  colors: {
    background: string
    backgroundAlt: string
    foreground: string
    foregroundAlt: string
    border: string
    accent: string
    accentAlt: string
    success: string
    error: string
    warning: string
  }
}

export const themes: Record<ThemeName, Theme> = {
  'gruvbox-dark': {
    name: 'gruvbox-dark',
    label: 'Gruvbox Dark',
    colors: {
      background: '#282828',
      backgroundAlt: '#1d2021',
      foreground: '#ebdbb2',
      foregroundAlt: '#d5c4a1',
      border: '#504945',
      accent: '#fe8019',
      accentAlt: '#d65d0e',
      success: '#b8bb26',
      error: '#fb4934',
      warning: '#fabd2f',
    },
  },
  'gruvbox-light': {
    name: 'gruvbox-light',
    label: 'Gruvbox Light',
    colors: {
      background: '#f9f5d5',
      backgroundAlt: '#f2e5bc',
      foreground: '#3c3836',
      foregroundAlt: '#504945',
      border: '#d5c4a1',
      accent: '#d65d0e',
      accentAlt: '#af3a03',
      success: '#6f8e23',
      error: '#cc241d',
      warning: '#b57614',
    },
  },
  'solarized-dark': {
    name: 'solarized-dark',
    label: 'Solarized Dark',
    colors: {
      background: '#002b36',
      backgroundAlt: '#073642',
      foreground: '#839496',
      foregroundAlt: '#93a1a1',
      border: '#586e75',
      accent: '#268bd2',
      accentAlt: '#2aa198',
      success: '#859900',
      error: '#dc322f',
      warning: '#b58900',
    },
  },
  'monokai': {
    name: 'monokai',
    label: 'Monokai',
    colors: {
      background: '#272822',
      backgroundAlt: '#1e1f1c',
      foreground: '#f8f8f2',
      foregroundAlt: '#e6db74',
      border: '#49483e',
      accent: '#f92672',
      accentAlt: '#fd971f',
      success: '#a6e22e',
      error: '#f92672',
      warning: '#fd971f',
    },
  },
  'custom-dark': {
    name: 'custom-dark',
    label: 'Custom Dark',
    colors: {
      background: '#0f0f0f',
      backgroundAlt: '#1a1a1a',
      foreground: '#e0e0e0',
      foregroundAlt: '#b0b0b0',
      border: '#333333',
      accent: '#00d4ff',
      accentAlt: '#00a8cc',
      success: '#00ff41',
      error: '#ff006e',
      warning: '#ffbe0b',
    },
  },
}

export const defaultTheme: ThemeName = 'gruvbox-dark'
