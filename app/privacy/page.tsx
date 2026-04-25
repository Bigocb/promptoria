export default function PrivacyPolicyPage() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-background)', color: 'var(--color-foreground)' }}>
      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '1rem' }}>Privacy Policy</h1>
        <p style={{ color: 'var(--color-foregroundAlt)', marginBottom: '2rem' }}>Last updated: April 2026</p>

        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '0.5rem' }}>1. Information We Collect</h2>
          <p style={{ lineHeight: '1.6', color: 'var(--color-foregroundAlt)' }}>
            We collect information you provide directly: your email address and password (hashed) when you create an account. We also store the prompts, snippets, and test results you create. If you sign in with Google, we receive your Google account email and profile name.
          </p>
        </section>

        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '0.5rem' }}>2. How We Use Your Information</h2>
          <p style={{ lineHeight: '1.6', color: 'var(--color-foregroundAlt)' }}>
            We use your information to provide and improve the Promptoria service, authenticate your account, send you password reset emails, and communicate about your account. We do not sell your personal information to third parties.
          </p>
        </section>

        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '0.5rem' }}>3. Data Storage & Security</h2>
          <p style={{ lineHeight: '1.6', color: 'var(--color-foregroundAlt)' }}>
            Your data is stored on secure servers. Passwords are hashed using bcrypt. We use JWT tokens for authentication with 7-day expiry and 30-day refresh tokens. We implement rate limiting on authentication endpoints to prevent abuse.
          </p>
        </section>

        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '0.5rem' }}>4. AI Provider Data</h2>
          <p style={{ lineHeight: '1.6', color: 'var(--color-foregroundAlt)' }}>
            When you run tests on prompts, the prompt content is sent to Ollama Cloud for processing. Their privacy policy applies to data they process. We do not store AI responses beyond what you see in your test results.
          </p>
        </section>

        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '0.5rem' }}>5. Cookies & Local Storage</h2>
          <p style={{ lineHeight: '1.6', color: 'var(--color-foregroundAlt)' }}>
            We use local storage to save your authentication token, theme preferences, and settings. We use httpOnly cookies for OAuth state management. We do not use third-party tracking cookies.
          </p>
        </section>

        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '0.5rem' }}>6. Your Rights</h2>
          <p style={{ lineHeight: '1.6', color: 'var(--color-foregroundAlt)' }}>
            You can export your data at any time using the export feature. You can delete your account by contacting us. You can opt out of non-essential communications.
          </p>
        </section>

        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '0.5rem' }}>7. Contact</h2>
          <p style={{ lineHeight: '1.6', color: 'var(--color-foregroundAlt)' }}>
            For privacy-related questions, contact us at privacy@promptoria.me.
          </p>
        </section>

        <div style={{ marginTop: '3rem', borderTop: '1px solid var(--color-border)', paddingTop: '1rem' }}>
          <a href="/" style={{ color: 'var(--color-accent)', fontSize: '0.9rem' }}>Back to Promptoria</a>
        </div>
      </div>
    </div>
  )
}