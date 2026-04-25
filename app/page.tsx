'use client'

import Link from 'next/link'
import { useAuth } from './providers'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function Home() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && user) {
      router.push('/prompts')
    }
  }, [user, loading, router])

  if (loading || user) {
    return null
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--color-background)',
      color: 'var(--color-foreground)',
      overflowX: 'hidden',
    }}>
      {/* Nav */}
      <nav style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '1.25rem 2rem',
        maxWidth: '1200px',
        margin: '0 auto',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <img src="/logo.svg" alt="" style={{ width: '36px', height: '36px' }} />
          <span style={{ fontSize: '1.25rem', fontWeight: '700', letterSpacing: '-0.02em' }}>
            Promptoria
          </span>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <Link href="/auth/login" style={{
            padding: '0.5rem 1.25rem',
            color: 'var(--color-foregroundAlt)',
            textDecoration: 'none',
            fontSize: '0.9rem',
            fontWeight: '500',
            borderRadius: '0.5rem',
            transition: 'color 0.2s',
          }}>
            Log in
          </Link>
          <Link href="/auth/signup" style={{
            padding: '0.5rem 1.25rem',
            backgroundColor: 'var(--color-accent)',
            color: 'var(--color-background)',
            textDecoration: 'none',
            fontSize: '0.9rem',
            fontWeight: '700',
            borderRadius: '0.5rem',
            transition: 'opacity 0.2s',
          }}>
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section style={{
        maxWidth: '800px',
        margin: '0 auto',
        padding: '4rem 2rem 3rem',
        textAlign: 'center',
      }}>
        <div style={{
          display: 'inline-block',
          padding: '0.375rem 0.875rem',
          backgroundColor: 'rgba(254, 128, 25, 0.12)',
          border: '1px solid rgba(254, 128, 25, 0.3)',
          borderRadius: '9999px',
          fontSize: '0.8rem',
          fontWeight: '600',
          color: 'var(--color-accent)',
          marginBottom: '1.5rem',
          letterSpacing: '0.02em',
        }}>
          Your Prompt Recipe Book
        </div>

        <h1 style={{
          fontSize: 'clamp(2.5rem, 6vw, 4rem)',
          fontWeight: '800',
          lineHeight: '1.1',
          marginBottom: '1.5rem',
          letterSpacing: '-0.03em',
        }}>
          Save prompts you love.
          <br />
          <span style={{ color: 'var(--color-accent)' }}>
            Test, tweak, and reuse them.
          </span>
        </h1>

        <p style={{
          fontSize: '1.15rem',
          color: 'var(--color-foregroundAlt)',
          lineHeight: '1.7',
          maxWidth: '560px',
          margin: '0 auto 2.5rem',
        }}>
          Stop rewriting the same prompts from scratch. Promptoria is your personal recipe book for AI — save what works, version what changes, and test before you ship.
        </p>

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/auth/signup" style={{
            padding: '0.875rem 2.25rem',
            backgroundColor: 'var(--color-accent)',
            color: 'var(--color-background)',
            textDecoration: 'none',
            fontWeight: '700',
            fontSize: '1rem',
            borderRadius: '0.5rem',
            transition: 'opacity 0.2s',
          }}>
            Start for Free
          </Link>
          <a href="#how-it-works" style={{
            padding: '0.875rem 2.25rem',
            backgroundColor: 'transparent',
            color: 'var(--color-foreground)',
            border: '1px solid var(--color-border)',
            textDecoration: 'none',
            fontWeight: '600',
            fontSize: '1rem',
            borderRadius: '0.5rem',
            transition: 'background 0.2s',
          }}>
            See How It Works
          </a>
        </div>
      </section>

      {/* App Preview */}
      <section style={{
        maxWidth: '960px',
        margin: '0 auto',
        padding: '0 2rem 4rem',
      }}>
        <div style={{
          borderRadius: '0.75rem',
          border: '1px solid var(--color-border)',
          backgroundColor: 'var(--color-backgroundAlt)',
          padding: '2rem',
          position: 'relative',
          overflow: 'hidden',
        }}>
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: 'var(--color-error)', opacity: 0.7 }} />
            <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: 'var(--color-warning)', opacity: 0.7 }} />
            <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: 'var(--color-success)', opacity: 0.7 }} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: '1.5rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--color-accent)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Prompt
                </span>
                <span style={{ fontSize: '0.7rem', color: 'var(--color-foregroundAlt)', backgroundColor: 'var(--color-background)', padding: '0.15rem 0.5rem', borderRadius: '0.25rem' }}>
                  v3
                </span>
              </div>
              <div style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '0.8rem',
                lineHeight: '1.7',
                color: 'var(--color-foregroundAlt)',
                whiteSpace: 'pre-wrap',
              }}>{`You are an expert {role} writing for {audience}. \n\nYour tone should be {tone}. Focus on {topic}.\n\nStructure your response as:\n1. Key insight\n2. Supporting evidence\n3. Actionable takeaway\n\nKeep it under {length} words.`}</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ padding: '0.75rem', backgroundColor: 'var(--color-background)', borderRadius: '0.375rem', border: '1px solid var(--color-border)' }}>
                <div style={{ fontSize: '0.65rem', fontWeight: '600', color: 'var(--color-accent)', marginBottom: '0.375rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Tags</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                  {['writing', 'structured', 'reusable'].map(tag => (
                    <span key={tag} style={{ fontSize: '0.65rem', padding: '0.15rem 0.5rem', backgroundColor: 'rgba(254,128,25,0.15)', color: 'var(--color-accent)', borderRadius: '0.2rem' }}>{tag}</span>
                  ))}
                </div>
              </div>
              <div style={{ padding: '0.75rem', backgroundColor: 'var(--color-background)', borderRadius: '0.375rem', border: '1px solid var(--color-border)' }}>
                <div style={{ fontSize: '0.65rem', fontWeight: '600', color: 'var(--color-accent)', marginBottom: '0.375rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>AI Suggests</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--color-foregroundAlt)', lineHeight: '1.5' }}>
                  Add specificity to {`{role}`} — consider naming a persona
                </div>
              </div>
              <div style={{ padding: '0.75rem', backgroundColor: 'rgba(142,192,124,0.08)', border: '1px solid rgba(142,192,124,0.2)', borderRadius: '0.375rem' }}>
                <div style={{ fontSize: '0.65rem', fontWeight: '600', color: 'var(--color-success)', marginBottom: '0.25rem' }}>Test Passed</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--color-foregroundAlt)' }}>142 tokens in 1.2s</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" style={{
        maxWidth: '1000px',
        margin: '0 auto',
        padding: '4rem 2rem',
      }}>
        <h2 style={{
          fontSize: '2rem',
          fontWeight: '700',
          textAlign: 'center',
          marginBottom: '0.75rem',
          letterSpacing: '-0.02em',
        }}>
          From idea to tested prompt in seconds
        </h2>
        <p style={{
          fontSize: '1.05rem',
          color: 'var(--color-foregroundAlt)',
          textAlign: 'center',
          maxWidth: '500px',
          margin: '0 auto 3rem',
          lineHeight: '1.6',
        }}>
          Like a recipe book for cooking, but for talking to AI.
        </p>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '2rem',
        }}>
          {[
            { step: '1', title: 'Save It', desc: 'Found a prompt that works? Save it with tags, categories, and metadata so you can find it later.', icon: '📖' },
            { step: '2', title: 'Tweak It', desc: 'Use variables like {topic} and get AI-powered suggestions to make your prompts sharper.', icon: '🔧' },
            { step: '3', title: 'Test It', desc: 'Run your prompt against real models. Compare outputs. See token counts and response times.', icon: '🧪' },
            { step: '4', title: 'Version It', desc: 'Every change is tracked. Roll back to any version. Compare diffs side by side.', icon: '📋' },
          ].map(item => (
            <div key={item.step} style={{
              padding: '1.5rem',
              backgroundColor: 'var(--color-backgroundAlt)',
              borderRadius: '0.75rem',
              border: '1px solid var(--color-border)',
            }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{item.icon}</div>
              <div style={{
                fontSize: '0.7rem',
                fontWeight: '700',
                color: 'var(--color-accent)',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                marginBottom: '0.375rem',
              }}>
                Step {item.step}
              </div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '0.5rem' }}>{item.title}</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--color-foregroundAlt)', lineHeight: '1.5', margin: 0 }}>{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Social Proof */}
      <section style={{
        maxWidth: '1000px',
        margin: '0 auto',
        padding: '3rem 2rem',
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '1.5rem',
        }}>
          {[
            { quote: 'I used to keep prompts in Notes. Now I actually find them when I need them.', attr: 'Version history + tags' },
            { quote: 'Testing before shipping saved me from a prompt that sounded great but hallucinated every time.', attr: 'Built-in test runner' },
            { quote: 'The AI suggestions caught things I would have never thought to specify.', attr: 'Smart refinement' },
          ].map((item, i) => (
            <div key={i} style={{
              padding: '1.5rem',
              backgroundColor: 'var(--color-backgroundAlt)',
              borderRadius: '0.75rem',
              border: '1px solid var(--color-border)',
            }}>
              <p style={{ fontSize: '0.95rem', color: 'var(--color-foreground)', lineHeight: '1.6', fontStyle: 'italic', margin: '0 0 1rem 0' }}>
                &ldquo;{item.quote}&rdquo;
              </p>
              <div style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--color-accent)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {item.attr}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Feature Details */}
      <section style={{
        maxWidth: '1000px',
        margin: '0 auto',
        padding: '4rem 2rem',
      }}>
        <h2 style={{
          fontSize: '2rem',
          fontWeight: '700',
          textAlign: 'center',
          marginBottom: '0.75rem',
          letterSpacing: '-0.02em',
        }}>
          Everything you need, nothing you don&apos;t
        </h2>
        <p style={{
          fontSize: '1rem',
          color: 'var(--color-foregroundAlt)',
          textAlign: 'center',
          maxWidth: '480px',
          margin: '0 auto 3rem',
          lineHeight: '1.6',
        }}>
          Prompt management that works the way you think.
        </p>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '1.5rem',
        }}>
          {[
            { icon: '📚', title: 'Snippet Library', desc: 'Reusable text blocks you can compose into any prompt. Think of them as ingredients.' },
            { icon: '🏷️', title: 'Smart Tags', desc: 'AI-suggested tags so you never lose a prompt in the pile. Search by category, type, or keyword.' },
            { icon: '🔀', title: 'A/B Testing', desc: 'Compare outputs side by side. See which version gets better results, with tokens and cost tracked.' },
            { icon: '📋', title: 'Version History', desc: 'Every edit is saved. Roll back to any version. See exactly what changed, character by character.' },
            { icon: '⚡', title: 'Workbench', desc: 'Your prompt editor with variable filling, composition, and live testing — all in one view.' },
            { icon: '🔒', title: 'Private by Default', desc: 'Your prompts stay yours. No sharing required. Your workspace, your rules.' },
          ].map((feature, idx) => (
            <div key={idx} style={{
              padding: '1.5rem',
              backgroundColor: 'var(--color-backgroundAlt)',
              borderRadius: '0.75rem',
              border: '1px solid var(--color-border)',
            }}>
              <div style={{ fontSize: '1.75rem', marginBottom: '0.75rem' }}>{feature.icon}</div>
              <h4 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '0.375rem' }}>{feature.title}</h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--color-foregroundAlt)', lineHeight: '1.5', margin: 0 }}>{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{
        maxWidth: '600px',
        margin: '0 auto',
        padding: '5rem 2rem',
        textAlign: 'center',
      }}>
        <h2 style={{
          fontSize: '2rem',
          fontWeight: '800',
          marginBottom: '1rem',
          letterSpacing: '-0.02em',
        }}>
          Stop losing good prompts.
        </h2>
        <p style={{
          fontSize: '1.05rem',
          color: 'var(--color-foregroundAlt)',
          marginBottom: '2rem',
          lineHeight: '1.6',
        }}>
          Join Promptoria and start building your personal recipe book for AI.
        </p>
        <Link href="/auth/signup" style={{
          display: 'inline-block',
          padding: '1rem 3rem',
          backgroundColor: 'var(--color-accent)',
          color: 'var(--color-background)',
          textDecoration: 'none',
          fontWeight: '700',
          fontSize: '1.1rem',
          borderRadius: '0.5rem',
          transition: 'opacity 0.2s',
        }}>
          Get Started Free
        </Link>
      </section>

      {/* Footer */}
      <footer style={{
        borderTop: '1px solid var(--color-border)',
        padding: '2rem',
        textAlign: 'center',
        color: 'var(--color-foregroundAlt)',
        fontSize: '0.8rem',
      }}>
        <p>&copy; 2026 Promptoria. All rights reserved.</p>
      </footer>
    </div>
  )
}