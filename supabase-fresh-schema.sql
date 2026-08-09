-- ============================================================================
-- iVote — FRESH SCHEMA + DEMO DATA
-- Senior (Mr. / Miss MTIS) + Junior (Prince / Princess MTIS) pageant model
--
-- This REPLACES the previous schema + the two earlier migration files
-- (supabase-migration.sql, supabase-migration-gender-voting.sql) — you do
-- not need to run those if you're running this. Run this once, in the
-- Supabase SQL editor, on a project you're OK wiping voting/contestant
-- data on (auth.users / logins are left untouched).
--
-- Structure: every pageant category (Most Talented, Best Speaker, etc.)
-- now has FOUR independently-lockable sub-votes:
--   senior + male   -> "Mr. MTIS"
--   senior + female -> "Miss MTIS"
--   junior + male   -> "Prince MTIS"
--   junior + female -> "Princess MTIS"
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 0. Clean slate (safe to re-run; auth.users / public.users are NOT dropped)
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS public.admin_votes CASCADE;
DROP TABLE IF EXISTS public.results CASCADE;
DROP TABLE IF EXISTS public.pending_votes CASCADE;
DROP TABLE IF EXISTS public.payments CASCADE;
DROP TABLE IF EXISTS public.votes CASCADE;
DROP TABLE IF EXISTS public.voting_locks CASCADE;
DROP TABLE IF EXISTS public.schedule_events CASCADE;
DROP TABLE IF EXISTS public.contestants CASCADE;
DROP TABLE IF EXISTS public.categories CASCADE;
DROP TABLE IF EXISTS public.site_content CASCADE;

DROP FUNCTION IF EXISTS public.is_admin() CASCADE;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";


-- ----------------------------------------------------------------------------
-- 1. users (created here only if it doesn't already exist — never dropped)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.users (
  id uuid NOT NULL,
  email text NOT NULL UNIQUE,
  full_name text,
  phone text,
  voter_id text UNIQUE,
  role text DEFAULT 'voter'::text,
  is_verified boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  location text DEFAULT 'Not specified'::text,
  notifications jsonb DEFAULT '{"sms": false, "push": true, "email": true, "votes": true, "events": false, "results": true}'::jsonb,
  preferences jsonb DEFAULT '{"theme": "light", "language": "English", "timezone": "Africa/Lagos", "autoRefresh": true, "compactView": false, "soundEffects": true}'::jsonb,
  privacy jsonb DEFAULT '{"shareVotes": false, "publicProfile": false, "showInLeaderboard": true}'::jsonb,
  CONSTRAINT users_pkey PRIMARY KEY (id),
  CONSTRAINT users_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);


-- ----------------------------------------------------------------------------
-- 2. contestants — now with `division` (senior/junior) alongside `gender`
-- ----------------------------------------------------------------------------
CREATE SEQUENCE IF NOT EXISTS contestants_id_seq;

CREATE TABLE public.contestants (
  id integer NOT NULL DEFAULT nextval('contestants_id_seq'::regclass),
  name text NOT NULL,
  gender text NOT NULL CHECK (gender IN ('male', 'female')),
  division text NOT NULL DEFAULT 'senior' CHECK (division IN ('senior', 'junior')),
  category text CHECK (category = ANY (ARRAY['Runway'::text, 'Talent Showcase'::text])),
  signature_style text,
  age integer,
  hometown text,
  talent text,
  representing text,
  bio text,
  achievements text[],
  avatar_url text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT contestants_pkey PRIMARY KEY (id)
);

ALTER SEQUENCE contestants_id_seq OWNED BY public.contestants.id;

-- Handy view for "what does this contestant's title look like" without
-- repeating the division/gender -> title mapping in every query.
CREATE OR REPLACE VIEW public.contestants_with_title AS
SELECT
  c.*,
  CASE
    WHEN division = 'senior' AND gender = 'male'   THEN 'Mr. MTIS'
    WHEN division = 'senior' AND gender = 'female' THEN 'Miss MTIS'
    WHEN division = 'junior' AND gender = 'male'   THEN 'Prince MTIS'
    WHEN division = 'junior' AND gender = 'female' THEN 'Princess MTIS'
  END AS pageant_title
