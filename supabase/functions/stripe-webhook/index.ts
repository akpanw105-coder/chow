/**
 * Chow Supabase Edge Function: stripe-webhook
 * Authoritative, idempotent reconciliation of Stripe asynchronous events.
 * Verifies raw request signature using Stripe SDK, deduplicates event IDs,
 * validates order amount & currency, and atomically updates payment & order status.
 */
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import Stripe from 'https://esm.sh/stripe@14.25.0?target=deno';

serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
  const endpointSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');

  if (!stripeSecretKey || !endpointSecret) {
    console.error('Missing Stripe environment variables on server.');
    return new Response('Server configuration error', { status: 500 });
  }

  const stripe = new Stripe(stripeSecretKey, {
    apiVersion: '2023-10-16',
    httpClient: Stripe.createFetchHttpClient(),
  });

  const signature = req.headers.get('stripe-signature');
  if (!signature) {
    console.warn('Webhook rejected: Missing stripe-signature header.');
    return new Response('Missing signature', { status: 400 });
  }

  // 1. Read raw body as text for cryptographic signature verification
  const rawBody = await req.text();

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(
      rawBody,
      signature,
      endpointSecret
    );
  } catch (err: any) {
    console.error('⚠️ Stripe Webhook signature verification failed:', err.message);
    return new Response(`Signature verification failed: ${err.message}`, { status: 400 });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
  const adminClient = createClient(supabaseUrl, supabaseServiceKey);

  // 2. Idempotency Check: Deduplicate processed Stripe event IDs
  const { data: existingEvent } = await adminClient
    .from('processed_stripe_events')
    .select('id')
    .eq('id', event.id)
    .maybeSingle();

  if (existingEvent) {
    console.log(`Duplicate event ${event.id} already processed. Returning 200 OK.`);
    return new Response(JSON.stringify({ received: true, deduplicated: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const orderId = paymentIntent.metadata?.order_id;
        const amountKobo = paymentIntent.amount;
        const currency = paymentIntent.currency.toUpperCase();
        const chargeId = typeof paymentIntent.latest_charge === 'string'
          ? paymentIntent.latest_charge
          : undefined;

        if (!orderId) {
          console.warn(`PaymentIntent ${paymentIntent.id} has no order_id in metadata.`);
          break;
        }

        // Call atomic database procedure to verify and update order
        const { data: rpcRes, error: rpcErr } = await adminClient.rpc('record_payment_event_secure', {
          p_order_id: orderId,
          p_payment_intent_id: paymentIntent.id,
          p_charge_id: chargeId || null,
          p_status: 'succeeded',
          p_amount_kobo: amountKobo,
          p_currency: currency,
          p_failure_code: null,
          p_failure_message: null,
          p_metadata: { stripe_event_id: event.id },
        });

        if (rpcErr) {
          console.error(`Error in record_payment_event_secure for ${orderId}:`, rpcErr.message);
          throw new Error(rpcErr.message);
        }

        console.log(`Order ${orderId} successfully marked paid via webhook event ${event.id}`);
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const orderId = paymentIntent.metadata?.order_id;
        const lastError = paymentIntent.last_payment_error;

        if (orderId) {
          await adminClient.rpc('record_payment_event_secure', {
            p_order_id: orderId,
            p_payment_intent_id: paymentIntent.id,
            p_charge_id: null,
            p_status: 'failed',
            p_amount_kobo: paymentIntent.amount,
            p_currency: paymentIntent.currency.toUpperCase(),
            p_failure_code: lastError?.code || 'payment_failed',
            p_failure_message: lastError?.message || 'Payment attempt failed.',
            p_metadata: { stripe_event_id: event.id },
          });
        }
        break;
      }

      case 'payment_intent.canceled': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const orderId = paymentIntent.metadata?.order_id;

        if (orderId) {
          await adminClient
            .from('payment_transactions')
            .update({
              status: 'canceled',
              updated_at: new Date().toISOString(),
            })
            .eq('stripe_payment_intent_id', paymentIntent.id);
        }
        break;
      }

      case 'charge.refunded': {
        const charge = event.data.object as Stripe.Charge;
        const paymentIntentId = typeof charge.payment_intent === 'string'
          ? charge.payment_intent
          : null;

        if (paymentIntentId) {
          const isFullRefund = charge.refunded;
          const status = isFullRefund ? 'refunded' : 'partially_refunded';

          // Update payment_transactions
          const { data: updatedTxn } = await adminClient
            .from('payment_transactions')
            .update({
              status,
              stripe_charge_id: charge.id,
              refunded_at: new Date().toISOString(),
              metadata: {
                refunds: charge.refunds?.data,
                amount_refunded: charge.amount_refunded,
              },
            })
            .eq('stripe_payment_intent_id', paymentIntentId)
            .select('order_id')
            .maybeSingle();

          if (updatedTxn?.order_id && isFullRefund) {
            await adminClient
              .from('chow_orders')
              .update({
                payment_status: 'refunded',
                status: 'cancelled',
                cancelled_at: new Date().toISOString(),
                cancellation_reason: 'Order payment fully refunded.',
              })
              .eq('id', updatedTxn.order_id);
          }
        }
        break;
      }

      default:
        console.log(`Unhandled webhook event type: ${event.type}`);
    }

    // 3. Mark event as processed in processed_stripe_events table
    await adminClient.from('processed_stripe_events').insert({
      id: event.id,
      event_type: event.type,
      payment_intent_id: (event.data.object as any)?.id || null,
      order_id: (event.data.object as any)?.metadata?.order_id || null,
      metadata: {
        created: event.created,
        livemode: event.livemode,
      },
    });

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    console.error('Webhook processing exception:', err.message);
    return new Response(`Webhook handling error: ${err.message}`, { status: 500 });
  }
});
