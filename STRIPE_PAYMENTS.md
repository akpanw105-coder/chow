# CHOW MOBILE APP — STRIPE PAYMENT & ORDER LIFECYCLE ARCHITECTURE

This document outlines the production-ready payment gateway and complete order lifecycle integration for the **Chow Mobile Application**, combining Supabase (PostgreSQL 15+, RLS, Edge Functions, Realtime) with the **Stripe Payment Gateway**.

---

## 1. ARCHITECTURE OVERVIEW

```
┌──────────────────────────────────────────────────────────────┐
│                    Chow Mobile App (Expo)                    │
│   • CheckoutScreen.tsx (Idempotent form submission)          │
│   • OrderTrackingScreen.tsx (Realtime status sync)           │
│   • OrderSuccessScreen.tsx (Verified payment confirmation)   │
└──────────────┬──────────────────────────────▲────────────────┘
               │ 1. Place Order (RPC)         │ Realtime updates
               ▼                              │
┌──────────────────────────────────────────────────────────────┐
│                    Supabase Backend                          │
│                                                              │
│  [Database RPC]                                              │
│  • create_order_secure: Recalculates totals from trusted     │
│    database prices in integer Kobo; checks availability.     │
│                                                              │
│  [Edge Functions]                                            │
│  • create-payment-intent: Verifies customer ownership,       │
│    calls Stripe API with trusted Kobo amount, stores         │
│    payment_transactions record.                              │
│                                                              │
│  • stripe-webhook: Verifies raw signature from Stripe,       │
│    deduplicates event ID in processed_stripe_events,         │
│    updates chow_orders & payment_transactions atomically.   │
│                                                              │
│  • refund-order-payment: Authenticated admin refund endpoint │
│    with audit trail logging.                                 │
└──────────────┬──────────────────────────────▲────────────────┘
               │ 2. Create PaymentIntent      │ 3. Signed Webhook
               ▼                              │    (Event Dispatch)
┌──────────────────────────────────────────────────────────────┐
│                     Stripe Gateway API                       │
│  • acct_1UPWBtPRY86qvmcH ("Akpan sandbox")                   │
│  • PaymentIntents API / Webhooks Engine                      │
└──────────────────────────────────────────────────────────────┘
```

---

## 2. STRIPE ACCOUNT DISCOVERY & NIGERIAN CURRENCY LIMITATION

During inspection using the official Stripe MCP:
- **Connected Account**: `acct_1UPWBtPRY86qvmcH` (*Akpan sandbox*)
- **Documentation Verification**:
  - In Stripe, **Nigerian domestic card & bank transfer payment methods (`ng_card`, `ng_bank_transfer`) require approval / private preview and settlement through Stripe's local Merchant of Record partner**.
  - Direct local payment capabilities for standard Nigerian Connect accounts are natively routed via Paystack.
  - Standard card charges in `NGN` (Nigerian Naira) are supported on international Stripe accounts with standard currency conversion and settlement rules.
- **Decision & Abstraction**:
  - Chow uses an authoritative integer **Kobo (NGN minor unit)** model (e.g. ₦5,200.00 = `520000` kobo).
  - A clean provider abstraction (`payment_provider = 'stripe'`) is enforced in `payment_transactions`.
  - The client UI clearly reflects whether the gateway is running in Sandbox mode and never assumes simulated success.

---

## 3. DATABASE SCHEMA & MIGRATIONS

### New Tables & Enums in Migration `20261014_000006_chow_payments_and_lifecycle.sql`:

1. **`payment_transaction_status` Enum**:
   `initiated`, `requires_action`, `processing`, `succeeded`, `failed`, `canceled`, `refund_pending`, `partially_refunded`, `refunded`.

2. **`payment_transactions` Table**:
   - `id`: UUID primary key
   - `order_id`: UUID references `chow_orders(id)`
   - `customer_id`: UUID references `profiles(id)`
   - `payment_provider`: Text (`stripe`)
   - `stripe_payment_intent_id`: Unique index, tracks Stripe reference
   - `stripe_charge_id`: Charge ID for refunds
   - `stripe_refund_id`: Refund identifier
   - `idempotency_key`: Unique token to prevent duplicate charges
   - `amount_kobo`: BigInt (authoritative minor unit)
   - `currency`: Text (`NGN`)
   - `status`: `payment_transaction_status`
   - `failure_code`, `failure_message`, `refund_reason`
   - `metadata`: JSONB audit payloads
   - `confirmed_at`, `refunded_at` timestamps

3. **`processed_stripe_events` Table**:
   - `id`: Text primary key (`evt_...`)
   - `event_type`: Text (`payment_intent.succeeded`, etc.)
   - `payment_intent_id`: Text
   - `order_id`: UUID
   - Guarantees **exact-once** webhook processing.