FROM public.contestants c;


-- ----------------------------------------------------------------------------
-- 3. categories — unchanged shape; every category now applies across all
--    four (division, gender) groups, regardless of its `gender` column
--    (kept for backward compatibility / possible future single-gender
--    special categories, but the app currently always renders all 4).
-- ----------------------------------------------------------------------------
CREATE TABLE public.categories (
  id text NOT NULL,
  name text NOT NULL,
  description text,
  icon text,
  gender text DEFAULT 'both'::text CHECK (gender = ANY (ARRAY['male'::text, 'female'::text, 'both'::text])),
  is_active boolean DEFAULT false,
  voting_start_date timestamp with time zone,
  voting_end_date timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT categories_pkey PRIMARY KEY (id)
);


-- ----------------------------------------------------------------------------
-- 4. votes — gender + division on every internal (free) vote
-- ----------------------------------------------------------------------------
CREATE TABLE public.votes (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  voter_id uuid,
  contestant_id integer,
  category_id text,
  gender text CHECK (gender IN ('male', 'female')),
  division text CHECK (division IN ('senior', 'junior')),
  vote_timestamp timestamp with time zone DEFAULT now(),
  is_valid boolean DEFAULT true,
  payment_transaction_id text,
  payment_amount integer,
  voter_name text,
  voter_email text,
  is_public_vote boolean DEFAULT false,
  CONSTRAINT votes_pkey PRIMARY KEY (id),
  CONSTRAINT votes_voter_id_fkey FOREIGN KEY (voter_id) REFERENCES public.users(id),
  CONSTRAINT votes_contestant_id_fkey FOREIGN KEY (contestant_id) REFERENCES public.contestants(id),
  CONSTRAINT votes_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id)
);

-- One free vote per (voter, category, gender, division) — i.e. a voter can
-- vote once for Mr. MTIS, once for Miss MTIS, once for Prince MTIS, and
-- once for Princess MTIS, in each category. Paid public votes (voter_id
-- NULL) are unaffected and can have many rows.
CREATE UNIQUE INDEX votes_voter_category_gender_division_key
  ON public.votes (voter_id, category_id, gender, division)
  WHERE voter_id IS NOT NULL AND gender IS NOT NULL AND division IS NOT NULL;

CREATE INDEX idx_votes_payment_transaction_id ON public.votes (payment_transaction_id);
CREATE INDEX idx_votes_contestant_id ON public.votes (contestant_id);


-- ----------------------------------------------------------------------------
-- 5. voting_locks — one row per (category, gender, division) triple
-- ----------------------------------------------------------------------------
CREATE SEQUENCE IF NOT EXISTS voting_locks_id_seq;

CREATE TABLE public.voting_locks (
  id integer NOT NULL DEFAULT nextval('voting_locks_id_seq'::regclass),
  category_id text NOT NULL,
  gender text NOT NULL CHECK (gender IN ('male', 'female')),
  division text NOT NULL CHECK (division IN ('senior', 'junior')),
  is_locked boolean DEFAULT true,
  locked_at timestamp with time zone,
  unlocked_at timestamp with time zone,
  unlocked_by uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT voting_locks_pkey PRIMARY KEY (id),
  CONSTRAINT voting_locks_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id),
  CONSTRAINT voting_locks_unlocked_by_fkey FOREIGN KEY (unlocked_by) REFERENCES auth.users(id)
);

ALTER SEQUENCE voting_locks_id_seq OWNED BY public.voting_locks.id;

CREATE UNIQUE INDEX voting_locks_category_gender_division_key
  ON public.voting_locks (category_id, gender, division);


