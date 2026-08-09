import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, AuthError } from '../../lib/auth';
import { uploadDataUrlImage, ImageUploadError } from '../../lib/upload';

export async function POST(request: NextRequest) {
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

  if (!payload?.image || typeof payload.image !== 'string') {
    return NextResponse.json({ error: 'Missing image data.' }, { status: 400 });
  }

  const folder = payload.folder === 'flyers' ? 'flyers' : 'misc';

  try {
    const url = await uploadDataUrlImage(payload.image, folder, 'template');
    return NextResponse.json({ url });
  } catch (error: any) {
    if (error instanceof ImageUploadError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error('Admin image upload error:', error);
    return NextResponse.json({ error: error?.message || 'Failed to upload image.' }, { status: 500 });
  }
}
