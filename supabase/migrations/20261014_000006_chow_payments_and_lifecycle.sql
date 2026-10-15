-- ============================================================================
-- CHOW FOOD DELIVERY — PAYMENT TRANSACTIONS & ENHANCED LIFECYCLE MIGRATION
-- Migration: 20261014_000006_chow_payments_and_lifecycle.sql
-- ============================================================================

-- 1. Create payment_transaction_status enum
DO $$ BEGIN
    CREATE TYPE payment_transaction_status AS ENUM (
        'initiated',
        'requires_action',
        'processing',
        'succeeded',
        'failed',
        'canceled',
        'refund_pending',
        'partially_refunded',
        'refunded'
    );
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 2. Create payment_transactions table for auditable payment history
CREATE TABLE IF NOT EXISTS public.payment_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.chow_orders(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    payment_provider TEXT NOT NULL DEFAULT 'stripe',
    stripe_payment_intent_id TEXT,
    stripe_charge_id TEXT,
    stripe_refund_id TEXT,
    idempotency_key TEXT,
    amount_kobo BIGINT NOT NULL CHECK (amount_kobo > 0),
    currency TEXT NOT NULL DEFAULT 'NGN',
    status payment_transaction_status NOT NULL DEFAULT 'initiated',
    failure_code TEXT,
    failure_message TEXT,
    refund_reason TEXT,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    confirmed_at TIMESTAMPTZ,
    refunded_at TIMESTAMPTZ
);

