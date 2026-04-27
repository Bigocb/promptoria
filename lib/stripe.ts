import Stripe from 'stripe'

let _stripe: Stripe | null = null

export function getStripe(): Stripe {
  if (!_stripe) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY is not configured')
    }
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2026-04-22.dahlia',
    })
  }
  return _stripe
}

export const PLANS = {
  pro: {
    priceId: process.env.STRIPE_PRO_PRICE_ID || '',
    name: 'Pro',
    tier: 'pro',
    monthlyTokenLimit: 50000,
  },
  enterprise: {
    priceId: process.env.STRIPE_ENTERPRISE_PRICE_ID || '',
    name: 'Power',
    tier: 'enterprise',
    monthlyTokenLimit: 200000,
  },
} as const

export type PlanKey = keyof typeof PLANS