4. **Security Definer RPCs**:
   - `record_payment_event_secure`: Atomic database update from webhook events that verifies that the paid amount matches the order requirement before updating order payment status to `paid`.
   - `update_order_status_secure`: Prevents advancing unpaid card orders to fulfillment (`assigned`, `picked_up`, `out_for_delivery`, `delivered`).
   - `assign_dispatch_rider_secure`: Ensures dispatch riders cannot be assigned to unpaid card orders.

---

## 4. SECURE STRIPE EDGE FUNCTIONS

Located in `supabase/functions/`:

1. **`create-payment-intent`** (`supabase/functions/create-payment-intent/index.ts`):
   - Authenticates caller using Supabase Auth JWT.
   - Verifies customer owns the order.
   - Checks that order is not already paid.
   - Checks if an active transaction with the same `idempotencyKey` already exists.
   - Creates `PaymentIntent` with Stripe API using database-calculated Kobo amount.
   - Inserts audit record in `payment_transactions`.

2. **`stripe-webhook`** (`supabase/functions/stripe-webhook/index.ts`):
   - Reads the raw request body stream.
   - Validates `stripe-signature` against `STRIPE_WEBHOOK_SECRET` using `stripe.webhooks.constructEventAsync()`.
   - Checks `processed_stripe_events` to ignore duplicate webhook deliveries.
   - Handles:
     - `payment_intent.succeeded`: Marks transaction and order `paid`, logs audit history.
     - `payment_intent.payment_failed`: Records safe failure reason.
     - `payment_intent.canceled`: Updates transaction status.
     - `charge.refunded`: Synchronizes refund state and cancels order fulfillment.

3. **`refund-order-payment`** (`supabase/functions/refund-order-payment/index.ts`):
   - Authenticates caller and verifies `role = 'admin'` in `profiles`.
   - Validates that order is paid and has an associated Stripe `PaymentIntent`.
   - Calls Stripe Refunds API.
   - Records refund audit and updates order status.

---

## 5. ENVIRONMENT VARIABLES CONFIGURATION

Configure these variables in your deployment environments:

### Client Mobile App (`.env`):
```env
EXPO_PUBLIC_SUPABASE_URL=https://bdeoqfznozkruoqwovhf.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_... # From Stripe Dashboard
```

### Supabase Edge Functions Secrets:
Run the following in your terminal with Supabase CLI (or set via Supabase Dashboard -> Edge Functions -> Secrets):
```bash
npx supabase secrets set STRIPE_SECRET_KEY=sk_test_...
npx supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...
```
*(Never commit secret keys to git repositories or bundle them in the client app!)*

---

## 6. LOCAL TESTING & WEBHOOK FORWARDING

To test the end-to-end webhook flow during local development:

1. **Install Stripe CLI**:
   ```bash
   npm install -g stripe
   stripe login
   ```
2. **Forward Webhook to Local Function**:
   ```bash
   stripe listen --forward-to https://bdeoqfznozkruoqwovhf.supabase.co/functions/v1/stripe-webhook
   ```
3. Copy the output secret starting with `whsec_...` and configure it in your Supabase secrets:
   ```bash
   npx supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...
   ```
4. **Trigger a Test Payment**:
   ```bash
   stripe trigger payment_intent.succeeded
   ```

---

## 7. MANUAL DASHBOARD STEPS REQUIRED

1. **Apply Migration**:
   In your [Supabase Dashboard SQL Editor](https://supabase.com/dashboard/project/bdeoqfznozkruoqwovhf/sql), run the script in:
   [supabase/migrations/20261014_000006_chow_payments_and_lifecycle.sql](file:///c:/Users/USER/Documents/foodapp/chow/supabase/migrations/20261014_000006_chow_payments_and_lifecycle.sql).

2. **Deploy Edge Functions**:
   ```bash
   npx supabase functions deploy create-payment-intent
   npx supabase functions deploy stripe-webhook --no-verify-jwt
   npx supabase functions deploy refund-order-payment
   ```
   *(Note: `--no-verify-jwt` is required on `stripe-webhook` because Stripe signs the request using the `Stripe-Signature` HMAC header rather than a Supabase JWT)*.

3. **Configure Webhook in Stripe Dashboard**:
   - Go to [Stripe Dashboard > Developers > Webhooks](https://dashboard.stripe.com/test/webhooks).
   - Add endpoint: `https://bdeoqfznozkruoqwovhf.supabase.co/functions/v1/stripe-webhook`.
   - Select events:
     - `payment_intent.succeeded`
     - `payment_intent.payment_failed`
     - `payment_intent.canceled`
     - `charge.refunded`