-- ----------------------------------------------------------------------------
-- 6. schedule_events — unchanged
-- ----------------------------------------------------------------------------
CREATE SEQUENCE IF NOT EXISTS schedule_events_id_seq;

CREATE TABLE public.schedule_events (
  id integer NOT NULL DEFAULT nextval('schedule_events_id_seq'::regclass),
  day text NOT NULL,
  date text NOT NULL,
  time text NOT NULL,
  name text NOT NULL,
  location text NOT NULL,
  icon_name text NOT NULL,
  description text,
  order_num integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT schedule_events_pkey PRIMARY KEY (id)
);

ALTER SEQUENCE schedule_events_id_seq OWNED BY public.schedule_events.id;


-- ----------------------------------------------------------------------------
-- 7. pending_votes — manual/offline payment approvals (unchanged shape)
-- ----------------------------------------------------------------------------
CREATE SEQUENCE IF NOT EXISTS pending_votes_id_seq;

CREATE TABLE public.pending_votes (
  id integer NOT NULL DEFAULT nextval('pending_votes_id_seq'::regclass),
  contestant_id integer,
  contestant_name text NOT NULL,
  voter_name text,
  voter_email text,
  voter_phone text,
  amount integer NOT NULL,
  votes_requested integer NOT NULL,
  receipt_url text,
  status text DEFAULT 'pending'::text,
  payment_method text,
  verified_by uuid,
  verified_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT pending_votes_pkey PRIMARY KEY (id),
  CONSTRAINT pending_votes_contestant_id_fkey FOREIGN KEY (contestant_id) REFERENCES public.contestants(id),
  CONSTRAINT pending_votes_verified_by_fkey FOREIGN KEY (verified_by) REFERENCES public.users(id)
);

ALTER SEQUENCE pending_votes_id_seq OWNED BY public.pending_votes.id;


-- ----------------------------------------------------------------------------
-- 8. payments — unchanged shape, tx_ref UNIQUE + status CHECK from the start
-- ----------------------------------------------------------------------------
CREATE SEQUENCE IF NOT EXISTS payments_id_seq;

CREATE TABLE public.payments (
  id integer NOT NULL DEFAULT nextval('payments_id_seq'::regclass),
  transaction_id text NOT NULL,
  tx_ref text NOT NULL UNIQUE,
  amount integer NOT NULL,
  votes_purchased integer NOT NULL,
  contestant_id integer,
  contestant_name text NOT NULL,
  voter_name text NOT NULL,
  voter_email text NOT NULL,
  voter_phone text,
  status text DEFAULT 'pending'::text CHECK (status IN ('pending', 'successful', 'failed')),
  payment_method text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT payments_pkey PRIMARY KEY (id),
  CONSTRAINT payments_contestant_id_fkey FOREIGN KEY (contestant_id) REFERENCES public.contestants(id)
);

ALTER SEQUENCE payments_id_seq OWNED BY public.payments.id;


-- ----------------------------------------------------------------------------
-- 9. admin_votes — manual vote adjustments (unchanged shape)
-- ----------------------------------------------------------------------------
CREATE TABLE public.admin_votes (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  category_id text NOT NULL,
  contestant_id bigint NOT NULL,
  votes_to_add integer NOT NULL DEFAULT 0 CHECK (votes_to_add >= 0),
  reason text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT admin_votes_pkey PRIMARY KEY (id),
  CONSTRAINT admin_votes_contestant_id_fkey FOREIGN KEY (contestant_id) REFERENCES public.contestants(id)
);


-- ----------------------------------------------------------------------------
-- 10. results — unchanged shape
-- ----------------------------------------------------------------------------
CREATE SEQUENCE IF NOT EXISTS results_id_seq;

CREATE TABLE public.results (
  id integer NOT NULL DEFAULT nextval('results_id_seq'::regclass),
  category_id text,
  contestant_id integer,
  total_votes integer DEFAULT 0,
  vote_percentage numeric,
  rank integer,
  is_winner boolean DEFAULT false,
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT results_pkey PRIMARY KEY (id),
  CONSTRAINT results_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id),
  CONSTRAINT results_contestant_id_fkey FOREIGN KEY (contestant_id) REFERENCES public.contestants(id)
);

