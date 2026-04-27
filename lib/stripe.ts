import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-04-22.dahlia',
})

export const PLANS = {
  pro: {
    priceId: process.env.STRIPE_PRO_PRICE_ID!,
    name: 'Pro',
    tier: 'pro',
    monthlyTokenLimit: 50000,
  },
  enterprise: {
    priceId: process.env.STRIPE_ENTERPRISE_PRICE_ID!,
    name: 'Enterprise',
    tier: 'enterprise',
    monthlyTokenLimit: 200000,
  },
} as const

export type PlanKey = keyof typeof PLANS