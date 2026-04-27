import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getStripe, PLANS } from '@/lib/stripe'
import type Stripe from 'stripe'

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || ''

function findPlanByPriceId(priceId: string): { tier: string; monthlyTokenLimit: number } | null {
  for (const [, plan] of Object.entries(PLANS)) {
    if (plan.priceId && plan.priceId === priceId) {
      return { tier: plan.tier, monthlyTokenLimit: plan.monthlyTokenLimit }
    }
  }
  return null
}

async function handleCheckoutComplete(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.userId
  const plan = session.metadata?.plan
  if (!userId) return

  const subId = session.subscription as string
  const stripe = getStripe()
  const subscription = await stripe.subscriptions.retrieve(subId)
  const planInfo = plan && PLANS[plan as keyof typeof PLANS]
    ? PLANS[plan as keyof typeof PLANS]
    : findPlanByPriceId(subscription.items.data[0]?.price.id)

  if (!planInfo) {
    console.error('[Stripe Webhook] Unknown plan for subscription:', subscription.id)
    return
  }

  const periodStart = subscription.items.data[0]?.current_period_start
    ? new Date(subscription.items.data[0].current_period_start * 1000)
    : null
  const periodEnd = subscription.items.data[0]?.current_period_end
    ? new Date(subscription.items.data[0].current_period_end * 1000)
    : null

  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: {
        subscription_tier: planInfo.tier,
        daily_tokens_limit: planInfo.monthlyTokenLimit,
      },
    }),
    prisma.subscription.upsert({
      where: { stripe_subscription_id: subscription.id },
      create: {
        user_id: userId,
        stripe_subscription_id: subscription.id,
        stripe_price_id: subscription.items.data[0]?.price.id || '',
        stripe_customer_id: subscription.customer as string,
        status: subscription.status,
        tier: planInfo.tier,
        current_period_start: periodStart,
        current_period_end: periodEnd,
        cancel_at_period_end: subscription.cancel_at_period_end,
      },
      update: {
        status: subscription.status,
        tier: planInfo.tier,
        current_period_start: periodStart,
        current_period_end: periodEnd,
        cancel_at_period_end: subscription.cancel_at_period_end,
      },
    }),
  ])

  console.log(`[Stripe Webhook] User ${userId} subscribed to ${planInfo.tier}`)
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const planInfo = findPlanByPriceId(subscription.items.data[0]?.price.id)
  if (!planInfo) return

  const periodStart = subscription.items.data[0]?.current_period_start
    ? new Date(subscription.items.data[0].current_period_start * 1000)
    : null
  const periodEnd = subscription.items.data[0]?.current_period_end
    ? new Date(subscription.items.data[0].current_period_end * 1000)
    : null

  await prisma.subscription.update({
    where: { stripe_subscription_id: subscription.id },
    data: {
      status: subscription.status,
      tier: planInfo.tier,
      stripe_price_id: subscription.items.data[0]?.price.id || '',
      current_period_start: periodStart,
      current_period_end: periodEnd,
      cancel_at_period_end: subscription.cancel_at_period_end,
    },
  })

  const userId = subscription.metadata?.userId
  if (userId) {
    await prisma.user.update({
      where: { id: userId },
      data: {
        subscription_tier: planInfo.tier,
        daily_tokens_limit: planInfo.monthlyTokenLimit,
      },
    })
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const sub = await prisma.subscription.findUnique({
    where: { stripe_subscription_id: subscription.id },
    select: { user_id: true },
  })

  if (!sub) return

  await prisma.$transaction([
    prisma.subscription.update({
      where: { stripe_subscription_id: subscription.id },
      data: { status: 'canceled' },
    }),
    prisma.user.update({
      where: { id: sub.user_id },
      data: {
        subscription_tier: 'free',
        daily_tokens_limit: 5000,
      },
    }),
  ])

  console.log(`[Stripe Webhook] User ${sub.user_id} subscription canceled, downgraded to free`)
}

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')!

  let event: Stripe.Event
  try {
    const stripe = getStripe()
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err) {
    console.error('[Stripe Webhook] Signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutComplete(event.data.object as Stripe.Checkout.Session)
        break
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription)
        break
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription)
        break
      default:
        console.log(`[Stripe Webhook] Unhandled event: ${event.type}`)
    }
  } catch (err) {
    console.error(`[Stripe Webhook] Error handling ${event.type}:`, err)
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}