import './globals.css'
import { ThemeProvider, AuthProvider, SettingsProvider } from './providers'
import SidebarWrapper from '@/components/SidebarWrapper'

export const dynamic = 'force-dynamic'
export const revalidate = 0

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
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
      </head>
        <body style={{ display: 'flex', margin: 0, padding: 0 }}>
        <AuthProvider>
          <SettingsProvider>
            <ThemeProvider>
              <SidebarWrapper />
              <main className="layout-main" style={{ flex: 1, minWidth: 0 }}>
                {children}
              </main>
            </ThemeProvider>
          </SettingsProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
