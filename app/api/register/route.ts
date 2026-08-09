import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '../lib/auth';

export async function POST(request: NextRequest) {
  let payload: any;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const { id, email, full_name, phone, voter_id } = payload || {};

  if (!id || !email || !full_name || !phone || !voter_id) {
    return NextResponse.json({ error: 'Missing required registration fields.' }, { status: 400 });
  }

  if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Invalid email address.' }, { status: 400 });
  }

  try {
    const supabaseAdmin = getSupabaseAdmin();

    const { data, error } = await supabaseAdmin
      .from('users')
      .upsert(
        {
          id,
          email,
          full_name,
          phone,
          voter_id,
          role: 'voter',
          is_verified: false,
          created_at: new Date().toISOString(),
        },
        { onConflict: 'id' }
      )
      .select();

    if (error) throw error;

    return NextResponse.json({ data });
  } catch (error: any) {
    console.error('Registration error:', error);
    return NextResponse.json({ error: error?.message || 'Failed to create user profile.' }, { status: 500 });
  }
}
