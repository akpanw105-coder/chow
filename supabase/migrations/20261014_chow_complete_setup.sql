-- ============================================================================
-- CHOW FOOD DELIVERY — COMPLETE ONE-CLICK SUPABASE SETUP SCRIPT
-- Application: Chow (South-South Nigerian Food Ordering & Delivery)
-- Database: PostgreSQL 15+ / Supabase
--
-- Instructions:
-- 1. Create a new project in your Supabase dashboard (https://supabase.com).
-- 2. Open the SQL Editor in your Supabase project.
-- 3. Paste and run this script.
-- 4. Copy your Project URL & Anon Key into your .env file:
--    EXPO_PUBLIC_SUPABASE_URL=https://<your-project-ref>.supabase.co
--    EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...
-- ============================================================================

-- ─── 0. EXTENSIONS ───────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── 1. CUSTOM TYPES & ENUMS ─────────────────────────────────────────────────
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('customer', 'admin', 'dispatch_rider');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE order_status AS ENUM (
        'pending',
        'confirmed',
        'preparing',
        'ready_for_pickup',
        'assigned',
        'picked_up',
        'out_for_delivery',
        'delivered',
        'cancelled'
    );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE payment_status AS ENUM (
        'pending',
        'paid',
        'failed',
        'refunded'
    );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE assignment_status AS ENUM (
        'assigned',
        'accepted',
        'picked_up',
        'completed',
        'cancelled'
    );
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ─── 2. TABLES ───────────────────────────────────────────────────────────────

-- User Profiles
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT,
    phone_number TEXT,
    avatar_url TEXT,
    role user_role NOT NULL DEFAULT 'customer',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Delivery Addresses
CREATE TABLE IF NOT EXISTS public.addresses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    label TEXT NOT NULL DEFAULT 'Home',
    recipient_name TEXT,
    recipient_phone TEXT,
    address_line TEXT NOT NULL,
    city TEXT NOT NULL DEFAULT 'Calabar',
    state TEXT NOT NULL DEFAULT 'Cross River State',
    delivery_instructions TEXT,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    is_default BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Food Categories
CREATE TABLE IF NOT EXISTS public.categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    image_url TEXT,
    icon TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Food Products
CREATE TABLE IF NOT EXISTS public.products (
    id TEXT PRIMARY KEY,
    category_id TEXT NOT NULL REFERENCES public.categories(id) ON DELETE RESTRICT,
    name TEXT NOT NULL,
    short_name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT NOT NULL,
    image_url TEXT,
    price_kobo BIGINT NOT NULL CHECK (price_kobo >= 0),
    rating NUMERIC(3, 2) NOT NULL DEFAULT 4.80 CHECK (rating >= 0 AND rating <= 5.0),
    review_count TEXT NOT NULL DEFAULT '1k+',
    calories INTEGER NOT NULL DEFAULT 0,
    preparation_time_minutes INTEGER NOT NULL DEFAULT 25,
    prep_time_text TEXT NOT NULL DEFAULT '20-30 min',
    badge TEXT,
    restaurant_name TEXT NOT NULL DEFAULT 'Calabar Kitchen',
    distance_text TEXT NOT NULL DEFAULT '1.5 Km',
    is_available BOOLEAN NOT NULL DEFAULT true,
    is_featured BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Product Options
CREATE TABLE IF NOT EXISTS public.product_options (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id TEXT NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'single',
    is_required BOOLEAN NOT NULL DEFAULT false,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.product_option_values (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    option_id UUID NOT NULL REFERENCES public.product_options(id) ON DELETE CASCADE,
    label TEXT NOT NULL,
    price_delta_kobo BIGINT NOT NULL DEFAULT 0 CHECK (price_delta_kobo >= 0),
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Orders
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number TEXT UNIQUE NOT NULL,
    customer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    address_id UUID REFERENCES public.addresses(id) ON DELETE SET NULL,
    delivery_address_snapshot TEXT NOT NULL,
    recipient_phone TEXT NOT NULL,
    customer_notes TEXT,
    status order_status NOT NULL DEFAULT 'pending',
    payment_status payment_status NOT NULL DEFAULT 'pending',
    payment_method TEXT NOT NULL DEFAULT 'card',
    stripe_payment_intent_id TEXT,
    stripe_client_secret TEXT,
    currency TEXT NOT NULL DEFAULT 'NGN',
    subtotal_kobo BIGINT NOT NULL CHECK (subtotal_kobo >= 0),
    delivery_fee_kobo BIGINT NOT NULL DEFAULT 120000 CHECK (delivery_fee_kobo >= 0),
    packaging_fee_kobo BIGINT NOT NULL DEFAULT 60000 CHECK (packaging_fee_kobo >= 0),
    discount_kobo BIGINT NOT NULL DEFAULT 0 CHECK (discount_kobo >= 0),
    total_kobo BIGINT NOT NULL CHECK (total_kobo >= 0),
    restaurant_name TEXT NOT NULL DEFAULT 'Calabar Kitchen',
    estimated_delivery_time TEXT DEFAULT '25-35 min',
    confirmed_at TIMESTAMPTZ,
    prepared_at TIMESTAMPTZ,
    dispatched_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    cancellation_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Order Items
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id TEXT REFERENCES public.products(id) ON DELETE SET NULL,
    product_name TEXT NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price_kobo BIGINT NOT NULL CHECK (unit_price_kobo >= 0),
    selected_options JSONB NOT NULL DEFAULT '{}'::jsonb,
    line_total_kobo BIGINT NOT NULL CHECK (line_total_kobo >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Dispatch Assignments
CREATE TABLE IF NOT EXISTS public.dispatch_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    rider_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    assigned_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    status assignment_status NOT NULL DEFAULT 'assigned',
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    accepted_at TIMESTAMPTZ,
    picked_up_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    delivery_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT unique_active_rider_assignment UNIQUE (order_id, rider_id)
);

-- Order Status History
CREATE TABLE IF NOT EXISTS public.order_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    changed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    previous_status order_status,
    new_status order_status NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── 3. INDEXES ─────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_addresses_customer_id ON public.addresses(customer_id);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_available_featured ON public.products(is_available, is_featured);
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON public.orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_dispatch_assignments_order_id ON public.dispatch_assignments(order_id);
CREATE INDEX IF NOT EXISTS idx_dispatch_assignments_rider_id ON public.dispatch_assignments(rider_id);
CREATE INDEX IF NOT EXISTS idx_order_status_history_order_id ON public.order_status_history(order_id);

-- ─── 4. UPDATED_AT TIMESTAMP TRIGGER ─────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_profiles_updated_at ON public.profiles;
CREATE TRIGGER set_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_addresses_updated_at ON public.addresses;
CREATE TRIGGER set_addresses_updated_at BEFORE UPDATE ON public.addresses FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_categories_updated_at ON public.categories;
CREATE TRIGGER set_categories_updated_at BEFORE UPDATE ON public.categories FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_products_updated_at ON public.products;
CREATE TRIGGER set_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_orders_updated_at ON public.orders;
CREATE TRIGGER set_orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_dispatch_assignments_updated_at ON public.dispatch_assignments;
CREATE TRIGGER set_dispatch_assignments_updated_at BEFORE UPDATE ON public.dispatch_assignments FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ─── 5. DEFAULT ADDRESS ENFORCEMENT ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_default_address()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_default = true THEN
        UPDATE public.addresses
        SET is_default = false
        WHERE customer_id = NEW.customer_id AND id <> NEW.id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS enforce_single_default_address ON public.addresses;
CREATE TRIGGER enforce_single_default_address BEFORE INSERT OR UPDATE OF is_default ON public.addresses FOR EACH ROW EXECUTE FUNCTION public.handle_default_address();

-- ─── 6. AUTO-CREATE PROFILE ON AUTH SIGNUP ───────────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, email, phone_number, role, is_active)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', 'Valued Customer'),
        NEW.email,
        NEW.raw_user_meta_data->>'phone_number',
        'customer',
        true
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = CASE WHEN profiles.full_name = 'Valued Customer' THEN EXCLUDED.full_name ELSE profiles.full_name END;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ─── 7. PREVENT CLIENT ROLE ESCALATION ───────────────────────────────────────
CREATE OR REPLACE FUNCTION public.prevent_profile_role_escalation()
RETURNS TRIGGER AS $$
DECLARE
    current_user_role user_role;
BEGIN
    IF NEW.role <> OLD.role THEN
        SELECT role INTO current_user_role FROM public.profiles WHERE id = auth.uid();
        IF current_user_role IS NULL OR current_user_role <> 'admin' THEN
            RAISE EXCEPTION 'Unauthorized: Only administrators can modify user roles.';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS enforce_role_protection ON public.profiles;
CREATE TRIGGER enforce_role_protection BEFORE UPDATE OF role ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.prevent_profile_role_escalation();

-- ─── 8. ORDER STATUS CHANGE AUDIT TRIGGER ────────────────────────────────────
CREATE OR REPLACE FUNCTION public.log_order_status_change()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        INSERT INTO public.order_status_history (order_id, changed_by, previous_status, new_status, notes)
        VALUES (NEW.id, auth.uid(), OLD.status, NEW.status, COALESCE(NEW.cancellation_reason, 'Status updated to ' || NEW.status::text));
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_order_status_history ON public.orders;
CREATE TRIGGER trg_order_status_history AFTER UPDATE OF status ON public.orders FOR EACH ROW EXECUTE FUNCTION public.log_order_status_change();

-- ─── 9. SECURITY HELPER FUNCTIONS & RLS POLICIES ─────────────────────────────
CREATE OR REPLACE FUNCTION public.get_auth_role()
RETURNS user_role AS $$
    SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
    SELECT COALESCE((public.get_auth_role() = 'admin'), false);
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.is_rider()
RETURNS BOOLEAN AS $$
    SELECT COALESCE((public.get_auth_role() = 'dispatch_rider'), false);
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_option_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dispatch_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_status_history ENABLE ROW LEVEL SECURITY;

-- Profiles
DROP POLICY IF EXISTS "Profiles are readable by authenticated users" ON public.profiles;
CREATE POLICY "Profiles are readable by authenticated users" ON public.profiles FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());
DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;
CREATE POLICY "Admins can update any profile" ON public.profiles FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Addresses
DROP POLICY IF EXISTS "Customers can read own addresses" ON public.addresses;
CREATE POLICY "Customers can read own addresses" ON public.addresses FOR SELECT TO authenticated USING (customer_id = auth.uid() OR public.is_admin());
DROP POLICY IF EXISTS "Customers can insert own addresses" ON public.addresses;
CREATE POLICY "Customers can insert own addresses" ON public.addresses FOR INSERT TO authenticated WITH CHECK (customer_id = auth.uid());
DROP POLICY IF EXISTS "Customers can update own addresses" ON public.addresses;
CREATE POLICY "Customers can update own addresses" ON public.addresses FOR UPDATE TO authenticated USING (customer_id = auth.uid() OR public.is_admin()) WITH CHECK (customer_id = auth.uid() OR public.is_admin());
DROP POLICY IF EXISTS "Customers can delete own addresses" ON public.addresses;
CREATE POLICY "Customers can delete own addresses" ON public.addresses FOR DELETE TO authenticated USING (customer_id = auth.uid() OR public.is_admin());

-- Categories
DROP POLICY IF EXISTS "Anyone can view active categories" ON public.categories;
CREATE POLICY "Anyone can view active categories" ON public.categories FOR SELECT TO anon, authenticated USING (is_active = true OR public.is_admin());
DROP POLICY IF EXISTS "Admins manage categories" ON public.categories;
CREATE POLICY "Admins manage categories" ON public.categories FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Products
DROP POLICY IF EXISTS "Anyone can view active products" ON public.products;
CREATE POLICY "Anyone can view active products" ON public.products FOR SELECT TO anon, authenticated USING (is_available = true OR public.is_admin());
DROP POLICY IF EXISTS "Admins manage products" ON public.products;
CREATE POLICY "Admins manage products" ON public.products FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Product Options
DROP POLICY IF EXISTS "Anyone can view product options" ON public.product_options;
CREATE POLICY "Anyone can view product options" ON public.product_options FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "Admins manage product options" ON public.product_options;
CREATE POLICY "Admins manage product options" ON public.product_options FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "Anyone can view product option values" ON public.product_option_values;
CREATE POLICY "Anyone can view product option values" ON public.product_option_values FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "Admins manage product option values" ON public.product_option_values;
CREATE POLICY "Admins manage product option values" ON public.product_option_values FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Orders
DROP POLICY IF EXISTS "Users can view permitted orders" ON public.orders;
CREATE POLICY "Users can view permitted orders" ON public.orders FOR SELECT TO authenticated USING (
    customer_id = auth.uid() OR public.is_admin() OR (public.is_rider() AND id IN (SELECT order_id FROM public.dispatch_assignments WHERE rider_id = auth.uid()))
);
DROP POLICY IF EXISTS "Customers can create own orders" ON public.orders;
CREATE POLICY "Customers can create own orders" ON public.orders FOR INSERT TO authenticated WITH CHECK (customer_id = auth.uid());
DROP POLICY IF EXISTS "Admins can update orders" ON public.orders;
CREATE POLICY "Admins can update orders" ON public.orders FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Order Items
DROP POLICY IF EXISTS "Users can view permitted order items" ON public.order_items;
CREATE POLICY "Users can view permitted order items" ON public.order_items FOR SELECT TO authenticated USING (
    order_id IN (SELECT id FROM public.orders WHERE customer_id = auth.uid()) OR public.is_admin() OR (public.is_rider() AND order_id IN (SELECT order_id FROM public.dispatch_assignments WHERE rider_id = auth.uid()))
);
DROP POLICY IF EXISTS "Customers can insert own order items" ON public.order_items;
CREATE POLICY "Customers can insert own order items" ON public.order_items FOR INSERT TO authenticated WITH CHECK (
    order_id IN (SELECT id FROM public.orders WHERE customer_id = auth.uid()) OR public.is_admin()
);

-- Dispatch Assignments
DROP POLICY IF EXISTS "Users can view permitted assignments" ON public.dispatch_assignments;
CREATE POLICY "Users can view permitted assignments" ON public.dispatch_assignments FOR SELECT TO authenticated USING (
    rider_id = auth.uid() OR public.is_admin() OR order_id IN (SELECT id FROM public.orders WHERE customer_id = auth.uid())
);
DROP POLICY IF EXISTS "Admins can assign riders" ON public.dispatch_assignments;
CREATE POLICY "Admins can assign riders" ON public.dispatch_assignments FOR INSERT TO authenticated WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "Riders can update their assignments" ON public.dispatch_assignments;
CREATE POLICY "Riders can update their assignments" ON public.dispatch_assignments FOR UPDATE TO authenticated USING (rider_id = auth.uid() OR public.is_admin()) WITH CHECK (rider_id = auth.uid() OR public.is_admin());

-- Audit History
DROP POLICY IF EXISTS "Users can view status history of permitted orders" ON public.order_status_history;
CREATE POLICY "Users can view status history of permitted orders" ON public.order_status_history FOR SELECT TO authenticated USING (
    order_id IN (SELECT id FROM public.orders WHERE customer_id = auth.uid()) OR public.is_admin() OR (public.is_rider() AND order_id IN (SELECT order_id FROM public.dispatch_assignments WHERE rider_id = auth.uid()))
);

-- ─── 10. ATOMIC ORDER RPC ────────────────────────────────────────────────────
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
    v_delivery_fee_kobo BIGINT := 120000;
    v_packaging_fee_kobo BIGINT := 60000;
    v_discount_kobo BIGINT := 0;
    v_total_kobo BIGINT := 0;
    v_primary_restaurant TEXT := 'Calabar Kitchen';
    v_items_count INTEGER;
    v_option_delta_kobo BIGINT;
    v_portion_id TEXT;
    v_result JSONB;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required to place an order.';
    END IF;

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

    LOOP
        v_order_number := 'CHOW-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::text, 5, '0');
        EXIT WHEN NOT EXISTS (SELECT 1 FROM public.orders WHERE order_number = v_order_number);
    END LOOP;

    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        v_product_id := v_item->>'product_id';
        v_quantity := COALESCE((v_item->>'quantity')::integer, 1);

        IF v_quantity <= 0 THEN
            RAISE EXCEPTION 'Item quantity must be greater than zero for product %.', v_product_id;
        END IF;

        SELECT * INTO v_product FROM public.products WHERE id = v_product_id;
        IF NOT FOUND THEN
            RAISE EXCEPTION 'Product % does not exist.', v_product_id;
        END IF;

        IF NOT v_product.is_available THEN
            RAISE EXCEPTION 'Product "%" is currently out of stock.', v_product.name;
        END IF;

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
        v_calculated_subtotal_kobo := v_calculated_subtotal_kobo + v_line_total_kobo;
        v_primary_restaurant := v_product.restaurant_name;
    END LOOP;

    v_total_kobo := v_calculated_subtotal_kobo + v_delivery_fee_kobo + v_packaging_fee_kobo - v_discount_kobo;

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
        'confirmed',
        'pending',
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

-- ─── 11. STORAGE BUCKETS ─────────────────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
    ('food-images', 'food-images', true, 5242880, ARRAY['image/png', 'image/jpeg', 'image/webp']),
    ('category-images', 'category-images', true, 2097152, ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']),
    ('avatars', 'avatars', true, 2097152, ARRAY['image/png', 'image/jpeg', 'image/webp'])
ON CONFLICT (id) DO UPDATE SET
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Public can view food images" ON storage.objects;
CREATE POLICY "Public can view food images" ON storage.objects FOR SELECT TO anon, authenticated USING (bucket_id IN ('food-images', 'category-images', 'avatars'));
DROP POLICY IF EXISTS "Admins can upload food images" ON storage.objects;
CREATE POLICY "Admins can upload food images" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id IN ('food-images', 'category-images') AND public.is_admin());
DROP POLICY IF EXISTS "Admins can modify food images" ON storage.objects;
CREATE POLICY "Admins can modify food images" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id IN ('food-images', 'category-images') AND public.is_admin());
DROP POLICY IF EXISTS "Admins can delete food images" ON storage.objects;
CREATE POLICY "Admins can delete food images" ON storage.objects FOR DELETE TO authenticated USING (bucket_id IN ('food-images', 'category-images') AND public.is_admin());
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
CREATE POLICY "Users can upload their own avatar" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
CREATE POLICY "Users can update their own avatar" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;
CREATE POLICY "Users can delete their own avatar" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

-- ─── 12. REALTIME CONFIGURATION ───────────────────────────────────────────────
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'orders') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'dispatch_assignments') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.dispatch_assignments;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'order_status_history') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.order_status_history;
    END IF;
