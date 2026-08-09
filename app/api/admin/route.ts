import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin, requireAdmin, AuthError } from '../lib/auth';

const ALLOWED_TABLES = [
  'contestants',
  'categories',
  'voting_locks',
  'votes',
  'users',
  'pending_votes',
  'results',
  'admin_votes',
  'schedule_events',
  'payments',
  'site_content',
  'flyer_templates',
];

// Tables that must never be fully deletable/writable via generic CRUD,
// even by an admin, without going through the dedicated handlers below.
const USER_MANAGED_VIA_AUTH = new Set(['users']);

async function handleCreate(table: string, data: any) {
  const supabaseAdmin = getSupabaseAdmin();
  const { data: inserted, error } = await supabaseAdmin.from(table).insert([data]).select();
  if (error) throw error;
  return inserted;
}

async function handleUpdate(table: string, id: any, data: any) {
  if (id === undefined || id === null) throw new Error('Missing id for update.');
  const supabaseAdmin = getSupabaseAdmin();
  const { data: updated, error } = await supabaseAdmin.from(table).update(data).eq('id', id).select();
  if (error) throw error;
  return updated;
}

async function handleDelete(table: string, id: any) {
  if (id === undefined || id === null) throw new Error('Missing id for delete.');
  const supabaseAdmin = getSupabaseAdmin();
  const { data: deleted, error } = await supabaseAdmin.from(table).delete().eq('id', id).select();
  if (error) throw error;
  return deleted;
}

