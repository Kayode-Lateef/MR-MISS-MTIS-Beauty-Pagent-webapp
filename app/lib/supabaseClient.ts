// lib/supabaseClient.ts
import { createClient } from '@supabase/supabase-js'

// Make sure these environment variables are set correctly
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Previously this module threw at import time when the env vars were
// missing. That crashed `next build`'s prerender step (and, in
// production, every page that imports this file) before a single request
// could even be handled — a missing/blank .env.local took the whole app
// down instead of just the features that need Supabase. We now log a
// clear warning and fall back to placeholder values so the app still
// boots; calls to Supabase will simply fail with a network/auth error at
// the point of use, which is much easier to diagnose and doesn't take
// down unrelated pages.
const isConfigured = Boolean(supabaseUrl && supabaseAnonKey)

if (!isConfigured) {
  console.error(
    'Missing NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY. ' +
    'Add them to .env.local — Supabase-backed features (auth, voting, results) will not work until you do.'
  )
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  }
)

export const isSupabaseConfigured = isConfigured