END $$;

-- ─── 13. SEED DATA ────────────────────────────────────────────────────────────
INSERT INTO public.categories (id, name, slug, description, icon, sort_order, is_active)
VALUES
    ('soups', 'Soups & Swallows', 'soups', 'Rich traditional Calabar & Niger Delta soups simmered with fresh herbs, palm oil, and seafood.', '🍲', 1, true),
    ('rice', 'Rice Dishes', 'rice', 'Smoky firewood party jollof, fried rice, and native concoction rice.', '🍚', 2, true),
    ('grills', 'Charcoal Grills & Bole', 'grills', 'Street-side Port Harcourt & Calabar roasted plantain with grilled mackerel, chicken, and catfish.', '🔥', 3, true),
    ('snacks', 'Finger Foods & Snacks', 'snacks', 'Crispy fried yam, street shawarma, meat pies, and puff puff.', '🥙', 4, true),
    ('drinks', 'Chilled Drinks', 'drinks', 'Authentic gourmet zobo, Chapman, fresh palm wine, and citrus juices.', '🥤', 5, true),
    ('specials', 'Chef Specials & Delicacies', 'specials', 'Premium peppered snails (nkono), asaro yam porridge, and ewa aganyin.', '⭐', 6, true)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name, description = EXCLUDED.description, icon = EXCLUDED.icon, sort_order = EXCLUDED.sort_order, is_active = EXCLUDED.is_active;

