'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '@/app/providers'
import { API_ENDPOINTS } from '@/lib/api-config'

interface PlanFeature {
  text: string
  included: boolean
}

interface PlanDef {
  key: string
  tier: string
  defaultPrice: number
  name: string
  description: string
  features: PlanFeature[]
  cta: string
  highlighted: boolean
}

const planDefs: PlanDef[] = [
  {
    key: 'free',
    tier: 'free',
    defaultPrice: 0,
    name: 'Free',
    description: 'For individuals exploring prompt engineering',
    features: [
      { text: '5,000 tokens/day', included: true },
      { text: 'Models up to 8B params', included: true },
      { text: 'Unlimited prompts & snippets', included: true },
      { text: 'A/B test comparison', included: true },
      { text: '10 test runs/minute', included: true },
      { text: 'Models up to 30B params', included: false },
      { text: 'Models up to 70B+ params', included: false },
      { text: 'Priority support', included: false },
    ],
    cta: 'Current Plan',
    highlighted: false,
  },
  {
    key: 'pro',
    tier: 'pro',
    defaultPrice: 12,
    name: 'Pro',
    description: 'For professionals who need more power',
    features: [
      { text: '50,000 tokens/day', included: true },
      { text: 'Models up to 8B params', included: true },
      { text: 'Unlimited prompts & snippets', included: true },
      { text: 'A/B test comparison', included: true },
      { text: '10 test runs/minute', included: true },
      { text: 'Models up to 30B params', included: true },
      { text: 'Models up to 70B+ params', included: false },
      { text: 'Priority support', included: false },
    ],
    cta: 'Upgrade to Pro',
    highlighted: true,
  },
  {
    key: 'enterprise',
    tier: 'enterprise',
    defaultPrice: 49,
    name: 'Power',
    description: 'For teams that need the best models',
    features: [
      { text: '200,000 tokens/day', included: true },
      { text: 'Models up to 8B params', included: true },
      { text: 'Unlimited prompts & snippets', included: true },
      { text: 'A/B test comparison', included: true },
      { text: '10 test runs/minute', included: true },
      { text: 'Models up to 30B params', included: true },
      { text: 'Models up to 70B+ params', included: true },
      { text: 'Priority support', included: true },
    ],
    cta: 'Upgrade to Enterprise',
    highlighted: false,
  },
]

function formatPrice(cents: number, currency: string): string {
  if (cents === 0) return '$0'
  const dollars = cents / 100
  return `$${dollars % 1 === 0 ? dollars.toFixed(0) : dollars.toFixed(2)}`
}

