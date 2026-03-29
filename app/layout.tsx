export const metadata = {
  title: "PromptArchitect",
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
        <style>{`
          * { margin: 0; padding: 0; box-sizing: border-box; }
          html, body { width: 100%; height: 100%; }
        `}</style>
      </head>
      <body>
        {children}
      </body>
    </html>
  )
}
