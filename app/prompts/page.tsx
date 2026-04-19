'use client'

import Link from 'next/link'

export default function PromptsPage() {
  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <header style={{ marginBottom: '2rem' }}>
        <Link
          href="/dashboard"
          style={{
            display: 'inline-block',
            marginBottom: '1rem',
            color: '#0066cc',
            textDecoration: 'none'
          }}
        >
          ← Dashboard
        </Link>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
          ⚡ Workbench
        </h1>
        <p style={{ color: '#666', marginBottom: '1.5rem' }}>
          Phase 1 Backend Ready - API endpoints operational
        </p>
      </header>

      <div style={{ backgroundColor: '#f5f5f5', padding: '1.5rem', borderRadius: '0.5rem' }}>
        <h2 style={{ marginBottom: '1rem' }}>Phase 1 Status</h2>
        <ul style={{ lineHeight: '1.8', color: '#333' }}>
          <li>✅ JWT Authentication (signup/login)</li>
          <li>✅ Offline-First Sync API</li>
          <li>✅ PostgreSQL Database Connected</li>
          <li>🚀 Ready for Production</li>
        </ul>
      </div>

      <div style={{ marginTop: '2rem', padding: '1rem', backgroundColor: '#e8f4f8', borderRadius: '0.5rem' }}>
        <h3 style={{ marginBottom: '0.5rem' }}>API Endpoints</h3>
        <p>POST /api/auth/signup - Register a new user</p>
        <p>POST /api/auth/login - Login with email/password</p>
        <p>GET /api/sync - Sync changes (requires Bearer token)</p>
      </div>
    </div>
  )
}
