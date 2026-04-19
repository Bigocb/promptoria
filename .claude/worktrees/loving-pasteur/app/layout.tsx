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
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
      </head>
      <body style={{ display: 'flex', margin: 0, padding: 0 }}>
        <AuthProvider>
          <SettingsProvider>
            <ThemeProvider>
              <style>{`
                body {
                  flex-direction: row;
                  overflow-x: hidden;
                  max-width: 100vw;
                  width: 100%;
                }
                main.layout-main {
                  margin-left: 240px;
                  flex: 1;
                  overflow-x: hidden;
                  max-width: calc(100vw - 240px);
                  min-width: 0;
                  width: 100%;
                  box-sizing: border-box;
                }
                @media (max-width: 767px) {
                  main.layout-main {
                    margin-left: 0;
                    max-width: 100vw;
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
