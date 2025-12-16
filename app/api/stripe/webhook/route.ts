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
 */

import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import type Stripe from 'stripe'

import { stripe } from '@/lib/stripe/config'
import { createClient } from '@/lib/supabase/server'

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
    // eslint-disable-next-line no-console
    console.error('Webhook signature verification failed:', err)
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
        // eslint-disable-next-line no-console
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error handling webhook:', error)
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 })
  }
}

/**
 * Handle successful checkout session
 */
async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  // eslint-disable-next-line no-console
  console.log('Checkout session completed:', session.id)

  const supabase = createClient()

  // Get user ID from metadata
  const userId = session.metadata?.userId

  if (!userId) {
    console.error('No user ID in session metadata')
    return
  }

  // TODO: Update user's subscription status
  // You need to add these columns to your users table first:
  // - stripe_customer_id (text)
  // - subscription_status (text)
  // - subscription_plan (text)
  // - subscription_end_date (timestamptz)
  //
  // Example migration:
  // ALTER TABLE users ADD COLUMN stripe_customer_id TEXT;
  // ALTER TABLE users ADD COLUMN subscription_status TEXT DEFAULT 'free';
  // ALTER TABLE users ADD COLUMN subscription_plan TEXT DEFAULT 'free';
  // ALTER TABLE users ADD COLUMN subscription_end_date TIMESTAMPTZ;

  // Uncomment when you've added the columns:
  // const { error } = await supabase
  //   .from('users')
  //   .update({
  //     stripe_customer_id: session.customer as string,
  //     subscription_status: 'active',
  //     subscription_plan: session.metadata?.plan || 'pro',
  //     updated_at: new Date().toISOString(),
  //   })
  //   .eq('id', userId)
  //
  // if (error) {
  //   console.error('Error updating user subscription:', error)
  // } else {
  //   console.log(`User ${userId} upgraded to ${session.metadata?.plan}`)
  // }

  // For now, just log the upgrade
  // eslint-disable-next-line no-console
  console.log(
    `User ${userId} upgraded to ${session.metadata?.plan} (DB update pending - add Stripe columns first)`
  )
  // Suppress unused variable warning
  void supabase
}

/**
 * Handle subscription created or updated
 */
async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  // eslint-disable-next-line no-console
  console.log('Subscription updated:', subscription.id)

  // Map Stripe status to our status
  const status = subscription.status === 'active' ? 'active' : subscription.status

  // TODO: Implement subscription update when Stripe columns are added to users table
  // For now, just log the event
  // eslint-disable-next-line no-console
  console.log(
    `Subscription ${subscription.id} updated (status: ${status}, customer: ${subscription.customer})`
  )
}

/**
 * Handle subscription deleted/cancelled
 */
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  // eslint-disable-next-line no-console
  console.log('Subscription deleted:', subscription.id)

  // TODO: Implement subscription deletion when Stripe columns are added to users table
  // For now, just log the event
  // eslint-disable-next-line no-console
  console.log(`Subscription cancelled (customer: ${subscription.customer}, id: ${subscription.id})`)
}

/**
 * Handle successful payment
 */
async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  // eslint-disable-next-line no-console
  console.log('Payment succeeded:', invoice.id)

  // You could send a receipt email here
  // Or log the payment for analytics
}

/**
 * Handle failed payment
 */
async function handlePaymentFailed(invoice: Stripe.Invoice) {
  // eslint-disable-next-line no-console
  console.log('Payment failed:', invoice.id)

  // TODO: Implement payment failure handling when Stripe is fully integrated
  // You could:
  // 1. Send an email notification
  // 2. Update subscription status to 'past_due'
  // 3. Show a notification in the app

  // For now, just log
  // eslint-disable-next-line no-console
  console.log(`Payment failed (customer: ${invoice.customer}, amount: ${invoice.amount_due})`)
}
