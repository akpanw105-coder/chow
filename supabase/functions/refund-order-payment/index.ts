/**
 * Chow Supabase Edge Function: refund-order-payment
 * Authenticated refund endpoint for authorized Chow staff.
 * Validates admin role via Supabase Auth, retrieves transaction, calls Stripe refunds API,
 * and updates audit records.
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
        JSON.stringify({ error: 'STRIPE_SECRET_KEY is not configured.' }),
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
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Invalid user session.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if caller is an admin
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);
    const { data: profile } = await adminClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    if (profile?.role !== 'admin') {
      return new Response(
        JSON.stringify({ error: 'Forbidden: Only administrators can process refunds.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.json();
    const { orderId, reason, amountKobo, notes } = body;

    if (!orderId) {
      return new Response(
        JSON.stringify({ error: 'Missing orderId parameter.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Retrieve order and payment transaction
    const { data: order } = await adminClient
      .from('chow_orders')
      .select('*')
      .eq('id', orderId)
      .maybeSingle();

    if (!order) {
      return new Response(
        JSON.stringify({ error: 'Order not found.' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (order.payment_status !== 'paid') {
      return new Response(
        JSON.stringify({ error: `Cannot refund an order with payment status "${order.payment_status}".` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!order.stripe_payment_intent_id) {
      return new Response(
        JSON.stringify({ error: 'No Stripe PaymentIntent ID linked to this order.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2023-10-16',
      httpClient: Stripe.createFetchHttpClient(),
    });

    // Create refund at Stripe
    const refund = await stripe.refunds.create({
      payment_intent: order.stripe_payment_intent_id,
      amount: amountKobo ? Number(amountKobo) : undefined, // full refund if omitted
      reason: reason || 'requested_by_customer',
      metadata: {
        order_id: order.id,
        order_number: order.order_number,
        admin_id: user.id,
        notes: notes || '',
      },
    });

    // Update payment_transactions
    await adminClient
      .from('payment_transactions')
      .update({
        status: refund.status === 'succeeded' ? 'refunded' : 'refund_pending',
        stripe_refund_id: refund.id,
        refund_reason: notes || reason || 'Refund issued by administrator.',
        refunded_at: new Date().toISOString(),
      })
      .eq('stripe_payment_intent_id', order.stripe_payment_intent_id);

    // Update order status
    await adminClient
      .from('chow_orders')
      .update({
        payment_status: 'refunded',
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        cancellation_reason: `Refund issued (${refund.id}): ${notes || 'Staff refund'}`,
      })
      .eq('id', order.id);

    // Log status history
    await adminClient.from('order_status_history').insert({
      order_id: order.id,
      changed_by: user.id,
      previous_status: order.status,
      new_status: 'cancelled',
      notes: `Order refunded and cancelled by admin ${user.email || user.id}. Refund ID: ${refund.id}`,
    });

    return new Response(
      JSON.stringify({
        success: true,
        refundId: refund.id,
        status: refund.status,
        amountRefundedKobo: refund.amount,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    console.error('Edge Function refund-order-payment error:', err);
    return new Response(
      JSON.stringify({ error: err.message || 'Failed to process refund.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
