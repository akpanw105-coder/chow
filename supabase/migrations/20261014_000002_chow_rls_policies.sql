-- ============================================================================
-- CHOW FOOD DELIVERY — COMPLETE DATABASE SCHEMA MIGRATION (02 RLS Policies)
-- Target: PostgreSQL / Supabase
-- Description: Row Level Security (RLS) policies for Customers, Admins, Riders
-- ============================================================================

-- ─── 1. SECURITY HELPER FUNCTIONS ────────────────────────────────────────────
-- Helper to get current authenticated user role with SECURITY DEFINER
-- This avoids recursive RLS evaluation policies on profiles
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

-- ─── 2. ENABLE ROW LEVEL SECURITY ───────────────────────────────────────────
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

-- ─── 3. PROFILES POLICIES ────────────────────────────────────────────────────
-- Any authenticated user can read public profile data (for rider/customer display)
DROP POLICY IF EXISTS "Profiles are readable by authenticated users" ON public.profiles;
CREATE POLICY "Profiles are readable by authenticated users"
ON public.profiles FOR SELECT
TO authenticated
USING (true);

-- Users can update only their own profile
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- Admins can update any profile
DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;
CREATE POLICY "Admins can update any profile"
ON public.profiles FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- ─── 4. ADDRESSES POLICIES ───────────────────────────────────────────────────
-- Customers can view only their own addresses
DROP POLICY IF EXISTS "Customers can read own addresses" ON public.addresses;
CREATE POLICY "Customers can read own addresses"
ON public.addresses FOR SELECT
TO authenticated
USING (customer_id = auth.uid() OR public.is_admin());

-- Customers can insert their own addresses
DROP POLICY IF EXISTS "Customers can insert own addresses" ON public.addresses;
CREATE POLICY "Customers can insert own addresses"
ON public.addresses FOR INSERT
TO authenticated
WITH CHECK (customer_id = auth.uid());

-- Customers can update their own addresses
DROP POLICY IF EXISTS "Customers can update own addresses" ON public.addresses;
CREATE POLICY "Customers can update own addresses"
ON public.addresses FOR UPDATE
TO authenticated
USING (customer_id = auth.uid() OR public.is_admin())
WITH CHECK (customer_id = auth.uid() OR public.is_admin());

-- Customers can delete their own addresses
DROP POLICY IF EXISTS "Customers can delete own addresses" ON public.addresses;
CREATE POLICY "Customers can delete own addresses"
ON public.addresses FOR DELETE
TO authenticated
USING (customer_id = auth.uid() OR public.is_admin());

-- ─── 5. CATEGORIES POLICIES ──────────────────────────────────────────────────
-- Public menu reading: anyone (anon or authenticated) can view active categories
DROP POLICY IF EXISTS "Anyone can view active categories" ON public.categories;
CREATE POLICY "Anyone can view active categories"
ON public.categories FOR SELECT
TO anon, authenticated
USING (is_active = true OR public.is_admin());

-- Admins can manage categories
DROP POLICY IF EXISTS "Admins manage categories" ON public.categories;
CREATE POLICY "Admins manage categories"
ON public.categories FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- ─── 6. PRODUCTS POLICIES ────────────────────────────────────────────────────
-- Public menu reading: anyone (anon or authenticated) can view available products
DROP POLICY IF EXISTS "Anyone can view active products" ON public.products;
CREATE POLICY "Anyone can view active products"
ON public.products FOR SELECT
TO anon, authenticated
USING (is_available = true OR public.is_admin());

