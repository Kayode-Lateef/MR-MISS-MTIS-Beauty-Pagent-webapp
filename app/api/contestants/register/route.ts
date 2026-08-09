import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '../../lib/auth';
import { uploadDataUrlImage, ImageUploadError } from '../../lib/upload';

const MAX_GALLERY_IMAGES = 3;
const MAX_TEXT_FIELD = 2000;

function clean(value: unknown, maxLength = 500): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, maxLength);
}

/**
 * Public endpoint: a contestant fills out /register-contestant and this
 * saves their full profile. New registrations start as
 * registration_status = 'pending' — they won't appear on /vote,
 * /public-vote, or /results until an admin approves them from the
 * dashboard's Contestants tab. This prevents anyone who finds this URL
 * from instantly injecting fake contestants into a live pageant.
 */
export async function POST(request: NextRequest) {
  let payload: any;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const name = clean(payload.name, 200);
  const gender = payload.gender === 'male' || payload.gender === 'female' ? payload.gender : null;
  const division = payload.division === 'senior' || payload.division === 'junior' || payload.division === 'primary' ? payload.division : null;

  if (!name || !gender || !division) {
    return NextResponse.json({ error: 'Full name, gender, and division are required.' }, { status: 400 });
  }

  if (!payload.profilePicture || typeof payload.profilePicture !== 'string') {
    return NextResponse.json({ error: 'A profile picture is required.' }, { status: 400 });
  }

  const galleryInput: string[] = Array.isArray(payload.galleryImages) ? payload.galleryImages.slice(0, MAX_GALLERY_IMAGES) : [];

  try {
    const avatarUrl = await uploadDataUrlImage(payload.profilePicture, 'contestants/profile', name.replace(/\s+/g, '-').toLowerCase());

    const galleryUrls: string[] = [];
    for (const img of galleryInput) {
      if (typeof img !== 'string' || !img) continue;
      galleryUrls.push(await uploadDataUrlImage(img, 'contestants/gallery', name.replace(/\s+/g, '-').toLowerCase()));
    }

    const supabaseAdmin = getSupabaseAdmin();
    const { data, error } = await supabaseAdmin
      .from('contestants')
      .insert({
        name,
        gender,
        division,
        stage_name: clean(payload.stageName, 200),
        contestant_number: clean(payload.contestantNumber, 20),
        class: clean(payload.class, 50),
        age: Number.isFinite(Number(payload.age)) ? Number(payload.age) : null,
        hometown: clean(payload.hometown, 200),
        religion: clean(payload.religion, 100),
        nationality: clean(payload.nationality, 100),
        state_of_origin: clean(payload.stateOfOrigin, 100),
        favourite_subject: clean(payload.favouriteSubject, 100),
        role_model: clean(payload.roleModel, 200),
        dream_career: clean(payload.dreamCareer, 200),
        talent: clean(payload.talent, 300),
        favourite_food: clean(payload.favouriteFood, 200),
        favourite_drink: clean(payload.favouriteDrink, 200),
        favourite_music_genre: clean(payload.favouriteMusicGenre, 200),
        favourite_movie_tv_show: clean(payload.favouriteMovieTvShow, 200),
        favourite_book: clean(payload.favouriteBook, 200),
        fun_facts: clean(payload.funFacts, MAX_TEXT_FIELD),
        bio: clean(payload.bio, MAX_TEXT_FIELD),
        representing: clean(payload.representing, 200),
        category: payload.category === 'Talent Showcase' ? 'Talent Showcase' : 'Runway',
        achievements: Array.isArray(payload.achievements)
          ? payload.achievements.filter((a: unknown) => typeof a === 'string' && a.trim()).slice(0, 20)
          : [],
        avatar_url: avatarUrl,
        gallery_images: galleryUrls,
        registration_status: 'pending',
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, contestant: data });
  } catch (error: any) {
    if (error instanceof ImageUploadError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error('Contestant registration error:', error);
    return NextResponse.json({ error: error?.message || 'Failed to submit registration.' }, { status: 500 });
  }
}
