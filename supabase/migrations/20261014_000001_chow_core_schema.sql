-- ============================================================================
-- CHOW FOOD DELIVERY — COMPLETE DATABASE SCHEMA MIGRATION (01 Core Schema)
-- Target: PostgreSQL / Supabase
-- Description: Core tables, enums, relationships, constraints, indexes & triggers
-- ============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── 1. ENUMS ────────────────────────────────────────────────────────────────
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('customer', 'admin', 'dispatch_rider');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

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
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE payment_status AS ENUM (
        'pending',
        'paid',
        'failed',
        'refunded'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE assignment_status AS ENUM (
        'assigned',
        'accepted',
        'picked_up',
        'completed',
        'cancelled'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ─── 2. PROFILES TABLE ───────────────────────────────────────────────────────
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

-- ─── 3. ADDRESSES TABLE ──────────────────────────────────────────────────────
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

-- ─── 4. CATEGORIES TABLE ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.categories (
    id TEXT PRIMARY KEY, -- Slug format: 'soups', 'rice', 'grills', 'snacks', 'drinks', 'specials'
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

-- ─── 5. PRODUCTS TABLE ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.products (
    id TEXT PRIMARY KEY, -- Slug identifier: 'afang_soup', 'bole_fish', etc.
    category_id TEXT NOT NULL REFERENCES public.categories(id) ON DELETE RESTRICT,
    name TEXT NOT NULL,
    short_name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT NOT NULL,
    image_url TEXT,
    price_kobo BIGINT NOT NULL CHECK (price_kobo >= 0), -- Nigerian Naira in Kobo (1 NGN = 100 kobo)
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

-- ─── 6. PRODUCT OPTIONS & VALUES (Swallow, Portions, Add-ons) ─────────────────
CREATE TABLE IF NOT EXISTS public.product_options (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id TEXT NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    name TEXT NOT NULL, -- e.g. "Swallow Selection", "Portion Size"
    type TEXT NOT NULL DEFAULT 'single', -- 'single' or 'multiple'
    is_required BOOLEAN NOT NULL DEFAULT false,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.product_option_values (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    option_id UUID NOT NULL REFERENCES public.product_options(id) ON DELETE CASCADE,
    label TEXT NOT NULL, -- e.g. "Pounded Yam", "Jumbo Assorted"
    price_delta_kobo BIGINT NOT NULL DEFAULT 0 CHECK (price_delta_kobo >= 0),
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── 7. ORDERS TABLE ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number TEXT UNIQUE NOT NULL, -- Safe human-readable ID e.g. 'CHOW-8921'
    customer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    address_id UUID REFERENCES public.addresses(id) ON DELETE SET NULL,
    delivery_address_snapshot TEXT NOT NULL,
    recipient_phone TEXT NOT NULL,
    customer_notes TEXT,
    status order_status NOT NULL DEFAULT 'pending',
    payment_status payment_status NOT NULL DEFAULT 'pending',
    payment_method TEXT NOT NULL DEFAULT 'card', -- 'card', 'transfer', 'cash'
    stripe_payment_intent_id TEXT, -- Prepared for future Stripe phase
    stripe_client_secret TEXT,     -- Prepared for future Stripe phase
    currency TEXT NOT NULL DEFAULT 'NGN',
    subtotal_kobo BIGINT NOT NULL CHECK (subtotal_kobo >= 0),
    delivery_fee_kobo BIGINT NOT NULL DEFAULT 120000 CHECK (delivery_fee_kobo >= 0), -- ₦1,200
    packaging_fee_kobo BIGINT NOT NULL DEFAULT 60000 CHECK (packaging_fee_kobo >= 0), -- ₦600
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

-- ─── 8. ORDER ITEMS TABLE ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id TEXT REFERENCES public.products(id) ON DELETE SET NULL,
    product_name TEXT NOT NULL, -- Snapshot of product title
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price_kobo BIGINT NOT NULL CHECK (unit_price_kobo >= 0), -- Snapshot of price at order time
    selected_options JSONB NOT NULL DEFAULT '{}'::jsonb, -- Snapshot of selected swallow/portion
    line_total_kobo BIGINT NOT NULL CHECK (line_total_kobo >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── 9. DISPATCH ASSIGNMENTS TABLE ───────────────────────────────────────────
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

-- ─── 10. ORDER STATUS HISTORY (AUDIT LOG) ────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.order_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    changed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    previous_status order_status,
    new_status order_status NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── 11. INDEXES ─────────────────────────────────────────────────────────────
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

-- ─── 12. TRIGGERS: UPDATED_AT TIMESTAMP ──────────────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_profiles_updated_at ON public.profiles;
CREATE TRIGGER set_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_addresses_updated_at ON public.addresses;
CREATE TRIGGER set_addresses_updated_at
BEFORE UPDATE ON public.addresses
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_categories_updated_at ON public.categories;
CREATE TRIGGER set_categories_updated_at
BEFORE UPDATE ON public.categories
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_products_updated_at ON public.products;
CREATE TRIGGER set_products_updated_at
BEFORE UPDATE ON public.products
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_orders_updated_at ON public.orders;
CREATE TRIGGER set_orders_updated_at
BEFORE UPDATE ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_dispatch_assignments_updated_at ON public.dispatch_assignments;
CREATE TRIGGER set_dispatch_assignments_updated_at
BEFORE UPDATE ON public.dispatch_assignments
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ─── 13. TRIGGER: ENFORCE SINGLE DEFAULT ADDRESS ─────────────────────────────
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
CREATE TRIGGER enforce_single_default_address
BEFORE INSERT OR UPDATE OF is_default ON public.addresses
FOR EACH ROW EXECUTE FUNCTION public.handle_default_address();

-- ─── 14. TRIGGER: AUTO-CREATE PROFILE ON AUTH REGISTRATION ───────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (
        id,
        full_name,
        email,
        phone_number,
        role,
        is_active
    )
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', 'Valued Customer'),
        NEW.email,
        NEW.raw_user_meta_data->>'phone_number',
        'customer', -- Default security: NEVER let client metadata set admin/rider role
        true
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = CASE WHEN profiles.full_name = 'Valued Customer' THEN EXCLUDED.full_name ELSE profiles.full_name END;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ─── 15. TRIGGER: PREVENT CLIENT ROLE ESCALATION ─────────────────────────────
CREATE OR REPLACE FUNCTION public.prevent_profile_role_escalation()
RETURNS TRIGGER AS $$
DECLARE
    current_user_role user_role;
BEGIN
    -- Only allow role modification if executor is an admin
    IF NEW.role <> OLD.role THEN
        SELECT role INTO current_user_role
        FROM public.profiles
        WHERE id = auth.uid();

        IF current_user_role IS NULL OR current_user_role <> 'admin' THEN
            RAISE EXCEPTION 'Unauthorized: Only administrators can modify user roles.';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS enforce_role_protection ON public.profiles;
CREATE TRIGGER enforce_role_protection
BEFORE UPDATE OF role ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.prevent_profile_role_escalation();

-- ─── 16. TRIGGER: AUTOMATIC ORDER STATUS AUDIT LOG ───────────────────────────
CREATE OR REPLACE FUNCTION public.log_order_status_change()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        INSERT INTO public.order_status_history (
            order_id,
            changed_by,
            previous_status,
            new_status,
            notes
        )
        VALUES (
            NEW.id,
            auth.uid(),
            OLD.status,
            NEW.status,
            COALESCE(NEW.cancellation_reason, 'Status updated to ' || NEW.status::text)
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_order_status_history ON public.orders;
CREATE TRIGGER trg_order_status_history
AFTER UPDATE OF status ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.log_order_status_change();