INSERT INTO public.products (
    id, category_id, name, short_name, slug, description, price_kobo,
    rating, review_count, calories, preparation_time_minutes, prep_time_text,
    badge, restaurant_name, distance_text, is_available, is_featured
)
VALUES
    ('bole_fish', 'grills', 'Calabar Bole & Grilled Mackerel', 'Calabar Bole & Fish', 'calabar-bole-and-grilled-mackerel', 'Port Harcourt-style roasted plantain (bole) — ripe and unripe — served alongside whole charcoal-grilled spiced mackerel, with fresh sliced cucumber, tomato, and a generous drizzle of peppered palm oil sauce.', 520000, 4.85, '1.2k+', 780, 30, '25-35 min', 'Chef''s Special', 'Calabar Kitchen', '1.2 Km', true, true),
    ('jollof_rice', 'rice', 'Smoky Party Jollof & Fried Plantain', 'Smoky Jollof & Dodo Platter', 'smoky-party-jollof-and-fried-plantain', 'Vibrant smoky reddish-orange long-grain rice slow-cooked over firewood with tomatoes, peppers, and secret spices. Served with golden fried ripe plantain (dodo) and your choice of grilled chicken or beef.', 380000, 4.92, '2k+', 920, 25, '20-30 min', 'Chef''s Special', 'Rivers Aroma', '2.5 Km', true, true),
    ('afang_soup', 'soups', 'Afang Soup & Swallow', 'Afang Soup & Swallow', 'afang-soup-and-swallow', 'Traditional Cross River delicacy slow-cooked with fresh shredded afang and waterleaves, rich palm oil, smoked dried fish, periwinkles, kpomo, and tender assorted beef. Served piping hot with your choice of swallow.', 650000, 4.90, '1.4k+', 620, 25, '20-30 min', 'Popular', 'Calabar Kitchen', '1.2 Km', true, true),
    ('edikang_ikong', 'soups', 'Edikang Ikong Soup & Swallow', 'Edikang Ikong', 'edikang-ikong-soup-and-swallow', 'Lush, glossy shredded fluted pumpkin leaves (ugwu) and waterleaf cooked with assorted meats, stockfish, smoked fish, periwinkles, and rich palm oil. A true Calabar classic.', 700000, 4.84, '980+', 590, 30, '20-35 min', 'Signature', 'Calabar Kitchen', '1.2 Km', true, false),
    ('fisherman_soup', 'soups', 'Delta Fisherman''s Soup', 'Fisherman''s Soup', 'delta-fishermans-soup', 'Rich, spicy light palm oil seafood broth loaded with fresh fish, shrimps, crabs, clams, and aromatic herbs. A pride of the Niger Delta waterside.', 750000, 4.95, '1.1k+', 540, 35, '30-40 min', 'Chef''s Special', 'Rivers Aroma', '2.5 Km', true, false),
    ('banga_soup', 'soups', 'Banga Soup & Starch', 'Banga Soup & Starch', 'banga-soup-and-starch', 'Urhobo palm nut soup simmered with fresh palm fruit extract, oburunbebe stick, dried catfish, and aromatic Delta spices. Best enjoyed with traditional starch.', 680000, 4.76, '760+', 680, 30, '25-40 min', NULL, 'Delta Flavours', '3.0 Km', true, false),
    ('egusi_soup', 'soups', 'Egusi Soup & Swallow', 'Egusi Soup', 'egusi-soup-and-swallow', 'Melon seed soup cooked with bitterleaf or spinach, assorted beef and offal, stockfish, smoked fish, and palm oil. Deeply satisfying Nigerian comfort food.', 550000, 4.72, '1.5k+', 720, 25, '20-30 min', NULL, 'Naija Kitchen', '1.8 Km', true, false),
    ('pepper_soup', 'soups', 'Niger Delta Seafood Pepper Soup', 'Seafood Pepper Soup', 'niger-delta-seafood-pepper-soup', 'Aromatic clear herbal broth bursting with fresh shrimp, fish fillets, and clams, infused with calabash nutmeg, uda, and traditional Delta spices.', 500000, 4.80, '890+', 320, 20, '15-20 min', NULL, 'Rivers Aroma', '2.5 Km', true, false),
    ('grilled_catfish', 'grills', 'Point & Kill Grilled Catfish', 'Grilled Catfish', 'point-and-kill-grilled-catfish', 'Fresh whole catfish grilled over hot coals, basted with spicy pepper marinade and palm oil. A waterside Nigerian classic served with sliced onions and tomatoes.', 850000, 4.91, '640+', 480, 35, '30-40 min', 'Popular', 'Waterside Grill', '4.1 Km', true, false),
    ('peppered_snails', 'specials', 'Peppered Snails (Nkono)', 'Peppered Snails', 'peppered-snails-nkono', 'Giant African land snails braised and tossed in a bold peppered tomato sauce with onions, scotch bonnet, and fragrant spices. A premium Nigerian delicacy.', 450000, 4.82, '520+', 280, 20, '20-25 min', 'Delicacy', 'Naija Kitchen', '1.8 Km', true, false),
    ('concoction_rice', 'rice', 'Iwuk Edesi (Concoction Rice)', 'Concoction Rice', 'iwuk-edesi-concoction-rice', 'Niger Delta-style native rice cooked in pure palm oil with dried fish, crayfish, and fresh peppers. A deeply aromatic one-pot meal bursting with bold flavours.', 350000, 4.64, '430+', 860, 30, '25-35 min', NULL, 'Delta Flavours', '3.0 Km', true, false),
    ('yam_porridge', 'specials', 'Asaro (Yam Porridge)', 'Yam Porridge', 'asaro-yam-porridge', 'Tender yam pottage simmered in seasoned palm oil broth with tomatoes, peppers, smoked fish, and leafy greens. Comforting Nigerian home cooking.', 320000, 4.58, '380+', 540, 25, '20-30 min', NULL, 'Naija Kitchen', '1.8 Km', true, false),
    ('fried_yam', 'snacks', 'Fried Yam (Dundu) & Pepper Sauce', 'Fried Yam & Pepper Sauce', 'fried-yam-dundu-and-pepper-sauce', 'Thick golden-crusted fried yam wedges served with spicy blended pepper dipping sauce. Classic Nigerian street food done right.', 250000, 4.45, '920+', 620, 15, '15-20 min', NULL, 'Naija Kitchen', '1.8 Km', true, false),
    ('stewed_beans', 'specials', 'Ewa Aganyin (Stewed Beans & Plantain)', 'Ewa Aganyin & Plantain', 'ewa-aganyin-stewed-beans-and-plantain', 'Honey beans slow-cooked until tender, served with authentic Aganyin pepper sauce and golden fried ripe plantain. Lagos street food royalty.', 280000, 4.55, '1.1k+', 680, 20, '15-25 min', NULL, 'Naija Kitchen', '1.8 Km', true, false),
    ('fried_chicken', 'grills', 'Crispy Seasoned Fried Chicken', 'Crispy Fried Chicken', 'crispy-seasoned-fried-chicken', 'Golden, perfectly seasoned Nigerian-style fried chicken with a thick, crunchy crust. Served with your choice of coleslaw, spiced rice, or jollof.', 320000, 4.67, '1.8k+', 820, 25, '20-30 min', NULL, 'Crispy Corner', '2.1 Km', true, false),
    ('shawarma', 'snacks', 'Nigerian Street Shawarma', 'Chicken Shawarma', 'nigerian-street-shawarma', 'Warm toasted pita flatbread wrap filled with seasoned grilled chicken strips, fresh vegetables, coleslaw, and creamy garlic sauce. Street-style perfection.', 220000, 4.40, '2.3k+', 520, 12, '10-15 min', 'Best Seller', 'Crispy Corner', '2.1 Km', true, false),
    ('zobo_drink', 'drinks', 'Gourmet Zobo & Chapman', 'Zobo Chapman Drink', 'gourmet-zobo-and-chapman', 'Refreshing hibiscus drink blended with fresh fruits, Chapman fizz, pineapple juice, and a hint of ginger. Served ice-cold with mint garnish.', 150000, 4.78, '670+', 120, 8, '5-10 min', 'Refreshing', 'Sip & Chill', '1.5 Km', true, false)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name, short_name = EXCLUDED.short_name, category_id = EXCLUDED.category_id, description = EXCLUDED.description, price_kobo = EXCLUDED.price_kobo;

-- Options seed
DO $$
DECLARE
    v_opt_swallow UUID;
    v_opt_portion UUID;
BEGIN
    INSERT INTO public.product_options (product_id, name, type, is_required, sort_order)
    VALUES ('afang_soup', 'Swallow Choice', 'single', true, 1) RETURNING id INTO v_opt_swallow;

    INSERT INTO public.product_option_values (option_id, label, price_delta_kobo, sort_order)
    VALUES
        (v_opt_swallow, 'Pounded Yam', 0, 1),
        (v_opt_swallow, 'Garri / Eba', 0, 2),
        (v_opt_swallow, 'Fufu / Akpu', 0, 3),
        (v_opt_swallow, 'Semovita', 0, 4);

    INSERT INTO public.product_options (product_id, name, type, is_required, sort_order)
    VALUES ('afang_soup', 'Portion Size', 'single', false, 2) RETURNING id INTO v_opt_portion;

    INSERT INTO public.product_option_values (option_id, label, price_delta_kobo, sort_order)
    VALUES
        (v_opt_portion, 'Standard Bowl', 0, 1),
        (v_opt_portion, 'Jumbo Assorted (Large)', 200000, 2);
EXCEPTION WHEN OTHERS THEN null;
END $$;