ALTER SEQUENCE results_id_seq OWNED BY public.results.id;


-- ----------------------------------------------------------------------------
-- 11. site_content — the CMS. One row per editable field, so the admin
--     dashboard's generic table editor (read/update/create/delete) works
--     on it with zero extra code, and the frontend fetches it as a flat
--     key -> value map.
-- ----------------------------------------------------------------------------
CREATE TABLE public.site_content (
  id text PRIMARY KEY,
  section text NOT NULL DEFAULT 'general',
  label text NOT NULL,
  value text NOT NULL DEFAULT '',
  updated_at timestamp with time zone DEFAULT now()
);

INSERT INTO public.site_content (id, section, label, value) VALUES
  ('site_name',           'branding', 'Site name',                 'MTIS VOTE'),
  ('site_tagline',        'branding', 'Tagline',                   'Official Voting System'),
  ('event_year',          'branding', 'Event year',                '2026'),
  ('hero_title',          'hero',     'Hero title',                'Vote for the next Mr. & Miss, Prince & Princess of MTIS'),
  ('hero_subtitle',       'hero',     'Hero subtitle',              'The official voting platform for the MTIS Pageant. Secure, transparent, and easy to use — for our Senior and Junior royalty alike.'),
  ('about_title',         'about',    'About section title',       'About the Pageant'),
  ('about_text',          'about',    'About section text',        'The MTIS Pageant celebrates confidence, talent, and school spirit across two divisions: our Senior royalty, competing for Mr. & Miss MTIS, and our Junior royalty, competing for Prince & Princess MTIS. Every vote across our five categories helps decide all four titles.'),
  ('contact_email',       'contact',  'Contact email',              'macdonaldtrevanschools@gmail.com'),
  ('contact_phone',       'contact',  'Contact phone',              '+2348072201640, +2348065938082, +2348108098018, +2348038805158'),
  ('contact_address',     'contact',  'Contact address',            '5, Joy Ogunbanwo Street, Off Adeba Rd, Lakowe Town, Ibeju Lekki, Lagos'),
  ('social_facebook',     'social',   'Facebook URL',               ''),
  ('social_twitter',      'social',   'Twitter / X URL',            ''),
  ('social_instagram',    'social',   'Instagram URL',              ''),
  ('social_linkedin',     'social',   'LinkedIn URL',               ''),
  ('footer_copyright',    'footer',   'Footer copyright line',      '© 2026 MTIS Voting System. All rights reserved. | Mr. & Miss, Prince & Princess MTIS 2026')
ON CONFLICT (id) DO NOTHING;


-- ----------------------------------------------------------------------------
-- 12. Demo data — categories
-- ----------------------------------------------------------------------------
INSERT INTO public.categories (id, name, description, icon, gender, is_active) VALUES
  ('mostTalented', 'Most Talented Contestant',      'Showcasing unique skills and performances', '⭐', 'both', true),
  ('bestSpeaker',  'Best Speaker Round',             'Confidence and clarity on stage',            '🎤', 'both', true),
  ('bestCultural', 'Best Cultural Representation',   'Celebrating heritage and tradition',         '🌍', 'both', true),
  ('mostElegant',  'Most Elegant Contestant',        'Poise, style, and grace',                    '👗', 'both', true),
  ('peoplesChoice','People''s Choice Award',         'Fan-favorite, decided by paid public voting', '❤️', 'both', true)
ON CONFLICT (id) DO NOTHING;


