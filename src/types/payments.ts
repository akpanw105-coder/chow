/**
 * Stripe Payment & Checkout Types — Chow
 * Defines client and server models for payments, idempotency,
 * transaction history, refunds, and webhook reconciliation.
 */

export type ChowPaymentMethod = 'card' | 'transfer' | 'cash';

export type PaymentTransactionStatus =
  | 'initiated'
  | 'requires_action'
  | 'processing'
  | 'succeeded'
  | 'failed'
  | 'canceled'
  | 'refund_pending'
  | 'partially_refunded'
  | 'refunded';

export interface PaymentTransaction {
  id: string;
  orderId: string;
  customerId: string;
  paymentProvider: 'stripe' | 'paystack' | 'manual';
  stripePaymentIntentId?: string;
  stripeChargeId?: string;
  stripeRefundId?: string;
  idempotencyKey?: string;
  amountKobo: number;
  currency: string;
  status: PaymentTransactionStatus;
  failureCode?: string;
  failureMessage?: string;
  refundReason?: string;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  confirmedAt?: string;
  refundedAt?: string;
}

export interface CreatePaymentIntentRequest {
  orderId: string;
  amountKobo: number;
  currency: string; // 'ngn' or 'usd'
  idempotencyKey: string;
  returnUrl?: string;
}

export interface CreatePaymentIntentResponse {
  paymentIntentId: string;
  clientSecret: string;
  amountKobo: number;
  currency: string;
  status: PaymentTransactionStatus;
  requiresAction?: boolean;
}

export interface PaymentVerificationResult {
  verified: boolean;
  orderId: string;
  paymentIntentId: string;
  status: PaymentTransactionStatus;
  amountKobo: number;
  currency: string;
  errorMessage?: string;
}

export interface RefundRequest {
  orderId: string;
  paymentIntentId: string;
  amountKobo?: number; // Optional: defaults to full order amount
  reason?: 'duplicate' | 'fraudulent' | 'requested_by_customer';
  notes?: string;
}

export interface RefundResponse {
  success: boolean;
  refundId?: string;
  status: 'pending' | 'succeeded' | 'failed';
  amountRefundedKobo?: number;
  errorMessage?: string;
}
