import './globals.css'
import { ThemeProvider } from './providers'
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
        <ThemeProvider>
          <SidebarWrapper />
          <main style={{ marginLeft: '240px', flex: 1 }}>
            {children}
          </main>
        </ThemeProvider>
      </body>
    </html>
  )
}
