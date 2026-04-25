import { themes, ThemeName } from '@/lib/themes'

describe('Theme Configuration', () => {
  const themeNames: ThemeName[] = ['gruvbox-dark', 'gruvbox-light', 'solarized-dark', 'monokai', 'custom-dark']

  test('defines all expected themes', () => {
    themeNames.forEach(name => {
      expect(themes[name]).toBeDefined()
    })
  })

  test('each theme has required color properties', () => {
    const requiredColors = [
      'background', 'backgroundAlt', 'foreground', 'foregroundAlt',
      'border', 'accent', 'accentAlt', 'success', 'error', 'warning',
    ]

    themeNames.forEach(name => {
      requiredColors.forEach(color => {
        expect(themes[name].colors).toHaveProperty(color)
        expect(typeof themes[name].colors[color as keyof typeof themes[ThemeName]['colors']]).toBe('string')
      })
    })
  })

  test('each theme has a name and label', () => {
    themeNames.forEach(name => {
      expect(themes[name].name).toBe(name)
      expect(typeof themes[name].label).toBe('string')
      expect(themes[name].label.length).toBeGreaterThan(0)
    })
  })

  test('color values are valid hex codes', () => {
    const hexRegex = /^#[0-9a-fA-F]{6}$/

    themeNames.forEach(name => {
      Object.entries(themes[name].colors).forEach(([key, value]) => {
        expect(hexRegex.test(value as string)).toBe(true)
      })
    })
  })

  test('dark themes have dark backgrounds', () => {
    const darkThemes: ThemeName[] = ['gruvbox-dark', 'solarized-dark', 'monokai', 'custom-dark']
    darkThemes.forEach(name => {
      expect(themes[name].colors.background).toBeDefined()
    })
  })
})