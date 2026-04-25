export default function TermsOfServicePage() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-background)', color: 'var(--color-foreground)' }}>
      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '1rem' }}>Terms of Service</h1>
        <p style={{ color: 'var(--color-foregroundAlt)', marginBottom: '2rem' }}>Last updated: April 2026</p>

        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '0.5rem' }}>1. Acceptance of Terms</h2>
          <p style={{ lineHeight: '1.6', color: 'var(--color-foregroundAlt)' }}>
            By using Promptoria, you agree to these terms. If you do not agree, please do not use the service.
          </p>
        </section>

        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '0.5rem' }}>2. Description of Service</h2>
          <p style={{ lineHeight: '1.6', color: 'var(--color-foregroundAlt)' }}>
            Promptoria is a prompt management tool that lets you save, organize, version, and test AI prompts. The service is provided as-is and may be modified or discontinued at any time.
          </p>
        </section>

        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '0.5rem' }}>3. Account Responsibilities</h2>
          <p style={{ lineHeight: '1.6', color: 'var(--color-foregroundAlt)' }}>
            You are responsible for maintaining the security of your account credentials. You must not share your password with others. You are responsible for all activity that occurs under your account.
          </p>
        </section>

        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '0.5rem' }}>4. User Content</h2>
          <p style={{ lineHeight: '1.6', color: 'var(--color-foregroundAlt)' }}>
            You retain ownership of all prompts, snippets, and other content you create. By using the service, you grant us a limited license to store and process your content to provide the service. We do not claim ownership of your content.
          </p>
        </section>

        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '0.5rem' }}>5. Acceptable Use</h2>
          <p style={{ lineHeight: '1.6', color: 'var(--color-foregroundAlt)' }}>
            You agree not to use the service for illegal purposes, attempt to gain unauthorized access, or abuse the rate limits. We reserve the right to suspend accounts that violate these terms.
          </p>
        </section>

        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '0.5rem' }}>6. Service Availability</h2>
          <p style={{ lineHeight: '1.6', color: 'var(--color-foregroundAlt)' }}>
            We strive for high availability but do not guarantee uptime. Scheduled maintenance and unexpected outages may occur. We will make reasonable efforts to notify users of planned downtime.
          </p>
        </section>

        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '0.5rem' }}>7. Limitation of Liability</h2>
          <p style={{ lineHeight: '1.6', color: 'var(--color-foregroundAlt)' }}>
            Promptoria is provided &quot;as is&quot; without warranties of any kind. We are not liable for any loss of data, service interruptions, or damages arising from use of the service.
          </p>
        </section>

        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '0.5rem' }}>8. Changes to Terms</h2>
          <p style={{ lineHeight: '1.6', color: 'var(--color-foregroundAlt)' }}>
            We may update these terms from time to time. Continued use of the service after changes constitutes acceptance of the new terms.
          </p>
        </section>

        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '0.5rem' }}>9. Contact</h2>
          <p style={{ lineHeight: '1.6', color: 'var(--color-foregroundAlt)' }}>
            For questions about these terms, contact us at legal@promptoria.me.
          </p>
        </section>

        <div style={{ marginTop: '3rem', borderTop: '1px solid var(--color-border)', paddingTop: '1rem' }}>
          <a href="/" style={{ color: 'var(--color-accent)', fontSize: '0.9rem' }}>Back to Promptoria</a>
        </div>
      </div>
    </div>
  )
}