export default function Home() {
  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(to bottom, #0f172a, #1e293b)', color: 'white', padding: '2rem' }}>
      <header style={{ borderBottom: '1px solid #475569', paddingBottom: '1.5rem', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>PromptArchitect</h1>
        <p style={{ color: '#cbd5e1' }}>Modular, versioned prompt management</p>
      </header>

      <main>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
          <div style={{ border: '1px solid #475569', borderRadius: '0.5rem', padding: '1.5rem', backgroundColor: '#1e293b' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.5rem' }}>📚 Snippet Library</h2>
            <p style={{ fontSize: '0.875rem', color: '#94a3b8' }}>Manage reusable text blocks</p>
          </div>

          <div style={{ border: '1px solid #475569', borderRadius: '0.5rem', padding: '1.5rem', backgroundColor: '#1e293b' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.5rem' }}>⚡ Prompt Workspace</h2>
            <p style={{ fontSize: '0.875rem', color: '#94a3b8' }}>Build and compose prompts</p>
          </div>

          <div style={{ border: '1px solid #475569', borderRadius: '0.5rem', padding: '1.5rem', backgroundColor: '#1e293b' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.5rem' }}>📊 Version History</h2>
            <p style={{ fontSize: '0.875rem', color: '#94a3b8' }}>Compare and manage versions</p>
          </div>

          <div style={{ border: '1px solid #475569', borderRadius: '0.5rem', padding: '1.5rem', backgroundColor: '#1e293b' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.5rem' }}>▶️ Test Runner</h2>
            <p style={{ fontSize: '0.875rem', color: '#94a3b8' }}>Execute and test prompts</p>
          </div>
        </div>

        <div style={{ border: '1px solid #475569', borderRadius: '0.5rem', padding: '1.5rem', backgroundColor: '#1e293b' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>Getting Started</h2>
          <div style={{ color: '#cbd5e1' }}>
            <p style={{ marginBottom: '1rem' }}>✅ App is running! You can now navigate to the different sections.</p>
            <p style={{ marginBottom: '0.5rem' }}>Next steps:</p>
            <ul style={{ marginLeft: '1.5rem', listStyle: 'disc' }}>
              <li>Create snippets at /snippets</li>
              <li>Build prompts at /prompts</li>
              <li>Test prompts at /test</li>
              <li>View history at /history</li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  )
}
