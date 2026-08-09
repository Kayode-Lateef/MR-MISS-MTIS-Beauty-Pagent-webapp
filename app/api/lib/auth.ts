import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

let cachedAdmin: SupabaseClient | null = null;

/**
 * Lazily-initialised Supabase client using the service role key.
 * Never call this at module load time — throwing during import crashes
 * the whole serverless function / dev server before any request can be
 * handled. Call it inside a request handler instead.
 */
export function getSupabaseAdmin(): SupabaseClient {
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error('Supabase admin credentials are not configured.');
  }

  if (!cachedAdmin) {
    cachedAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }

  return cachedAdmin;
}

export class AuthError extends Error {
  status: number;
  constructor(message: string, status = 401) {
    super(message);
    this.status = status;
  }
}

/**
 * Verifies that the incoming request carries a valid Supabase session
 * belonging to a user whose `users.role` is 'admin'. Throws AuthError
 * (401/403) if not. This is the server-side gate for every /api/admin
 * action — without it, anyone who can reach the endpoint can read,
 * write, or delete any table using the service-role key.
 */
export async function requireAdmin(request: Request): Promise<{ id: string; email: string | null }> {
  const authHeader = request.headers.get('authorization') || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';

  if (!token) {
    throw new AuthError('Missing or invalid Authorization header.', 401);
  }

  const supabaseAdmin = getSupabaseAdmin();

  const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
  if (userError || !userData?.user) {
    throw new AuthError('Invalid or expired session.', 401);
  }

  const { data: profile, error: profileError } = await supabaseAdmin
    .from('users')
    .select('role')
    .eq('id', userData.user.id)
    .maybeSingle();

  if (profileError) {
    throw new AuthError('Failed to verify admin role.', 500);
  }

  if (!profile || profile.role !== 'admin') {
    throw new AuthError('Admin privileges required.', 403);
  }

  return { id: userData.user.id, email: userData.user.email ?? null };
}