-- Indexes & Constraints
CREATE UNIQUE INDEX IF NOT EXISTS idx_payment_transactions_stripe_pi
    ON public.payment_transactions(stripe_payment_intent_id)
    WHERE stripe_payment_intent_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_payment_transactions_idempotency
    ON public.payment_transactions(idempotency_key)
    WHERE idempotency_key IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_payment_transactions_order_id ON public.payment_transactions(order_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_customer_id ON public.payment_transactions(customer_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_status ON public.payment_transactions(status);

-- 3. Webhook idempotency and deduplication table
CREATE TABLE IF NOT EXISTS public.processed_stripe_events (
    id TEXT PRIMARY KEY, -- Stripe Event ID (evt_...)
    event_type TEXT NOT NULL,
    payment_intent_id TEXT,
    order_id UUID REFERENCES public.chow_orders(id) ON DELETE SET NULL,
    processed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_processed_stripe_events_pi ON public.processed_stripe_events(payment_intent_id);

-- 4. Enable RLS
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.processed_stripe_events ENABLE ROW LEVEL SECURITY;

-- Customers can view their own transactions
DROP POLICY IF EXISTS "Customers view own transactions" ON public.payment_transactions;
CREATE POLICY "Customers view own transactions" ON public.payment_transactions
    FOR SELECT TO authenticated
    USING (customer_id = auth.uid() OR public.is_admin());

-- Only admins and service role can modify transactions
DROP POLICY IF EXISTS "Admins manage transactions" ON public.payment_transactions;
CREATE POLICY "Admins manage transactions" ON public.payment_transactions
    FOR ALL TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- Processed events table: only admin / service role
DROP POLICY IF EXISTS "Admins view processed events" ON public.processed_stripe_events;
CREATE POLICY "Admins view processed events" ON public.processed_stripe_events
    FOR SELECT TO authenticated
    USING (public.is_admin());

-- Updated_at trigger for payment_transactions
DROP TRIGGER IF EXISTS set_payment_transactions_updated_at ON public.payment_transactions;
CREATE TRIGGER set_payment_transactions_updated_at
    BEFORE UPDATE ON public.payment_transactions
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Add to Realtime publication if not already included
DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.payment_transactions;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- ─── 5. SECURE ADMIN ORDER STATUS RPC ───────────────────────────────────────
CREATE OR REPLACE FUNCTION public.update_order_status_secure(
    p_order_id UUID,
    p_new_status chow_order_status,
    p_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID;
    v_order RECORD;
    v_prev_status chow_order_status;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required.';
    END IF;

    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Unauthorized: only Chow administrators can update order fulfillment status.';
    END IF;

    SELECT * INTO v_order FROM public.chow_orders WHERE id = p_order_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Order not found.';
    END IF;

    -- Safety check: Do not permit dispatching or delivering unpaid card orders
    IF p_new_status IN ('assigned', 'picked_up', 'out_for_delivery', 'delivered')
       AND v_order.payment_method = 'card'
       AND v_order.payment_status != 'paid' THEN
        RAISE EXCEPTION 'Cannot advance un-paid card order to %.', p_new_status;
    END IF;

    v_prev_status := v_order.status;

    UPDATE public.chow_orders
    SET
        status = p_new_status,
        updated_at = now(),
        confirmed_at = CASE WHEN p_new_status = 'confirmed' AND confirmed_at IS NULL THEN now() ELSE confirmed_at END,
        prepared_at = CASE WHEN p_new_status = 'ready_for_pickup' AND prepared_at IS NULL THEN now() ELSE prepared_at END,
        dispatched_at = CASE WHEN p_new_status = 'out_for_delivery' AND dispatched_at IS NULL THEN now() ELSE dispatched_at END,
        delivered_at = CASE WHEN p_new_status = 'delivered' AND delivered_at IS NULL THEN now() ELSE delivered_at END,
        cancelled_at = CASE WHEN p_new_status = 'cancelled' AND cancelled_at IS NULL THEN now() ELSE cancelled_at END,
        cancellation_reason = CASE WHEN p_new_status = 'cancelled' THEN COALESCE(p_notes, cancellation_reason) ELSE cancellation_reason END
    WHERE id = p_order_id;

    -- Log audit trail
    INSERT INTO public.order_status_history (
        order_id,
        changed_by,
        previous_status,
        new_status,
        notes
    ) VALUES (
        p_order_id,
        v_user_id,
        v_prev_status,
        p_new_status,
        p_notes
    );

    RETURN jsonb_build_object(
        'success', true,
        'order_id', p_order_id,
        'previous_status', v_prev_status,
        'new_status', p_new_status
    );
END;
$$;

-- ─── 6. SECURE DISPATCH RIDER ASSIGNMENT RPC ────────────────────────────────
CREATE OR REPLACE FUNCTION public.assign_dispatch_rider_secure(
    p_order_id UUID,
    p_rider_id UUID,
    p_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_admin_id UUID;
    v_order RECORD;
    v_rider RECORD;
BEGIN
    v_admin_id := auth.uid();
    IF v_admin_id IS NULL OR NOT public.is_admin() THEN
        RAISE EXCEPTION 'Unauthorized: only administrators can assign dispatch couriers.';
    END IF;

    SELECT * INTO v_order FROM public.chow_orders WHERE id = p_order_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Order not found.';
    END IF;

    -- Card orders must be paid before courier assignment
    IF v_order.payment_method = 'card' AND v_order.payment_status != 'paid' THEN
        RAISE EXCEPTION 'Cannot dispatch courier for unpaid card order %.', v_order.order_number;
    END IF;

    SELECT * INTO v_rider FROM public.profiles WHERE id = p_rider_id AND role = 'dispatch_rider';
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Courier not found or not registered as a dispatch rider.';
    END IF;

    INSERT INTO public.dispatch_assignments (
        order_id,
        rider_id,
        assigned_by,
        status,
        delivery_notes
    )
    VALUES (
        p_order_id,
        p_rider_id,
        v_admin_id,
        'assigned',
        p_notes
    )
    ON CONFLICT (order_id, rider_id)
    DO UPDATE SET
        status = 'assigned',
        assigned_by = v_admin_id,
        delivery_notes = COALESCE(p_notes, dispatch_assignments.delivery_notes),
        updated_at = now();

    UPDATE public.chow_orders
    SET status = 'assigned', updated_at = now()
    WHERE id = p_order_id;

    RETURN jsonb_build_object(
        'success', true,
        'order_id', p_order_id,
        'rider_id', p_rider_id,
        'rider_name', v_rider.full_name
    );
END;
$$;

-- ─── 7. SECURE PAYMENT RECORDING RPC (Service Role / Webhook Engine) ────────
CREATE OR REPLACE FUNCTION public.record_payment_event_secure(
    p_order_id UUID,
    p_payment_intent_id TEXT,
    p_charge_id TEXT,
    p_status payment_transaction_status,
    p_amount_kobo BIGINT,
    p_currency TEXT DEFAULT 'NGN',
    p_failure_code TEXT DEFAULT NULL,
    p_failure_message TEXT DEFAULT NULL,
    p_idempotency_key TEXT DEFAULT NULL,
    p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_order RECORD;
    v_txn_id UUID;
BEGIN
    SELECT * INTO v_order FROM public.chow_orders WHERE id = p_order_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Order % not found.', p_order_id;
    END IF;

    -- Verify amount and currency match order requirements
    IF p_status = 'succeeded' AND (v_order.total_kobo != p_amount_kobo OR upper(v_order.currency) != upper(p_currency)) THEN
        RAISE EXCEPTION 'Security alert: Payment amount (% %) does not match order requirement (% %)',
            p_amount_kobo, p_currency, v_order.total_kobo, v_order.currency;
    END IF;

    -- Insert or update transaction record
    INSERT INTO public.payment_transactions (
        order_id,
        customer_id,
        payment_provider,
        stripe_payment_intent_id,
        stripe_charge_id,
        idempotency_key,
        amount_kobo,
        currency,
        status,
        failure_code,
        failure_message,
        metadata,
        confirmed_at
    )
    VALUES (
        p_order_id,
        v_order.customer_id,
        'stripe',
        p_payment_intent_id,
        p_charge_id,
        p_idempotency_key,
        p_amount_kobo,
        p_currency,
        p_status,
        p_failure_code,
        p_failure_message,
        p_metadata,
        CASE WHEN p_status = 'succeeded' THEN now() ELSE NULL END
    )
    ON CONFLICT (stripe_payment_intent_id) DO UPDATE SET
        status = EXCLUDED.status,
        stripe_charge_id = COALESCE(EXCLUDED.stripe_charge_id, payment_transactions.stripe_charge_id),
        failure_code = EXCLUDED.failure_code,
        failure_message = EXCLUDED.failure_message,
        confirmed_at = CASE WHEN EXCLUDED.status = 'succeeded' THEN now() ELSE payment_transactions.confirmed_at END,
        metadata = payment_transactions.metadata || EXCLUDED.metadata,
        updated_at = now()
    RETURNING id INTO v_txn_id;

    -- Authoritatively update order payment status
    IF p_status = 'succeeded' THEN
        UPDATE public.chow_orders
        SET
            payment_status = 'paid',
            stripe_payment_intent_id = p_payment_intent_id,
            status = CASE WHEN status = 'pending' THEN 'confirmed'::chow_order_status ELSE status END,
            confirmed_at = COALESCE(confirmed_at, now()),
            updated_at = now()
        WHERE id = p_order_id;

        INSERT INTO public.order_status_history (
            order_id,
            changed_by,
            previous_status,
            new_status,
            notes
        ) VALUES (
            p_order_id,
            v_order.customer_id,
            v_order.status,
            'confirmed',
            'Payment of ' || (p_amount_kobo / 100)::text || ' ' || p_currency || ' verified via Stripe (' || p_payment_intent_id || ').'
        );
    ELSIF p_status = 'failed' AND v_order.payment_status != 'paid' THEN
        UPDATE public.chow_orders
        SET payment_status = 'failed', updated_at = now()
        WHERE id = p_order_id;
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'transaction_id', v_txn_id,
        'order_id', p_order_id,
        'status', p_status
    );
END;
$$;
