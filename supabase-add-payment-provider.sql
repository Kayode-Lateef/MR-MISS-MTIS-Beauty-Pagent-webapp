-- ============================================================================
-- Adds a `provider` column to `payments` so each row records whether it
-- came through Flutterwave or Paystack. Safe, additive — run once in the
-- Supabase SQL editor.
-- ============================================================================

ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS provider text DEFAULT 'flutterwave';

-- Backfill any existing rows (all pre-Paystack payments were Flutterwave).
UPDATE public.payments SET provider = 'flutterwave' WHERE provider IS NULL;

ALTER TABLE public.payments
  DROP CONSTRAINT IF EXISTS payments_provider_check;

ALTER TABLE public.payments
  ADD CONSTRAINT payments_provider_check CHECK (provider IN ('flutterwave', 'paystack'));
