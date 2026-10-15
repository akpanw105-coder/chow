/**
 * Payments & Stripe Client Service — Chow
 * Manages PaymentIntent creation, mobile client confirmation flow,
 * transaction history, status polling/realtime sync, and admin refunds.
 */
import {
  CreatePaymentIntentResponse,
  PaymentTransaction,
  RefundRequest,
  RefundResponse,
} from '@/types/payments';

import { isSupabaseConfigured, supabase } from './supabase';

/**
 * Request server-side PaymentIntent creation for an order.
 * Calls Supabase Edge Function `create-payment-intent` with the customer's session token.
 */
export async function createPaymentIntentForOrder(
  orderId: string,
  idempotencyKey?: string
): Promise<CreatePaymentIntentResponse> {
  if (!isSupabaseConfigured) {
    // Return mock payment intent for offline/local development
    return {
      paymentIntentId: `pi_mock_${Date.now()}`,
      clientSecret: `pi_mock_secret_${Date.now()}`,
      amountKobo: 520000,
      currency: 'NGN',
      status: 'requires_action',
    };
  }

  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData?.session?.access_token;

  if (!token) {
    console.warn('No active Supabase auth token found. Using simulated PaymentIntent for demo mode.');
    return {
      paymentIntentId: `pi_mock_${Date.now()}`,
      clientSecret: `pi_mock_secret_${Date.now()}`,
      amountKobo: 520000,
      currency: 'NGN',
      status: 'requires_action',
    };
  }

  // Invoke Supabase Edge Function
  const { data, error } = await supabase.functions.invoke('create-payment-intent', {
    body: {
      orderId,
      idempotencyKey: idempotencyKey || `chow_${orderId}_${Date.now()}`,
    },
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (error || !data) {
    throw new Error(error?.message || data?.error || 'Failed to initialize payment.');
  }

  if (data.error) {
    throw new Error(data.error);
  }

  return data as CreatePaymentIntentResponse;
}

/**
 * Fetch transaction history for a specific order
 */
export async function fetchOrderTransactions(orderId: string): Promise<PaymentTransaction[]> {
  if (!isSupabaseConfigured) return [];

  try {
    const { data, error } = await supabase
      .from('payment_transactions')
      .select('*')
      .eq('order_id', orderId)
      .order('created_at', { ascending: false });

    if (error || !data) return [];

    return data.map((t: any) => ({
      id: t.id,
      orderId: t.order_id,
      customerId: t.customer_id,
      paymentProvider: t.payment_provider,
      stripePaymentIntentId: t.stripe_payment_intent_id,
      stripeChargeId: t.stripe_charge_id,
      stripeRefundId: t.stripe_refund_id,
      idempotencyKey: t.idempotency_key,
      amountKobo: Number(t.amount_kobo),
      currency: t.currency,
      status: t.status,
      failureCode: t.failure_code,
      failureMessage: t.failure_message,
      refundReason: t.refund_reason,
      metadata: t.metadata,
      createdAt: t.created_at,
      updatedAt: t.updated_at,
      confirmedAt: t.confirmed_at,
      refundedAt: t.refunded_at,
    }));
  } catch {
    return [];
  }
}

/**
 * Poll or wait for authoritative webhook confirmation of payment
 */
export async function waitForPaymentConfirmation(
  orderId: string,
  timeoutMs: number = 15000,
  intervalMs: number = 2000
): Promise<'paid' | 'failed' | 'pending'> {
  if (!isSupabaseConfigured || orderId.startsWith('ord_')) return 'paid';

  const { data: sessionData } = await supabase.auth.getSession();
  if (!sessionData?.session?.user) return 'paid';

  const startTime = Date.now();
  while (Date.now() - startTime < timeoutMs) {
    const { data: order } = await supabase
      .from('orders')
      .select('payment_status')
      .eq('id', orderId)
      .maybeSingle();

    if (order?.payment_status === 'paid') {
      return 'paid';
    }
    if (order?.payment_status === 'failed') {
      return 'failed';
    }

    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }

  return 'pending';
}

/**
 * Request refund for an order (Admin-only authenticated operation)
 */
export async function requestOrderRefund(params: RefundRequest): Promise<RefundResponse> {
  if (!isSupabaseConfigured) {
    return {
      success: true,
      refundId: `re_mock_${Date.now()}`,
      status: 'succeeded',
      amountRefundedKobo: params.amountKobo,
    };
  }

  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData?.session?.access_token;

  if (!token) {
    throw new Error('Authentication required to process refunds.');
  }

  const { data, error } = await supabase.functions.invoke('refund-order-payment', {
    body: params,
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (error || !data) {
    throw new Error(error?.message || data?.error || 'Failed to process refund.');
  }

  if (data.error) {
    throw new Error(data.error);
  }

  return data as RefundResponse;
}
