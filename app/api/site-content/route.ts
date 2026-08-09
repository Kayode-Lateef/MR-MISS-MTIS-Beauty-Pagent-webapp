import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '../lib/auth';

/**
 * Public, read-only endpoint the frontend uses to load editable site copy
 * (hero text, about section, contact details, social links, footer).
 * Admins edit these values from the dashboard's "Site Content" tab, which
 * writes through the authenticated /api/admin route — this endpoint never
 * accepts writes, only reads, so no auth is required here.
 */
export async function GET() {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const { data, error } = await supabaseAdmin.from('site_content').select('id, value');

    if (error) throw error;

    const content: Record<string, string> = {};
    (data || []).forEach((row) => { content[row.id] = row.value; });

    return NextResponse.json({ content });
  } catch (error: any) {
    console.error('Site content fetch error:', error);
    // Fail soft: the frontend falls back to its built-in default copy if
    // this errors, so a misconfigured DB never takes the homepage down.
    return NextResponse.json({ content: {}, error: error?.message || 'Failed to load site content' }, { status: 200 });
  }
}