-- ----------------------------------------------------------------------------
-- 13. Demo data — contestants (2 per group: senior/junior x male/female)
-- ----------------------------------------------------------------------------
INSERT INTO public.contestants (name, gender, division, category, signature_style, age, hometown, talent, representing, bio, achievements) VALUES
  -- Senior Male (Mr. MTIS)
  ('Daniel Okafor',  'male',   'senior', 'Runway',          'Classic Tailored', 17, 'Lekki, Lagos',       'Spoken Word Poetry', 'SS3 Gold House',   'Daniel is a confident public speaker with a passion for community service and debate.', ARRAY['Debate Team Captain', 'Best Speaker 2025']),
  ('Tobi Adeyemi',   'male',   'senior', 'Talent Showcase', 'Afrocentric Chic', 18, 'Ibeju-Lekki, Lagos', 'Drumming & Dance',    'SS3 Blue House',   'Tobi blends traditional drumming with modern choreography to bring culture to life on stage.', ARRAY['Cultural Ambassador 2025', 'Talent Show Winner']),

  -- Senior Female (Miss MTIS)
  ('Chiamaka Nwosu', 'female', 'senior', 'Runway',          'Modern Ankara',    17, 'Ajah, Lagos',        'Contemporary Dance',  'SS3 Gold House',   'Chiamaka is an award-winning dancer known for her grace and stage presence.', ARRAY['Best Dancer 2025', 'House Prefect']),
  ('Amara Bello',    'female', 'senior', 'Talent Showcase', 'Vintage Glam',     18, 'Lakowe, Lagos',      'Vocal Performance',   'SS3 Blue House',   'Amara has a powerful vocal range and has represented MTIS at regional music festivals.', ARRAY['Best Vocalist 2025', 'Choir Lead']),

  -- Junior Male (Prince MTIS)
  ('Kelvin Ude',     'male',   'junior', 'Talent Showcase', 'Smart Casual',     13, 'Sangotedo, Lagos',   'Magic & Illusion',    'JS2 Gold House',   'Kelvin loves entertaining his classmates with magic tricks and quick wit.', ARRAY['Junior Talent Show Finalist']),
  ('Emeka Chukwu',   'male',   'junior', 'Runway',           'Sharp Blazer',     14, 'Awoyaya, Lagos',    'Freestyle Rap',       'JS3 Blue House',    'Emeka is known for his confident stage walk and creative freestyle rhymes.', ARRAY['Junior Debate Semi-Finalist']),

  -- Junior Female (Princess MTIS)
  ('Zainab Balogun', 'female', 'junior', 'Runway',           'Pastel Elegance',  13, 'Abraham Adesanya, Lagos', 'Ballet',        'JS2 Blue House',    'Zainab has trained in ballet since age 6 and dazzles audiences with her poise.', ARRAY['Junior Cultural Day Star']),
  ('Faith Etim',     'female', 'junior', 'Talent Showcase',  'Bright & Bold',    14, 'Eputu, Lagos',       'Spoken Word',         'JS3 Gold House',    'Faith writes and performs her own poetry celebrating friendship and school pride.', ARRAY['Junior Speaker of the Year'])
ON CONFLICT DO NOTHING;


-- ----------------------------------------------------------------------------
-- 14. Demo data — voting locks (every category x gender x division, closed
--     by default; the admin opens each when voting for it begins)
-- ----------------------------------------------------------------------------
INSERT INTO public.voting_locks (category_id, gender, division, is_locked)
SELECT c.id, g.gender, d.division, true
FROM public.categories c
CROSS JOIN (SELECT unnest(ARRAY['male', 'female']) AS gender) g
CROSS JOIN (SELECT unnest(ARRAY['senior', 'junior']) AS division) d
ON CONFLICT (category_id, gender, division) DO NOTHING;


