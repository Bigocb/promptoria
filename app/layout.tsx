import './globals.css'
import { ThemeProvider, AuthProvider, SettingsProvider } from './providers'
import SidebarWrapper from '@/components/SidebarWrapper'

export const dynamic = 'force-dynamic'

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
              <style>{`
                body {
                  flex-direction: row;
                }
                main.layout-main {
                  margin-left: 240px;
                  flex: 1;
                  min-width: 0;
                }
                @media (max-width: 767px) {
                  main.layout-main {
                    margin-left: 0;
                  }
                }
              `}</style>
              <SidebarWrapper />
              <main className="layout-main">
                {children}
              </main>
            </ThemeProvider>
          </SettingsProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
