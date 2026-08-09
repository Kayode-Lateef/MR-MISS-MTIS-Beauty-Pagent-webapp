import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

function getSupabaseAdmin() {
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error('Supabase admin credentials are not configured.');
  }

  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export async function GET() {
  try {
    const supabaseAdmin = getSupabaseAdmin();

    const [votesRes, usersRes, contestantsRes, adminVotesRes] = await Promise.all([
      supabaseAdmin.from('votes').select('category_id, contestant_id'),
      supabaseAdmin.from('users').select('id', { count: 'exact', head: true }),
      supabaseAdmin.from('contestants').select('*'),
      supabaseAdmin.from('admin_votes').select('category_id, contestant_id, votes_to_add'),
    ]);

    if (votesRes.error) throw votesRes.error;
    if (usersRes.error) throw usersRes.error;
    if (contestantsRes.error) throw contestantsRes.error;
    if (adminVotesRes.error) throw adminVotesRes.error;

    const votes = votesRes.data || [];
    const adminVotes = adminVotesRes.data || [];
    const adminVotesTotal = adminVotes.reduce((sum, row) => sum + (Number(row.votes_to_add) || 0), 0);

    return NextResponse.json({
      votes,
      adminVotes,
      contestants: contestantsRes.data || [],
      totalVoters: usersRes.count || 0,
      totalVotes: votes.length + adminVotesTotal,
    });
  } catch (error: any) {
    console.error('Results summary error:', error);
    return NextResponse.json({ error: error.message || 'Failed to load results summary' }, { status: 500 });
  }
}
