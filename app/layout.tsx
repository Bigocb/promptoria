import './globals.css'
import { ThemeProvider, AuthProvider, SettingsProvider } from './providers'
import SidebarWrapper from '@/components/SidebarWrapper'

export const metadata = {
  title: "Promptoria",
  description: "Modular, versioned prompt management system",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head />
      <body style={{ display: 'flex', margin: 0, padding: 0 }}>
        <AuthProvider>
          <SettingsProvider>
            <ThemeProvider>
              <SidebarWrapper />
              <main style={{ flex: 1, marginLeft: '240px' }}>
                {children}
              </main>
            </ThemeProvider>
          </SettingsProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