export default function PricingPage() {
  const { user } = useAuth()
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [checkoutCanceled, setCheckoutCanceled] = useState(false)
  const [prices, setPrices] = useState<Record<string, { amount: number; currency: string; interval: string }> | null>(null)
  const [pricesLoading, setPricesLoading] = useState(true)

  useEffect(() => {
    const fetchPrices = async () => {
      try {
        const res = await fetch(API_ENDPOINTS.stripe.prices)
        if (res.ok) {
          const data = await res.json()
          setPrices(data.plans || {})
        }
      } catch {
        // use defaults
      } finally {
        setPricesLoading(false)
      }
    }
    fetchPrices()
  }, [])

  const userTier = user?.tier || 'free'
  const tierRank: Record<string, number> = { free: 1, pro: 2, enterprise: 3, admin: 99 }
  const currentRank = tierRank[userTier] || 1

  const handleCheckout = async (planKey: string) => {
    setLoadingPlan(planKey)
    setError('')
    try {
      const token = localStorage.getItem('auth-token')
      if (!token) {
        window.location.href = '/auth/login'
        return
      }
      const res = await fetch(API_ENDPOINTS.stripe.checkout, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ plan: planKey }),
      })
      if (res.ok) {
        const data = await res.json()
        window.location.href = data.url
      } else {
        const err = await res.json()
        setError(err.error || 'Failed to start checkout')
      }
    } catch {
      setError('Failed to start checkout')
    } finally {
      setLoadingPlan(null)
    }
  }

  const getPriceLabel = (plan: PlanDef) => {
    if (plan.tier === 'free') return { price: '$0', subtext: '/month' }
    if (prices && prices[plan.tier]) {
      const p = prices[plan.tier]
      return { price: formatPrice(p.amount, p.currency), subtext: `/${p.interval}` }
    }
    return { price: `$${plan.defaultPrice}`, subtext: '/month' }
  }

  const getCtaLabel = (plan: PlanDef) => {
    if (userTier === 'admin') return 'Admin (all access)'
    if (currentRank > tierRank[plan.tier]) return 'Downgrade'
    if (currentRank === tierRank[plan.tier]) return 'Current Plan'
    return plan.cta
  }

  const getCtaDisabled = (plan: PlanDef) => {
    if (userTier === 'admin') return true
    if (currentRank === tierRank[plan.tier]) return true
    return loadingPlan === plan.key
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-background)', color: 'var(--color-foreground)' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '3rem 1.5rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <div style={{ marginBottom: '1rem' }}>
            <Link href="/dashboard" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', color: 'var(--color-foregroundAlt)', textDecoration: 'none', fontSize: '0.875rem', padding: '0.375rem 0.75rem', border: '1px solid var(--color-border)', borderRadius: '0.375rem' }}>
              &larr; Dashboard
            </Link>
          </div>
          <h1 style={{ fontSize: 'clamp(1.75rem, 5vw, 2.5rem)', fontWeight: '800', letterSpacing: '-0.03em', marginBottom: '0.5rem' }}>Choose Your Plan</h1>
          <p style={{ color: 'var(--color-foregroundAlt)', fontSize: '1.05rem', maxWidth: '500px', margin: '0 auto' }}>
            Unlock more powerful models and higher token limits
          </p>
        </div>

        {error && (
          <div style={{ maxWidth: '500px', margin: '0 auto 1.5rem', padding: '0.75rem 1rem', backgroundColor: 'rgba(255,0,0,0.08)', borderLeft: '3px solid #ff6b6b', borderRadius: '0.5rem', color: '#ff6b6b', fontSize: '0.85rem' }}>
            {error}
            <button onClick={() => setError('')} style={{ marginLeft: '0.5rem', background: 'none', border: 'none', color: '#ff6b6b', cursor: 'pointer', textDecoration: 'underline' }}>dismiss</button>
          </div>
        )}

        {checkoutCanceled && (
          <div style={{ maxWidth: '500px', margin: '0 auto 1.5rem', padding: '0.75rem 1rem', backgroundColor: 'rgba(254,128,25,0.08)', borderLeft: '3px solid #fe8019', borderRadius: '0.5rem', fontSize: '0.85rem' }}>
            Checkout was canceled. You can try again anytime.
            <button onClick={() => setCheckoutCanceled(false)} style={{ marginLeft: '0.5rem', background: 'none', border: 'none', color: '#fe8019', cursor: 'pointer', textDecoration: 'underline' }}>dismiss</button>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', alignItems: 'start' }}>
          {planDefs.map(plan => {
            const priceInfo = getPriceLabel(plan)
            const disabled = getCtaDisabled(plan)

            return (
              <div key={plan.key} style={{
                backgroundColor: plan.highlighted ? 'var(--color-backgroundAlt)' : 'var(--color-surface)',
                border: `2px solid ${plan.highlighted ? 'var(--color-accent)' : 'var(--color-border)'}`,
                borderRadius: '0.75rem',
                padding: '2rem',
                position: 'relative',
                transform: plan.highlighted ? 'scale(1.03)' : 'none',
                boxShadow: plan.highlighted ? '0 4px 24px rgba(254,128,25,0.1)' : 'none',
              }}>
                {plan.highlighted && (
                  <div style={{ position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)', padding: '0.2rem 0.75rem', backgroundColor: 'var(--color-accent)', color: '#1d2021', fontSize: '0.7rem', fontWeight: '700', borderRadius: '9999px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Most Popular
                  </div>
                )}

                <h2 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '0.25rem' }}>{plan.name}</h2>
                <p style={{ fontSize: '0.8rem', color: 'var(--color-foregroundAlt)', marginBottom: '1rem' }}>{plan.description}</p>

                <div style={{ marginBottom: '1.5rem' }}>
                  {pricesLoading && plan.tier !== 'free' ? (
                    <span style={{ fontSize: '1.5rem', color: 'var(--color-foregroundAlt)' }}>Loading...</span>
                  ) : (
                    <>
                      <span style={{ fontSize: '2.5rem', fontWeight: '800', letterSpacing: '-0.03em' }}>{priceInfo.price}</span>
                      <span style={{ fontSize: '0.9rem', color: 'var(--color-foregroundAlt)' }}>{priceInfo.subtext}</span>
                    </>
                  )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem', marginBottom: '1.5rem' }}>
                  {plan.features.map((f, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: f.included ? 'var(--color-foreground)' : 'var(--color-foregroundAlt)', opacity: f.included ? 1 : 0.5 }}>
                      <span style={{ fontSize: '0.85rem', width: '16px', textAlign: 'center' }}>
                        {f.included ? '\u2713' : '\u2013'}
                      </span>
                      <span style={{ textDecoration: f.included ? 'none' : 'line-through' }}>{f.text}</span>
                    </div>
                  ))}
                </div>

                {tierRank[userTier] === tierRank[plan.tier] ? (
                  <div style={{ width: '100%', padding: '0.75rem', textAlign: 'center', borderRadius: '0.5rem', backgroundColor: 'var(--color-border)', color: 'var(--color-foregroundAlt)', fontSize: '0.85rem', fontWeight: '600', opacity: 0.7 }}>
                    Current Plan
                  </div>
                ) : userTier === 'admin' ? (
                  <div style={{ width: '100%', padding: '0.75rem', textAlign: 'center', borderRadius: '0.5rem', backgroundColor: 'rgba(255,107,107,0.1)', color: '#ff6b6b', fontSize: '0.85rem', fontWeight: '600' }}>
                    Admin (all access)
                  </div>
                ) : (
                  <button
                    onClick={() => handleCheckout(plan.key)}
                    disabled={disabled}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      textAlign: 'center',
                      borderRadius: '0.5rem',
                      border: plan.highlighted ? 'none' : '1px solid var(--color-border)',
                      backgroundColor: plan.highlighted ? 'var(--color-accent)' : 'var(--color-surface)',
                      color: plan.highlighted ? '#1d2021' : 'var(--color-foreground)',
                      fontSize: '0.85rem',
                      fontWeight: '700',
                      cursor: disabled ? 'not-allowed' : 'pointer',
                      opacity: disabled ? 0.5 : 1,
                    }}
                  >
                    {loadingPlan === plan.key ? 'Redirecting...' : getCtaLabel(plan)}
                  </button>
                )}
              </div>
            )
          })}
        </div>

        <div style={{ textAlign: 'center', marginTop: '2.5rem', color: 'var(--color-foregroundAlt)', fontSize: '0.8rem' }}>
          <p>All plans include unlimited prompts, snippets, and A/B test comparison.</p>
          <p style={{ marginTop: '0.25rem' }}>BYOK (Bring Your Own Key) for Claude models available on all tiers.</p>
        </div>
      </div>
    </div>
  )
}