-- ----------------------------------------------------------------------------
-- 15. Demo data — schedule
-- ----------------------------------------------------------------------------
INSERT INTO public.schedule_events (day, date, time, name, location, icon_name, description, order_num, is_active) VALUES
  ('Day 1', 'Fri, Aug 14, 2026', '9:00 AM',  'Registration & Orientation',        'MTIS Main Hall',       'Users',    'Contestants check in and meet the pageant committee.', 1, true),
  ('Day 1', 'Fri, Aug 14, 2026', '2:00 PM',  'Rehearsals — Runway & Talent',      'MTIS Auditorium',      'Music',    'Full run-through for all four titles.',                2, true),
  ('Day 2', 'Sat, Aug 15, 2026', '10:00 AM', 'Public Voting Opens',               'Online',               'Heart',    'Voting for Most Talented, Best Speaker, Best Cultural, Most Elegant, and People''s Choice begins.', 3, true),
  ('Day 2', 'Sat, Aug 15, 2026', '5:00 PM',  'Grand Pageant Night',               'MTIS Main Field',      'Award',    'Mr. & Miss MTIS and Prince & Princess MTIS crowned live.', 4, true)
ON CONFLICT DO NOTHING;


-- ----------------------------------------------------------------------------
-- 16. Admin auth helper + RLS (same as the earlier migration, included here
--     so this file is a complete, standalone setup)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

ALTER TABLE public.contestants     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedule_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.voting_locks    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.votes           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pending_votes   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_votes     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.results         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_content    ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "contestants_public_read" ON public.contestants;
CREATE POLICY "contestants_public_read" ON public.contestants FOR SELECT USING (true);

DROP POLICY IF EXISTS "categories_public_read" ON public.categories;
CREATE POLICY "categories_public_read" ON public.categories FOR SELECT USING (true);

DROP POLICY IF EXISTS "schedule_public_read" ON public.schedule_events;
CREATE POLICY "schedule_public_read" ON public.schedule_events FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "voting_locks_public_read" ON public.voting_locks;
CREATE POLICY "voting_locks_public_read" ON public.voting_locks FOR SELECT USING (true);

DROP POLICY IF EXISTS "site_content_public_read" ON public.site_content;
CREATE POLICY "site_content_public_read" ON public.site_content FOR SELECT USING (true);

DROP POLICY IF EXISTS "contestants_admin_all" ON public.contestants;
CREATE POLICY "contestants_admin_all" ON public.contestants FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "categories_admin_all" ON public.categories;
CREATE POLICY "categories_admin_all" ON public.categories FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "schedule_admin_all" ON public.schedule_events;
CREATE POLICY "schedule_admin_all" ON public.schedule_events FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "voting_locks_admin_all" ON public.voting_locks;
CREATE POLICY "voting_locks_admin_all" ON public.voting_locks FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "payments_admin_all" ON public.payments;
CREATE POLICY "payments_admin_all" ON public.payments FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "votes_admin_all" ON public.votes;
CREATE POLICY "votes_admin_all" ON public.votes FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "pending_votes_admin_all" ON public.pending_votes;
CREATE POLICY "pending_votes_admin_all" ON public.pending_votes FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "admin_votes_admin_all" ON public.admin_votes;
CREATE POLICY "admin_votes_admin_all" ON public.admin_votes FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "results_admin_all" ON public.results;
CREATE POLICY "results_admin_all" ON public.results FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "users_admin_all" ON public.users;
CREATE POLICY "users_admin_all" ON public.users FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "site_content_admin_all" ON public.site_content;
CREATE POLICY "site_content_admin_all" ON public.site_content FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "users_self_read" ON public.users;
CREATE POLICY "users_self_read" ON public.users FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "users_self_update" ON public.users;
CREATE POLICY "users_self_update" ON public.users FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "votes_self_insert" ON public.votes;
CREATE POLICY "votes_self_insert" ON public.votes
  FOR INSERT
  WITH CHECK (auth.uid() = voter_id AND (is_public_vote IS NULL OR is_public_vote = false));

DROP POLICY IF EXISTS "votes_self_read" ON public.votes;
CREATE POLICY "votes_self_read" ON public.votes FOR SELECT USING (auth.uid() = voter_id);

-- ----------------------------------------------------------------------------
-- To make an existing registered user an admin:
--   UPDATE public.users SET role = 'admin' WHERE email = 'you@example.com';
-- ----------------------------------------------------------------------------
