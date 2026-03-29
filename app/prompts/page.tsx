'use client'

export default function PromptsPage() {
  return (
    <div style={{ padding: '2rem' }}>
      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>⚡ Prompt Workspace</h1>
        <p style={{ color: 'var(--color-foregroundAlt)', marginBottom: '1.5rem' }}>
          Build complete prompts by composing snippets and defining variables
        </p>

        <div className="card" style={{ backgroundColor: 'var(--color-background)', padding: '1rem', marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: '600', color: 'var(--color-accent)', marginBottom: '0.75rem' }}>
            💡 What is a Prompt?
          </h3>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-foregroundAlt)', marginBottom: '1rem', lineHeight: '1.5' }}>
            A prompt is a complete message you send to an LLM (ChatGPT, Claude, etc.). It can include:
          </p>
          <ul style={{ fontSize: '0.875rem', color: 'var(--color-foregroundAlt)', marginLeft: '1.5rem', listStyle: 'disc', marginBottom: '1rem' }}>
            <li><strong>System prompt:</strong> Instructions for how the AI should behave</li>
            <li><strong>Examples:</strong> Few-shot examples of input/output pairs</li>
            <li><strong>Template:</strong> The actual request with placeholders for variables</li>
            <li><strong>Context:</strong> Background information or constraints</li>
          </ul>
        </div>

        <div className="card" style={{ backgroundColor: 'var(--color-background)', padding: '1rem' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: '600', color: 'var(--color-accent)', marginBottom: '0.75rem' }}>
            🔄 Workflow
          </h3>
          <ol style={{ fontSize: '0.875rem', color: 'var(--color-foregroundAlt)', marginLeft: '1.5rem', listStyle: 'decimal' }}>
            <li style={{ marginBottom: '0.5rem' }}>Create <strong>snippets</strong> (reusable pieces) in the Snippet Library</li>
            <li style={{ marginBottom: '0.5rem' }}>Compose them here into a complete prompt</li>
            <li style={{ marginBottom: '0.5rem' }}>Add variables like {"{topic}"} or {"{style}"}</li>
            <li style={{ marginBottom: '0.5rem' }}>Test the prompt in the Test Runner</li>
            <li>Track all versions in Version History</li>
          </ol>
        </div>
      </header>

      <div className="card" style={{ textAlign: 'center', padding: '3rem', marginTop: '2rem' }}>
        <p style={{ fontSize: '1.125rem', fontWeight: '600', color: 'var(--color-foregroundAlt)', marginBottom: '1rem' }}>
          Coming soon! 🚀
        </p>
        <p style={{ fontSize: '0.875rem', color: 'var(--color-foregroundAlt)' }}>
          First, create some snippets in the <strong>Snippet Library</strong>. Then you'll be able to compose them here.
        </p>
      </div>
    </div>
  )
}
