-- ============================================================================
-- Adds a third division — "primary" (Little Star Prince / Little Star
-- Princess) — alongside the existing senior (Mr./Miss MTIS) and junior
-- (Prince/Princess MTIS) divisions. Safe, additive — run once in the
-- Supabase SQL editor.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Widen the division CHECK constraints to allow 'primary'
-- ----------------------------------------------------------------------------
-- These constraints were created inline (unnamed) in earlier migrations,
-- so Postgres auto-named them using the standard "<table>_<column>_check"
-- convention — that's what we drop here before re-adding with 'primary'
-- included.
ALTER TABLE public.contestants
  DROP CONSTRAINT IF EXISTS contestants_division_check;
ALTER TABLE public.contestants
  ADD CONSTRAINT contestants_division_check CHECK (division IN ('senior', 'junior', 'primary'));

ALTER TABLE public.votes
  DROP CONSTRAINT IF EXISTS votes_division_check;
ALTER TABLE public.votes
  ADD CONSTRAINT votes_division_check CHECK (division IN ('senior', 'junior', 'primary'));

ALTER TABLE public.voting_locks
  DROP CONSTRAINT IF EXISTS voting_locks_division_check;
ALTER TABLE public.voting_locks
  ADD CONSTRAINT voting_locks_division_check CHECK (division IN ('senior', 'junior', 'primary'));


-- ----------------------------------------------------------------------------
-- 2. Seed voting_locks rows for the new division (closed by default, same
--    as every other category/division/gender combination when first
--    created — the admin opens each when its round begins).
-- ----------------------------------------------------------------------------
INSERT INTO public.voting_locks (category_id, gender, division, is_locked)
SELECT c.id, g.gender, 'primary', true
FROM public.categories c
CROSS JOIN (SELECT unnest(ARRAY['male', 'female']) AS gender) g
ON CONFLICT (category_id, gender, division) DO NOTHING;


-- ----------------------------------------------------------------------------
-- 3. Demo contestants for the primary division (optional — remove this
--    block if you don't want demo rows on a live database)
-- ----------------------------------------------------------------------------
INSERT INTO public.contestants (name, gender, division, category, signature_style, age, hometown, talent, representing, bio, achievements) VALUES
  ('David Afolabi', 'male',   'primary', 'Talent Showcase', 'Bright & Playful', 9, 'Ajah, Lagos', 'Storytelling',        'Primary 4 Gold House', 'David lights up every room with his storytelling and boundless energy.', ARRAY['Best Reader, Primary Section']),
  ('Amina Yusuf',   'female', 'primary', 'Runway',          'Sweet & Sparkly',  9, 'Sangotedo, Lagos', 'Singing',        'Primary 4 Blue House', 'Amina has a beautiful singing voice and loves performing for her classmates.', ARRAY['Junior Choir Star'])
ON CONFLICT DO NOTHING;
