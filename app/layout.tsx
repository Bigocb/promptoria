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
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body style={{ display: 'flex', margin: 0, padding: 0, flexDirection: 'column' }}>
        <AuthProvider>
          <SettingsProvider>
            <ThemeProvider>
              <style>{`
                @media (min-width: 768px) {
                  body { flex-direction: row; }
                  main.layout-main { margin-left: 240px; }
                }
                @media (max-width: 767px) {
                  body { flex-direction: column; }
                  main.layout-main { margin-left: 0; }
                }
              `}</style>
              <SidebarWrapper />
              <main className="layout-main" style={{ flex: 1, marginLeft: 0 }}>
                {children}
              </main>
            </ThemeProvider>
          </SettingsProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
