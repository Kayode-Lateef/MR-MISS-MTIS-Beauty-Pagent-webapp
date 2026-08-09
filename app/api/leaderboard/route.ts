// app/api/leaderboard/route.ts
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

    // Fetch all contestants
    const { data: contestants, error: contestantsError } = await supabaseAdmin
      .from('contestants')
      .select('*')
      .order('name');

    if (contestantsError) throw contestantsError;

    // Fetch successful payments (public voting)
    const { data: payments, error: paymentsError } = await supabaseAdmin
      .from('payments')
      .select('contestant_id, votes_purchased')
      .eq('status', 'successful');

    if (paymentsError) throw paymentsError;

    // Calculate votes per contestant from payments
    const voteMap: Record<number, number> = {};
    payments?.forEach((payment) => {
      if (payment.contestant_id && payment.votes_purchased) {
        voteMap[payment.contestant_id] = (voteMap[payment.contestant_id] || 0) + payment.votes_purchased;
      }
    });

    // Calculate total votes
    const totalVotes = Object.values(voteMap).reduce((a, b) => a + b, 0);

    // Find top contestant
    let topId = 0;
    let topVotes = 0;
    Object.entries(voteMap).forEach(([id, votes]) => {
      if (votes > topVotes) {
        topId = parseInt(id);
        topVotes = votes;
      }
    });
    const topContestant = contestants?.find(c => c.id === topId);

    return NextResponse.json({
      contestants: contestants || [],
      voteMap,
      stats: {
        totalContestants: contestants?.length || 0,
        totalVotes,
        topContestant: topContestant ? {
          name: topContestant.name,
          votes: topVotes
        } : { name: "", votes: 0 }
      },
      payments: payments || [],
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Leaderboard error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to load leaderboard data' },
      { status: 500 }
    );
  }
}