async function handleCreateUser(data: any) {
  if (!data?.email) throw new Error('Email is required to create a user.');

  const supabaseAdmin = getSupabaseAdmin();
  const voterId = `MTIS-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email: data.email,
    password: data.password || crypto.randomUUID(),
    email_confirm: true,
    user_metadata: {
      full_name: data.full_name || '',
      phone: data.phone || '',
    },
  });

  if (authError) throw authError;
  if (!authData?.user) throw new Error('Failed to create auth user.');

  const { data: inserted, error } = await supabaseAdmin
    .from('users')
    .insert([{
      id: authData.user.id,
      email: data.email,
      full_name: data.full_name || '',
      phone: data.phone || '',
      voter_id: voterId,
      role: data.role === 'admin' ? 'admin' : 'voter',
      is_verified: true,
      created_at: new Date().toISOString(),
    }])
    .select();

  if (error) {
    // Roll back the auth user if the profile row failed to insert, so we
    // don't end up with an orphaned auth account with no profile.
    await supabaseAdmin.auth.admin.deleteUser(authData.user.id).catch(() => {});
    throw error;
  }
  return inserted;
}

async function handleDeleteUser(id: string) {
  if (!id) throw new Error('Missing id for delete-user.');
  const supabaseAdmin = getSupabaseAdmin();
  const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(id);
  if (authError) throw authError;

  const { data: deleted, error } = await supabaseAdmin
    .from('users')
    .delete()
    .eq('id', id)
    .select();

  if (error) throw error;
  return deleted;
}

// Add this function near the other handle functions (after handleDeleteUser)
async function handleDeleteByContestant(contestantId: number) {
  if (!contestantId) throw new Error('Missing contestantId for delete-by-contestant.');
  const supabaseAdmin = getSupabaseAdmin();
  
  // First delete admin_votes for this contestant
  const { data: deletedAdminVotes, error: adminVotesError } = await supabaseAdmin
    .from('admin_votes')
    .delete()
    .eq('contestant_id', contestantId)
    .select();
  
  if (adminVotesError) {
    console.error('Error deleting admin_votes:', adminVotesError);
  }
  
  // Delete votes for this contestant
  const { data: deletedVotes, error: votesError } = await supabaseAdmin
    .from('votes')
    .delete()
    .eq('contestant_id', contestantId)
    .select();
  
  if (votesError) {
    console.error('Error deleting votes:', votesError);
  }
  
  // Delete results for this contestant
  const { data: deletedResults, error: resultsError } = await supabaseAdmin
    .from('results')
    .delete()
    .eq('contestant_id', contestantId)
    .select();
  
  if (resultsError) {
    console.error('Error deleting results:', resultsError);
  }
  
  return { 
    deletedAdminVotes: deletedAdminVotes || [], 
    deletedVotes: deletedVotes || [],
    deletedResults: deletedResults || []
  };
}

async function handleUpsertLock(
  categoryId: string,
  gender: 'male' | 'female' | 'both' | undefined,
  division: 'senior' | 'junior' | 'primary' | 'both' | undefined,
  isLocked: boolean
) {
  if (!categoryId) throw new Error('Missing categoryId for upsert-lock.');
  const supabaseAdmin = getSupabaseAdmin();

  // gender/division omitted or 'both' means "every row this category has
  // for that dimension" — lets the admin lock e.g. all of a category's
  // rows, or just the senior side, or just one exact (gender, division).
  let query = supabaseAdmin.from('voting_locks').select('category_id, gender, division').eq('category_id', categoryId);
  if (gender === 'male' || gender === 'female') query = query.eq('gender', gender);
  if (division === 'senior' || division === 'junior' || division === 'primary') query = query.eq('division', division);

  const { data: targetRows, error: targetError } = await query;
  if (targetError) throw targetError;

  if (!targetRows || targetRows.length === 0) {
    throw new Error(`No lock rows found for category '${categoryId}'. Run the fresh schema migration first.`);
  }

  const rows = targetRows.map((r) => ({
    category_id: r.category_id,
    gender: r.gender,
    division: r.division,
    is_locked: !!isLocked,
    locked_at: isLocked ? new Date().toISOString() : null,
    unlocked_at: isLocked ? null : new Date().toISOString(),
  }));

  const { data, error } = await supabaseAdmin
    .from('voting_locks')
    .upsert(rows, { onConflict: 'category_id,gender,division' })
    .select();

  if (error) throw error;
  return data;
}

async function handleLockAll(isLocked: boolean) {
  const supabaseAdmin = getSupabaseAdmin();
  const { data: allLocks, error: readError } = await supabaseAdmin.from('voting_locks').select('category_id, gender, division');
  if (readError) throw readError;
  if (!allLocks || allLocks.length === 0) return [];

  const rows = allLocks.map((l) => ({
    category_id: l.category_id,
    gender: l.gender,
    division: l.division,
    is_locked: !!isLocked,
    locked_at: isLocked ? new Date().toISOString() : null,
    unlocked_at: isLocked ? null : new Date().toISOString(),
  }));

  const { data, error } = await supabaseAdmin
    .from('voting_locks')
    .upsert(rows, { onConflict: 'category_id,gender,division' })
    .select();

  if (error) throw error;
  return data;
}


export async function POST(request: NextRequest) {
  // Every admin action requires a verified Supabase session belonging to
  // a user with role === 'admin'. This is the critical fix: previously
  // this endpoint used the service-role key with no auth check at all,
  // meaning anyone who could reach it could read/write/delete any table.
  try {
    await requireAdmin(request);
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: 'Authentication check failed.' }, { status: 500 });
  }

  let payload: any;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const { table, action, data, id, categoryId, gender, division, isLocked, contestantId } = payload || {};

  if (!table || typeof table !== 'string' || !ALLOWED_TABLES.includes(table)) {
    return NextResponse.json({ error: 'Invalid or unsupported table.' }, { status: 400 });
  }

  if (USER_MANAGED_VIA_AUTH.has(table) && (action === 'create' || action === 'delete')) {
    return NextResponse.json(
      { error: `Use 'create-user' / 'delete-user' actions for the ${table} table.` },
      { status: 400 }
    );
  }

  try {
    const supabaseAdmin = getSupabaseAdmin();
    let result;
    switch (action) {
      case 'read': {
        const { data: readData, error: readError } = await supabaseAdmin.from(table).select('*');
        if (readError) throw readError;
        result = readData;
        break;
      }
      case 'create':
        result = await handleCreate(table, data);
        break;
      case 'create-user':
        result = await handleCreateUser(data);
        break;
      case 'update':
        result = await handleUpdate(table, id, data);
        break;
      case 'delete':
        result = await handleDelete(table, id);
        break;
      case 'delete-user':
        result = await handleDeleteUser(id);
        break;
      // ADD THIS NEW CASE
      case 'delete-by-contestant':
        result = await handleDeleteByContestant(contestantId || id);
        break;
      case 'upsert-lock':
        result = await handleUpsertLock(categoryId, gender, division, isLocked);
        break;
      case 'lock-all':
        result = await handleLockAll(isLocked);
        break;
      default:
        return NextResponse.json({ error: 'Invalid admin action.' }, { status: 400 });
    }

    return NextResponse.json({ data: result });
  } catch (error: any) {
    console.error('Admin action failed:', { table, action, error });
    return NextResponse.json({ error: error?.message || 'Admin action failed' }, { status: 500 });
  }
}
