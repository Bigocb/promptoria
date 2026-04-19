'use client'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div style={{ padding: '2rem', textAlign: 'center', color: '#fff', background: '#0f172a', minHeight: '100vh' }}>
      <h1>Something went wrong</h1>
      <p>{error.message}</p>
      <button onClick={reset} style={{ padding: '10px 20px', cursor: 'pointer' }}>
        Try again
      </button>
    </div>
  )
}
