import { getSupabaseAdmin } from './auth';

const MAX_IMAGE_BYTES = 4 * 1024 * 1024; // 4MB per image
const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

export class ImageUploadError extends Error {}

/**
 * Accepts a data URL (e.g. "data:image/png;base64,....") and uploads it to
 * the public `ivote-media` storage bucket using the service-role key.
 * Returns the public URL. Used by both the public contestant-registration
 * endpoint and the admin flyer-template upload endpoint — this is the
 * ONLY way images get into storage, so no public storage write policy is
 * needed at all.
 */
export async function uploadDataUrlImage(dataUrl: string, folder: string, filenamePrefix: string): Promise<string> {
  const match = /^data:(image\/[a-zA-Z+]+);base64,(.+)$/.exec(dataUrl);
  if (!match) {
    throw new ImageUploadError('Invalid image data. Expected a base64 data URL.');
  }

  const mimeType = match[1].toLowerCase();
  if (!ALLOWED_MIME_TYPES.has(mimeType)) {
    throw new ImageUploadError(`Unsupported image type "${mimeType}". Use JPEG, PNG, or WebP.`);
  }

  const base64Data = match[2];
  const buffer = Buffer.from(base64Data, 'base64');

  if (buffer.length > MAX_IMAGE_BYTES) {
    throw new ImageUploadError(`Image is too large (${(buffer.length / 1024 / 1024).toFixed(1)}MB). Max size is ${MAX_IMAGE_BYTES / 1024 / 1024}MB.`);
  }

  const extension = mimeType.split('/')[1].replace('jpeg', 'jpg');
  const path = `${folder}/${filenamePrefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${extension}`;

  const supabaseAdmin = getSupabaseAdmin();
  const { error } = await supabaseAdmin.storage.from('ivote-media').upload(path, buffer, {
    contentType: mimeType,
    upsert: false,
  });

  if (error) {
    throw new ImageUploadError(`Failed to upload image: ${error.message}`);
  }

  const { data: publicUrlData } = supabaseAdmin.storage.from('ivote-media').getPublicUrl(path);
  return publicUrlData.publicUrl;
}
