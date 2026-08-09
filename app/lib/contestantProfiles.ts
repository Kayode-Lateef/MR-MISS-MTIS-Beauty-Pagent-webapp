export interface ContestantProfileData {
  contestant_number?: string;
  class?: string;
  stage_name?: string;
  full_name?: string;
  age?: string | number;
  gender?: string;
  religion?: string;
  nationality?: string;
  state_of_origin?: string;
  favorite_subject?: string;
  role_model?: string;
  dream_career?: string;
  talents?: string[];
  awards_and_achievements?: string[];
  favorite_food?: string;
  favorite_drink?: string;
  favorite_music_genre?: string;
  favorite_movie_or_tv_show?: string;
  favorite_book?: string;
  fun_facts?: string[];
  bio?: string;
  gallery_images?: string[];
  profile_image_url?: string;
}

export interface ContestantProfileRecord {
  id?: number;
  name?: string;
  gender?: 'male' | 'female';
  division?: 'senior' | 'junior';
  category?: string;
  signature_style?: string;
  age?: number;
  hometown?: string;
  talent?: string;
  representing?: string;
  bio?: string | null;
  achievements?: string[];
  avatar_url?: string | null;
  [key: string]: any;
}

export function toStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === 'string' && item.trim() !== '').map((item) => item.trim());
  }

  if (typeof value === 'string') {
    return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

export function serializeContestantProfile(profile: ContestantProfileData, fallbackBio?: string): string {
  return JSON.stringify({
    __ivote_profile__: true,
    ...profile,
    bio: profile.bio ?? fallbackBio ?? '',
  });
}

export function parseContestantProfile(contestant: ContestantProfileRecord): {
  profile: ContestantProfileData;
  displayName: string;
  plainBio: string;
} {
  const fallbackBio = contestant?.bio || '';
  const baseProfile: ContestantProfileData = {
    full_name: contestant?.name || '',
    age: contestant?.age,
    gender: contestant?.gender,
    profile_image_url: contestant?.avatar_url || undefined,
    bio: fallbackBio,
  };

  if (typeof fallbackBio !== 'string' || !fallbackBio.trim()) {
    return { profile: baseProfile, displayName: contestant?.name || 'Contestant', plainBio: '' };
  }

  const trimmed = fallbackBio.trim();
  if (trimmed.startsWith('{') && trimmed.includes('__ivote_profile__')) {
    try {
      const parsed = JSON.parse(trimmed) as ContestantProfileData & { __ivote_profile__?: boolean };
      return {
        profile: {
          ...baseProfile,
          ...parsed,
          profile_image_url: parsed.profile_image_url || contestant?.avatar_url || undefined,
          gallery_images: Array.isArray(parsed.gallery_images) ? parsed.gallery_images : [],
          talents: toStringArray(parsed.talents),
          awards_and_achievements: toStringArray(parsed.awards_and_achievements),
          fun_facts: toStringArray(parsed.fun_facts),
        },
        displayName: parsed.full_name || parsed.stage_name || contestant?.name || 'Contestant',
        plainBio: parsed.bio || '',
      };
    } catch {
      // Fall back to plain text biography.
    }
  }

  return {
    profile: baseProfile,
    displayName: contestant?.name || 'Contestant',
    plainBio: fallbackBio,
  };
}

export function getContestantProfileImage(contestant: ContestantProfileRecord | null | undefined): string | undefined {
  if (!contestant) return undefined;
  const parsed = parseContestantProfile(contestant);
  return parsed.profile.profile_image_url || contestant.avatar_url || undefined;
}
