-- ============================================================================
-- CHOW FOOD DELIVERY — COMPLETE DATABASE SCHEMA MIGRATION (04 Storage & Realtime)
-- Target: PostgreSQL / Supabase
-- Description: Storage buckets, storage policies, and Supabase Realtime setup
-- ============================================================================

-- ─── 1. STORAGE BUCKETS CREATION ─────────────────────────────────────────────
-- Insert storage buckets if not already existing
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
    ('food-images', 'food-images', true, 5242880, ARRAY['image/png', 'image/jpeg', 'image/webp']),
    ('category-images', 'category-images', true, 2097152, ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']),
    ('avatars', 'avatars', true, 2097152, ARRAY['image/png', 'image/jpeg', 'image/webp'])
ON CONFLICT (id) DO UPDATE SET
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ─── 2. STORAGE OBJECTS RLS POLICIES ─────────────────────────────────────────

-- Public read access to food and category images
DROP POLICY IF EXISTS "Public can view food images" ON storage.objects;
CREATE POLICY "Public can view food images"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id IN ('food-images', 'category-images', 'avatars'));

-- Admins can upload food images
DROP POLICY IF EXISTS "Admins can upload food images" ON storage.objects;
CREATE POLICY "Admins can upload food images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id IN ('food-images', 'category-images')
    AND public.is_admin()
);

-- Admins can update/delete food images
DROP POLICY IF EXISTS "Admins can modify food images" ON storage.objects;
CREATE POLICY "Admins can modify food images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
    bucket_id IN ('food-images', 'category-images')
    AND public.is_admin()
);

DROP POLICY IF EXISTS "Admins can delete food images" ON storage.objects;
CREATE POLICY "Admins can delete food images"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id IN ('food-images', 'category-images')
    AND public.is_admin()
);

-- Users can upload/update their own avatars
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;
CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- ─── 3. SUPABASE REALTIME CONFIGURATION ───────────────────────────────────────
-- Add orders, assignments, and audit history to realtime publication
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime' AND tablename = 'orders'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime' AND tablename = 'dispatch_assignments'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.dispatch_assignments;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime' AND tablename = 'order_status_history'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.order_status_history;
    END IF;
END $$;
