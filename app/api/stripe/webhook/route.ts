/**
 * Stripe Webhook Handler (Optional)
 *
 * This endpoint receives webhook events from Stripe when:
 * - A payment succeeds or fails
 * - A subscription is created, updated, or cancelled
 * - A refund is issued
 *
 * IMPORTANT: You must register this webhook in your Stripe dashboard:
 * https://dashboard.stripe.com/webhooks
 *
 * Webhook URL: https://yourdomain.com/api/stripe/webhook
 *
 * Events to listen for:
 * - checkout.session.completed
 * - customer.subscription.created
 * - customer.subscription.updated
 * - customer.subscription.deleted
 * - invoice.payment_succeeded
 * - invoice.payment_failed
 *
 * Dependencies: stripe, supabase
 */

import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import type Stripe from 'stripe'

import { stripe } from '@/lib/stripe/config'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/utils/logger'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * POST /api/stripe/webhook
 * Handles Stripe webhook events
 */
export async function POST(req: Request) {
  // Verify Stripe is configured
  if (!stripe || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json(
      {
        error:
          'Stripe is not configured. Set STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET environment variables.',
      },
      { status: 501 } // Not Implemented
    )
  }

  const body = await req.text()
  const signature = headers().get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    // Verify webhook signature
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET)
  } catch (err) {
    logger.error('Webhook signature verification failed', {
      error: err instanceof Error ? err.message : String(err),
    })
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  try {
    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session)
        break

      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription)
        break

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription)
        break

      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object as Stripe.Invoice)
        break

      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.Invoice)
        break

      default:
        logger.info('Unhandled Stripe event type', { eventType: event.type })
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    logger.error('Error handling webhook', {
      error: error instanceof Error ? error.message : String(error),
    })
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 })
  }
}

/**
 * Handle successful checkout session
 *
 * TODO (Stripe Integration - Q2 2025): Implement full subscription update
 * Prerequisites:
 * - Add stripe_customer_id column to profiles table
 * - Add subscription_status column to profiles table
 * - Add subscription_plan column to profiles table
 * - Add subscription_end_date column to profiles table
 */
async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  logger.info('Checkout session completed', { sessionId: session.id })

  const supabase = createClient()

  // Get user ID from metadata
  const userId = session.metadata?.userId

  if (!userId) {
    logger.error('No user ID in session metadata', { sessionId: session.id })
    return
  }

  // NOTE: Subscription update is pending Stripe column additions to profiles table
  // See migration script at scripts/add-stripe-columns.sql for required schema changes
  logger.info('User upgrade recorded (pending DB schema update)', {
    userId,
    plan: session.metadata?.plan,
    customerId: session.customer,
  })

  // Suppress unused variable warning
  void supabase
}

/**
 * Handle subscription created or updated
 *
 * TODO (Stripe Integration - Q2 2025): Update user subscription status in database
 */
async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  logger.info('Subscription updated', {
    subscriptionId: subscription.id,
    status: subscription.status,
    customerId: subscription.customer,
  })
}

/**
 * Handle subscription deleted/cancelled
 *
 * TODO (Stripe Integration - Q2 2025): Revert user to free tier in database
 */
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  logger.info('Subscription deleted', {
    subscriptionId: subscription.id,
    customerId: subscription.customer,
  })
}

/**
 * Handle successful payment
 */
async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  logger.info('Payment succeeded', { invoiceId: invoice.id })
}

/**
 * Handle failed payment
 *
 * TODO (Stripe Integration - Q2 2025): Implement payment failure notifications
 * - Send email notification to user
 * - Update subscription status to 'past_due'
 * - Show notification in app
 */
async function handlePaymentFailed(invoice: Stripe.Invoice) {
  logger.warn('Payment failed', {
    invoiceId: invoice.id,
    customerId: invoice.customer,
    amountDue: invoice.amount_due,
  })
}
