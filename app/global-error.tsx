'use client'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html>
      <body style={{ padding: '2rem', textAlign: 'center', color: '#fff', background: '#0f172a', minHeight: '100vh' }}>
        <h1>Application Error</h1>
        <p>{error.message}</p>
        <button onClick={reset} style={{ padding: '10px 20px', cursor: 'pointer', marginTop: '1rem' }}>
          Try again
        </button>
      </body>
    </html>
  )
}