-- Admins can manage products
DROP POLICY IF EXISTS "Admins manage products" ON public.products;
CREATE POLICY "Admins manage products"
ON public.products FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- ─── 7. PRODUCT OPTIONS & VALUES POLICIES ────────────────────────────────────
DROP POLICY IF EXISTS "Anyone can view product options" ON public.product_options;
CREATE POLICY "Anyone can view product options"
ON public.product_options FOR SELECT
TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "Admins manage product options" ON public.product_options;
CREATE POLICY "Admins manage product options"
ON public.product_options FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Anyone can view product option values" ON public.product_option_values;
CREATE POLICY "Anyone can view product option values"
ON public.product_option_values FOR SELECT
TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "Admins manage product option values" ON public.product_option_values;
CREATE POLICY "Admins manage product option values"
ON public.product_option_values FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- ─── 8. ORDERS POLICIES ──────────────────────────────────────────────────────
-- Customers view their own orders
-- Riders view orders assigned to them
-- Admins view all orders
DROP POLICY IF EXISTS "Users can view permitted orders" ON public.orders;
CREATE POLICY "Users can view permitted orders"
ON public.orders FOR SELECT
TO authenticated
USING (
    customer_id = auth.uid()
    OR public.is_admin()
    OR (
        public.is_rider()
        AND id IN (
            SELECT order_id FROM public.dispatch_assignments
            WHERE rider_id = auth.uid()
        )
    )
);

-- Customers can create orders (typically performed via secure RPC function)
DROP POLICY IF EXISTS "Customers can create own orders" ON public.orders;
CREATE POLICY "Customers can create own orders"
ON public.orders FOR INSERT
TO authenticated
WITH CHECK (customer_id = auth.uid());

-- Admins can update any order; Riders cannot update orders directly (they update via assignments or RPC)
DROP POLICY IF EXISTS "Admins can update orders" ON public.orders;
CREATE POLICY "Admins can update orders"
ON public.orders FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- ─── 9. ORDER ITEMS POLICIES ─────────────────────────────────────────────────
DROP POLICY IF EXISTS "Users can view permitted order items" ON public.order_items;
CREATE POLICY "Users can view permitted order items"
ON public.order_items FOR SELECT
TO authenticated
USING (
    order_id IN (
        SELECT id FROM public.orders
        WHERE customer_id = auth.uid()
    )
    OR public.is_admin()
    OR (
        public.is_rider()
        AND order_id IN (
            SELECT order_id FROM public.dispatch_assignments
            WHERE rider_id = auth.uid()
        )
    )
);

-- Order items can be inserted by the customer owning the order
DROP POLICY IF EXISTS "Customers can insert own order items" ON public.order_items;
CREATE POLICY "Customers can insert own order items"
ON public.order_items FOR INSERT
TO authenticated
WITH CHECK (
    order_id IN (
        SELECT id FROM public.orders
        WHERE customer_id = auth.uid()
    )
    OR public.is_admin()
);

-- ─── 10. DISPATCH ASSIGNMENTS POLICIES ───────────────────────────────────────
-- Riders can read their own assignments
-- Customers can read assignments for their active orders (to see rider details)
-- Admins can read all assignments
DROP POLICY IF EXISTS "Users can view permitted assignments" ON public.dispatch_assignments;
CREATE POLICY "Users can view permitted assignments"
ON public.dispatch_assignments FOR SELECT
TO authenticated
USING (
    rider_id = auth.uid()
    OR public.is_admin()
    OR order_id IN (
        SELECT id FROM public.orders
        WHERE customer_id = auth.uid()
    )
);

-- Admins can insert assignments
DROP POLICY IF EXISTS "Admins can assign riders" ON public.dispatch_assignments;
CREATE POLICY "Admins can assign riders"
ON public.dispatch_assignments FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());

-- Riders can update specific status fields on their own assignments
DROP POLICY IF EXISTS "Riders can update their assignments" ON public.dispatch_assignments;
CREATE POLICY "Riders can update their assignments"
ON public.dispatch_assignments FOR UPDATE
TO authenticated
USING (rider_id = auth.uid() OR public.is_admin())
WITH CHECK (rider_id = auth.uid() OR public.is_admin());

-- ─── 11. ORDER STATUS HISTORY POLICIES ───────────────────────────────────────
DROP POLICY IF EXISTS "Users can view status history of permitted orders" ON public.order_status_history;
CREATE POLICY "Users can view status history of permitted orders"
ON public.order_status_history FOR SELECT
TO authenticated
USING (
    order_id IN (
        SELECT id FROM public.orders
        WHERE customer_id = auth.uid()
    )
    OR public.is_admin()
    OR (
        public.is_rider()
        AND order_id IN (
            SELECT order_id FROM public.dispatch_assignments
            WHERE rider_id = auth.uid()
        )
    )
);
