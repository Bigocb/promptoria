import { NextResponse } from 'next/server'
import { getStripe, PLANS } from '@/lib/stripe'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const stripe = getStripe()
    const prices = await stripe.prices.list({ active: true, limit: 100 })

    const result: Record<string, { priceId: string; amount: number; currency: string; interval: string }> = {}

    for (const [, plan] of Object.entries(PLANS)) {
      if (!plan.priceId) continue
      const price = prices.data.find(p => p.id === plan.priceId)
      if (price) {
        result[plan.tier] = {
          priceId: price.id,
          amount: price.unit_amount ?? 0,
          currency: price.currency,
          interval: price.recurring?.interval ?? 'month',
        }
      }
    }

    return NextResponse.json({ plans: result })
  } catch (error) {
    console.error('[Stripe Prices] Error:', error)
    return NextResponse.json({ error: 'Failed to fetch prices' }, { status: 500 })
  }
}