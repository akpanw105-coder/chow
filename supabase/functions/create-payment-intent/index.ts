/**
 * Chow Supabase Edge Function: create-payment-intent
 * Secure server-authoritative Stripe PaymentIntent creation.
 * Validates order ownership, status, recalculates total, and records transaction attempt.
 */
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import Stripe from 'https://esm.sh/stripe@14.25.0?target=deno';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeSecretKey) {
      return new Response(
        JSON.stringify({ error: 'STRIPE_SECRET_KEY is not configured on the server.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') || '';

    // Verify caller authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Invalid user session.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.json();
    const { orderId, idempotencyKey } = body;

    if (!orderId) {
      return new Response(
        JSON.stringify({ error: 'Missing orderId parameter.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Privileged admin client to inspect order and create transaction
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Fetch authoritative order record
    const { data: order, error: orderError } = await adminClient
      .from('chow_orders')
      .select('*')
      .eq('id', orderId)
      .maybeSingle();

    if (orderError || !order) {
      return new Response(
        JSON.stringify({ error: 'Order not found.' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2. Validate order ownership
    if (order.customer_id !== user.id) {
      return new Response(
        JSON.stringify({ error: 'Forbidden: You do not have permission to pay for this order.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 3. Validate payment status (cannot pay twice)
    if (order.payment_status === 'paid') {
      return new Response(
        JSON.stringify({
          error: 'Order has already been paid.',
          paymentStatus: 'paid',
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 4. Initialize Stripe SDK
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2023-10-16',
      httpClient: Stripe.createFetchHttpClient(),
    });

    const amountKobo = Number(order.total_kobo);
    const currency = (order.currency || 'NGN').toLowerCase();

    // 5. Check if an active payment transaction with this idempotency key already exists
    if (idempotencyKey) {
      const { data: existingTxn } = await adminClient
        .from('payment_transactions')
        .select('*')
        .eq('idempotency_key', idempotencyKey)
        .maybeSingle();

      if (existingTxn && existingTxn.stripe_payment_intent_id) {
        // Retrieve existing PaymentIntent from Stripe
        const existingIntent = await stripe.paymentIntents.retrieve(
          existingTxn.stripe_payment_intent_id
        );

        return new Response(
          JSON.stringify({
            paymentIntentId: existingIntent.id,
            clientSecret: existingIntent.client_secret,
            amountKobo,
            currency,
            status: existingTxn.status,
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // 6. Create PaymentIntent at Stripe with server-verified amount
    const paymentIntent = await stripe.paymentIntents.create(
      {
        amount: amountKobo, // integer kobo (e.g. 520000 = 5,200.00 NGN)
        currency,
        automatic_payment_methods: {
          enabled: true,
        },
        metadata: {
          order_id: order.id,
          order_number: order.order_number,
          customer_id: user.id,
          restaurant: order.restaurant_name,
        },
        description: `Chow Order ${order.order_number} (${order.restaurant_name})`,
      },
      idempotencyKey ? { idempotencyKey: `pi_${idempotencyKey}` } : undefined
    );

    // 7. Record transaction attempt in payment_transactions table
    await adminClient.from('payment_transactions').insert({
      order_id: order.id,
      customer_id: user.id,
      payment_provider: 'stripe',
      stripe_payment_intent_id: paymentIntent.id,
      idempotency_key: idempotencyKey || null,
      amount_kobo: amountKobo,
      currency: currency.toUpperCase(),
      status: 'requires_action',
      metadata: {
        stripe_status: paymentIntent.status,
      },
    });

    // 8. Update chow_orders with payment attempt reference
    await adminClient
      .from('chow_orders')
      .update({
        stripe_payment_intent_id: paymentIntent.id,
        stripe_client_secret: paymentIntent.client_secret,
      })
      .eq('id', order.id);

    return new Response(
      JSON.stringify({
        paymentIntentId: paymentIntent.id,
        clientSecret: paymentIntent.client_secret,
        amountKobo,
        currency: currency.toUpperCase(),
        status: 'requires_action',
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    console.error('Edge Function create-payment-intent error:', err);
    return new Response(
      JSON.stringify({ error: err.message || 'Internal server error creating payment intent.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
