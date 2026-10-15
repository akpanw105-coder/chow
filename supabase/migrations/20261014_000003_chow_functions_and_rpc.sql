-- ============================================================================
-- CHOW FOOD DELIVERY — COMPLETE DATABASE SCHEMA MIGRATION (03 Functions & RPC)
-- Target: PostgreSQL / Supabase
-- Description: Trusted atomic order creation, status transitions, rider operations
-- ============================================================================

-- ─── 1. SECURE ATOMIC ORDER CREATION RPC ─────────────────────────────────────
-- Validates caller, products, availability, option values, computes trusted totals
-- in integer Kobo, inserts order and line items atomically.
CREATE OR REPLACE FUNCTION public.create_order_secure(
    p_delivery_address TEXT,
    p_recipient_phone TEXT,
    p_payment_method TEXT DEFAULT 'card',
    p_customer_notes TEXT DEFAULT NULL,
    p_items JSONB DEFAULT '[]'::jsonb,
    p_address_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID;
    v_order_id UUID;
    v_order_number TEXT;
    v_item JSONB;
    v_product RECORD;
    v_product_id TEXT;
    v_quantity INTEGER;
    v_unit_price_kobo BIGINT;
    v_line_total_kobo BIGINT;
    v_calculated_subtotal_kobo BIGINT := 0;
    v_delivery_fee_kobo BIGINT := 120000;  -- ₦1,200.00 in Kobo
    v_packaging_fee_kobo BIGINT := 60000;  -- ₦600.00 in Kobo
    v_discount_kobo BIGINT := 0;
    v_total_kobo BIGINT := 0;
    v_primary_restaurant TEXT := 'Calabar Kitchen';
    v_items_count INTEGER;
    v_option_delta_kobo BIGINT;
    v_swallow_id TEXT;
    v_portion_id TEXT;
    v_result JSONB;
BEGIN
    -- 1. Verify caller is authenticated
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required to place an order.';
    END IF;

    -- 2. Validate parameters
    IF p_delivery_address IS NULL OR length(trim(p_delivery_address)) = 0 THEN
        RAISE EXCEPTION 'Delivery address is required.';
    END IF;

    IF p_recipient_phone IS NULL OR length(trim(p_recipient_phone)) = 0 THEN
        RAISE EXCEPTION 'Recipient phone number is required.';
    END IF;

    v_items_count := jsonb_array_length(p_items);
    IF v_items_count IS NULL OR v_items_count = 0 THEN
        RAISE EXCEPTION 'Cannot create an empty order. Please add at least one item.';
    END IF;

    -- 3. Generate unique order number (e.g. CHOW-8921)
    LOOP
        v_order_number := 'CHOW-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::text, 5, '0');
        EXIT WHEN NOT EXISTS (SELECT 1 FROM public.orders WHERE order_number = v_order_number);
    END LOOP;

    -- 4. Calculate subtotal by querying authoritative product records
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        v_product_id := v_item->>'product_id';
        v_quantity := COALESCE((v_item->>'quantity')::integer, 1);

        IF v_quantity <= 0 THEN
            RAISE EXCEPTION 'Item quantity must be greater than zero for product %.', v_product_id;
        END IF;

        -- Fetch product from database
        SELECT * INTO v_product FROM public.products WHERE id = v_product_id;
        IF NOT FOUND THEN
            RAISE EXCEPTION 'Product % does not exist.', v_product_id;
        END IF;

        IF NOT v_product.is_available THEN
            RAISE EXCEPTION 'Product "%" is currently out of stock.', v_product.name;
        END IF;

        v_unit_price_kobo := v_product.price_kobo;

        -- Check if portion option alters price
        v_portion_id := v_item->'selected_options'->>'portion_id';
        IF v_portion_id IS NOT NULL THEN
            -- Check for configured delta
            SELECT COALESCE(price_delta_kobo, 0) INTO v_option_delta_kobo
            FROM public.product_option_values
            WHERE id::text = v_portion_id;

            IF FOUND AND v_option_delta_kobo > 0 THEN
                v_unit_price_kobo := v_unit_price_kobo + v_option_delta_kobo;
            END IF;
        END IF;

        v_line_total_kobo := v_unit_price_kobo * v_quantity;
        v_calculated_subtotal_kobo := v_calculated_subtotal_kobo + v_line_total_kobo;
        v_primary_restaurant := v_product.restaurant_name;
    END LOOP;

    -- 5. Calculate authoritative total
    v_total_kobo := v_calculated_subtotal_kobo + v_delivery_fee_kobo + v_packaging_fee_kobo - v_discount_kobo;

    -- 6. Insert Order Header
    INSERT INTO public.orders (
        order_number,
        customer_id,
        address_id,
        delivery_address_snapshot,
        recipient_phone,
        customer_notes,
        status,
        payment_status,
        payment_method,
        currency,
        subtotal_kobo,
        delivery_fee_kobo,
        packaging_fee_kobo,
        discount_kobo,
        total_kobo,
        restaurant_name,
        estimated_delivery_time,
        confirmed_at
    )
    VALUES (
        v_order_number,
        v_user_id,
        p_address_id,
        trim(p_delivery_address),
        trim(p_recipient_phone),
        p_customer_notes,
        'confirmed', -- Auto-confirmed initial workflow state
        'pending',   -- Payment is pending until provider integration
        COALESCE(p_payment_method, 'card'),
        'NGN',
        v_calculated_subtotal_kobo,
        v_delivery_fee_kobo,
        v_packaging_fee_kobo,
        v_discount_kobo,
        v_total_kobo,
        v_primary_restaurant,
        '25-35 min',
        now()
    )
    RETURNING id INTO v_order_id;

    -- 7. Insert Order Items
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        v_product_id := v_item->>'product_id';
        v_quantity := COALESCE((v_item->>'quantity')::integer, 1);

        SELECT * INTO v_product FROM public.products WHERE id = v_product_id;
        v_unit_price_kobo := v_product.price_kobo;

        v_portion_id := v_item->'selected_options'->>'portion_id';
        IF v_portion_id IS NOT NULL THEN
            SELECT COALESCE(price_delta_kobo, 0) INTO v_option_delta_kobo
            FROM public.product_option_values
            WHERE id::text = v_portion_id;

            IF FOUND AND v_option_delta_kobo > 0 THEN
                v_unit_price_kobo := v_unit_price_kobo + v_option_delta_kobo;
            END IF;
        END IF;

        v_line_total_kobo := v_unit_price_kobo * v_quantity;

        INSERT INTO public.order_items (
            order_id,
            product_id,
            product_name,
            quantity,
            unit_price_kobo,
            selected_options,
            line_total_kobo
        )
        VALUES (
            v_order_id,
            v_product.id,
            v_product.name,
            v_quantity,
            v_unit_price_kobo,
            COALESCE(v_item->'selected_options', '{}'::jsonb),
            v_line_total_kobo
        );
    END LOOP;

    -- 8. Log initial status
    INSERT INTO public.order_status_history (
        order_id,
        changed_by,
        previous_status,
        new_status,
        notes
    )
    VALUES (
        v_order_id,
        v_user_id,
        NULL,
        'confirmed',
        'Order submitted and confirmed via Chow App.'
    );

    -- 9. Build and return result object
    SELECT jsonb_build_object(
        'id', o.id,
        'order_number', o.order_number,
        'customer_id', o.customer_id,
        'status', o.status,
        'payment_status', o.payment_status,
        'subtotal_kobo', o.subtotal_kobo,
        'delivery_fee_kobo', o.delivery_fee_kobo,
        'packaging_fee_kobo', o.packaging_fee_kobo,
        'total_kobo', o.total_kobo,
        'subtotal', o.subtotal_kobo / 100,
        'total', o.total_kobo / 100,
        'currency', o.currency,
        'delivery_address', o.delivery_address_snapshot,
        'created_at', o.created_at
    ) INTO v_result
    FROM public.orders o
    WHERE o.id = v_order_id;

    RETURN v_result;
END;
$$;

-- ─── 2. SECURE ORDER STATUS TRANSITION RPC ───────────────────────────────────
CREATE OR REPLACE FUNCTION public.update_order_status_secure(
    p_order_id UUID,
    p_new_status order_status,
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
    v_user_role user_role;
    v_is_assigned_rider BOOLEAN := false;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required.';
    END IF;

    SELECT role INTO v_user_role FROM public.profiles WHERE id = v_user_id;
    SELECT * INTO v_order FROM public.orders WHERE id = p_order_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Order not found.';
    END IF;

    -- Check if caller is the assigned rider
    IF v_user_role = 'dispatch_rider' THEN
        SELECT EXISTS (
            SELECT 1 FROM public.dispatch_assignments
            WHERE order_id = p_order_id AND rider_id = v_user_id
        ) INTO v_is_assigned_rider;
    END IF;

    -- Transition rules:
    -- Customer: can only cancel their own pending/confirmed order
    IF v_user_role = 'customer' THEN
        IF v_order.customer_id <> v_user_id THEN
            RAISE EXCEPTION 'Unauthorized: cannot modify an order that is not yours.';
        END IF;
        IF p_new_status <> 'cancelled' THEN
            RAISE EXCEPTION 'Customers may only request cancellation.';
        END IF;
        IF v_order.status NOT IN ('pending', 'confirmed') THEN
            RAISE EXCEPTION 'Order cannot be cancelled after food preparation has begun.';
        END IF;
    -- Rider: can only transition assigned -> picked_up -> delivered
    ELSIF v_user_role = 'dispatch_rider' THEN
        IF NOT v_is_assigned_rider THEN
            RAISE EXCEPTION 'Unauthorized: you are not assigned to this delivery.';
        END IF;
        IF p_new_status NOT IN ('picked_up', 'out_for_delivery', 'delivered') THEN
            RAISE EXCEPTION 'Riders can only mark an order as picked up, out for delivery, or delivered.';
        END IF;
    -- Admin: can execute any transition
    ELSIF v_user_role <> 'admin' THEN
        RAISE EXCEPTION 'Unauthorized role.';
    END IF;

    -- Update order status
    UPDATE public.orders
    SET
        status = p_new_status,
        confirmed_at = CASE WHEN p_new_status = 'confirmed' AND confirmed_at IS NULL THEN now() ELSE confirmed_at END,
        prepared_at = CASE WHEN p_new_status = 'ready_for_pickup' AND prepared_at IS NULL THEN now() ELSE prepared_at END,
        dispatched_at = CASE WHEN p_new_status IN ('picked_up', 'out_for_delivery') AND dispatched_at IS NULL THEN now() ELSE dispatched_at END,
        delivered_at = CASE WHEN p_new_status = 'delivered' AND delivered_at IS NULL THEN now() ELSE delivered_at END,
        cancelled_at = CASE WHEN p_new_status = 'cancelled' AND cancelled_at IS NULL THEN now() ELSE cancelled_at END,
        cancellation_reason = CASE WHEN p_new_status = 'cancelled' THEN p_notes ELSE cancellation_reason END
    WHERE id = p_order_id;

    RETURN jsonb_build_object(
        'success', true,
        'order_id', p_order_id,
        'previous_status', v_order.status,
        'new_status', p_new_status
    );
END;
$$;

-- ─── 3. SECURE RIDER ASSIGNMENT RPC (ADMIN ONLY) ─────────────────────────────
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
    v_rider_role user_role;
    v_order RECORD;
    v_assignment_id UUID;
BEGIN
    v_admin_id := auth.uid();
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Unauthorized: only admins can assign dispatch riders.';
    END IF;

    SELECT role INTO v_rider_role FROM public.profiles WHERE id = p_rider_id;
    IF v_rider_role IS NULL OR v_rider_role <> 'dispatch_rider' THEN
        RAISE EXCEPTION 'Designated user is not a valid dispatch rider.';
    END IF;

    SELECT * INTO v_order FROM public.orders WHERE id = p_order_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Order not found.';
    END IF;

    -- Insert or update dispatch assignment
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
    ON CONFLICT (order_id, rider_id) DO UPDATE SET
        status = 'assigned',
        delivery_notes = EXCLUDED.delivery_notes,
        assigned_at = now()
    RETURNING id INTO v_assignment_id;

    -- Update order status to assigned
    UPDATE public.orders
    SET status = 'assigned'
    WHERE id = p_order_id;

    RETURN jsonb_build_object(
        'success', true,
        'assignment_id', v_assignment_id,
        'order_id', p_order_id,
        'rider_id', p_rider_id
    );
END;
$$;
