-- ============================================================================
-- Contestant full profiles + gallery + flyer templates
-- Safe, additive migration — run once in the Supabase SQL editor. Does not
-- drop or modify any existing data.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Extend contestants with the full profile field set
-- ----------------------------------------------------------------------------
ALTER TABLE public.contestants
  ADD COLUMN IF NOT EXISTS contestant_number text,
  ADD COLUMN IF NOT EXISTS stage_name text,
  ADD COLUMN IF NOT EXISTS class text,
  ADD COLUMN IF NOT EXISTS religion text,
  ADD COLUMN IF NOT EXISTS nationality text,
  ADD COLUMN IF NOT EXISTS state_of_origin text,
  ADD COLUMN IF NOT EXISTS favourite_subject text,
  ADD COLUMN IF NOT EXISTS role_model text,
  ADD COLUMN IF NOT EXISTS dream_career text,
  ADD COLUMN IF NOT EXISTS favourite_food text,
  ADD COLUMN IF NOT EXISTS favourite_drink text,
  ADD COLUMN IF NOT EXISTS favourite_music_genre text,
  ADD COLUMN IF NOT EXISTS favourite_movie_tv_show text,
  ADD COLUMN IF NOT EXISTS favourite_book text,
  ADD COLUMN IF NOT EXISTS fun_facts text,
  ADD COLUMN IF NOT EXISTS gallery_images text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS registration_status text DEFAULT 'approved' CHECK (registration_status IN ('pending', 'approved', 'rejected'));

-- contestant_number should be unique when set (two contestants can't share
-- a number), but many rows may have it NULL (legacy contestants), so this
-- is a partial unique index rather than a plain UNIQUE constraint.
CREATE UNIQUE INDEX IF NOT EXISTS contestants_number_key
  ON public.contestants (contestant_number)
  WHERE contestant_number IS NOT NULL;

-- Existing rows (created via the admin dashboard, before this migration)
-- are trusted by default — only new public self-registrations start out
-- pending.
UPDATE public.contestants SET registration_status = 'approved' WHERE registration_status IS NULL;


-- ----------------------------------------------------------------------------
-- 2. RLS: only approved contestants are publicly readable
-- ----------------------------------------------------------------------------
-- The existing "contestants_public_read" policy (from earlier migrations)
-- allowed reading every row. Replace it so pending/rejected
-- self-registrations aren't visible to voters until an admin approves
-- them — admins still see everything via "contestants_admin_all".
DROP POLICY IF EXISTS "contestants_public_read" ON public.contestants;
CREATE POLICY "contestants_public_read" ON public.contestants
  FOR SELECT USING (registration_status = 'approved');


-- ----------------------------------------------------------------------------
-- 3. Flyer templates
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.flyer_templates (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  background_image_url text NOT NULL,
  canvas_width integer NOT NULL,
  canvas_height integer NOT NULL,
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_active boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.flyer_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "flyer_templates_public_read" ON public.flyer_templates;
CREATE POLICY "flyer_templates_public_read" ON public.flyer_templates FOR SELECT USING (true);

DROP POLICY IF EXISTS "flyer_templates_admin_all" ON public.flyer_templates;
CREATE POLICY "flyer_templates_admin_all" ON public.flyer_templates
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());


-- ----------------------------------------------------------------------------
-- 4. Storage bucket for contestant photos + flyer template backgrounds
-- ----------------------------------------------------------------------------
-- Public read (photos need to display on the site), but NO public write
-- policy is created here on purpose — all uploads go through server API
-- routes using the service-role key (/api/contestants/register for
-- contestant photos, /api/admin/upload-image for flyer template
-- backgrounds), which bypasses storage RLS entirely. This means a
-- malicious visitor can't upload directly to the bucket even if they
-- found its name.
INSERT INTO storage.buckets (id, name, public)
VALUES ('ivote-media', 'ivote-media', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "ivote_media_public_read" ON storage.objects;
CREATE POLICY "ivote_media_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'ivote-media');
