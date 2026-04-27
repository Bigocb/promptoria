import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getStripe, PLANS } from '@/lib/stripe'
import type Stripe from 'stripe'

export const dynamic = 'force-dynamic'

function getWebhookSecret(): string {
  const secret = process.env.STRIPE_WEBHOOK_SECRET || ''
  if (!secret) {
    console.error('[Stripe Webhook] STRIPE_WEBHOOK_SECRET is not set')
  }
  return secret
}

function findPlanByPriceId(priceId: string): { tier: string; monthlyTokenLimit: number } | null {
  for (const [, plan] of Object.entries(PLANS)) {
    if (plan.priceId && plan.priceId === priceId) {
      return { tier: plan.tier, monthlyTokenLimit: plan.monthlyTokenLimit }
    }
  }
  return null
}

async function resolveUserId(subscription: Stripe.Subscription): Promise<string | null> {
  if (subscription.metadata?.userId) return subscription.metadata.userId

  const existingSub = await prisma.subscription.findUnique({
    where: { stripe_subscription_id: subscription.id },
    select: { user_id: true },
  })
  if (existingSub) return existingSub.user_id

  const customerId = subscription.customer as string
  const user = await prisma.user.findFirst({
    where: { stripe_customer_id: customerId },
    select: { id: true },
  })
  return user?.id || null
}

async function handleCheckoutComplete(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.userId
  const plan = session.metadata?.plan
  if (!userId) {
    console.error('[Stripe Webhook] No userId in checkout session metadata')
    return
  }

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

  const item = subscription.items.data[0]
  const periodStart = item?.current_period_start ? new Date(item.current_period_start * 1000) : null
  const periodEnd = item?.current_period_end ? new Date(item.current_period_end * 1000) : null

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
        stripe_price_id: item?.price.id || '',
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
        stripe_price_id: item?.price.id || '',
        current_period_start: periodStart,
        current_period_end: periodEnd,
        cancel_at_period_end: subscription.cancel_at_period_end,
      },
    }),
  ])

  console.log(`[Stripe Webhook] Checkout complete: user ${userId} → ${planInfo.tier}`)
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const planInfo = findPlanByPriceId(subscription.items.data[0]?.price.id)
  if (!planInfo) {
    console.error('[Stripe Webhook] Unknown price in subscription update:', subscription.items.data[0]?.price.id)
    return
  }

  const userId = await resolveUserId(subscription)
  if (!userId) {
    console.error('[Stripe Webhook] Could not resolve user for subscription:', subscription.id)
    return
  }

  const item = subscription.items.data[0]
  const periodStart = item?.current_period_start ? new Date(item.current_period_start * 1000) : null
  const periodEnd = item?.current_period_end ? new Date(item.current_period_end * 1000) : null

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
        stripe_price_id: item?.price.id || '',
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
        stripe_price_id: item?.price.id || '',
        current_period_start: periodStart,
        current_period_end: periodEnd,
        cancel_at_period_end: subscription.cancel_at_period_end,
      },
    }),
  ])

  console.log(`[Stripe Webhook] Subscription updated: user ${userId} → ${planInfo.tier}`)
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const userId = await resolveUserId(subscription)

  if (!userId) {
    console.error('[Stripe Webhook] Could not resolve user for deleted subscription:', subscription.id)
    return
  }

  await prisma.$transaction([
    prisma.subscription.upsert({
      where: { stripe_subscription_id: subscription.id },
      create: {
        user_id: userId,
        stripe_subscription_id: subscription.id,
        stripe_price_id: subscription.items.data[0]?.price.id || '',
        stripe_customer_id: subscription.customer as string,
        status: 'canceled',
        tier: 'free',
        cancel_at_period_end: false,
      },
      update: {
        status: 'canceled',
      },
    }),
    prisma.user.update({
      where: { id: userId },
      data: {
        subscription_tier: 'free',
        daily_tokens_limit: 5000,
      },
    }),
  ])

  console.log(`[Stripe Webhook] Subscription canceled: user ${userId} → free`)
}

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')
  const webhookSecret = getWebhookSecret()

  if (!signature || !webhookSecret) {
    console.error('[Stripe Webhook] Missing signature or webhook secret', {
      hasSignature: !!signature,
      hasSecret: !!webhookSecret,
    })
    return NextResponse.json({ error: 'Missing signature or webhook secret' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    const stripe = getStripe()
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err) {
    console.error('[Stripe Webhook] Signature verification failed:', err instanceof Error ? err.message : err)
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