// lib/types.ts
export interface User {
  id: string;
  email: string;
  full_name: string;
  phone: string;
  voter_id: string;
  role: 'admin' | 'voter';
  is_verified: boolean;
  created_at: string;
}

export type Division = 'senior' | 'junior' | 'primary';
export type Gender = 'male' | 'female';

export interface Contestant {
  id: number;
  name: string;
  gender: Gender;
  division: Division;
  category: 'Runway' | 'Talent Showcase';
  signature_style: string;
  age: number;
  hometown: string;
  talent: string;
  representing: string;
  bio: string;
  achievements: string[];
  avatar_url?: string;
}

// Maps a contestant's (division, gender) to the pageant title they're
// competing for. Senior = Mr./Miss MTIS, Junior = Prince/Princess MTIS,
// Primary = Little Star Prince/Princess.
export function pageantTitle(division: Division, gender: Gender): string {
  if (division === 'senior') return gender === 'male' ? 'Mr. MTIS' : 'Miss MTIS';
  if (division === 'junior') return gender === 'male' ? 'Prince MTIS' : 'Princess MTIS';
  return gender === 'male' ? 'Little Star Prince' : 'Little Star Princess';
}

export interface Category {
  id: string;
  name: string;
  description: string;
  icon: string;
  gender: 'male' | 'female' | 'both';
  is_active: boolean;
  voting_start_date?: string;
  voting_end_date?: string;
}

export interface Vote {
  id: string;
  voter_id: string;
  contestant_id: number;
  category_id: string;
  gender?: Gender;
  division?: Division;
  vote_timestamp: string;
  is_valid: boolean;
}

export interface Result {
  id: number;
  category_id: string;
  contestant_id: number;
  total_votes: number;
  vote_percentage: number;
  rank: number;
  is_winner: boolean;
}

export interface VotingLock {
  id: number;
  category_id: string;
  gender: Gender;
  division: Division;
  is_locked: boolean;
  locked_at?: string;
  unlocked_at?: string;
}

// A single editable CMS field, as stored in the `site_content` table.
export interface SiteContentField {
  id: string;
  section: string;
  label: string;
  value: string;
  updated_at?: string;
}

// Flat key -> value map, as consumed by the frontend after fetching
// /api/site-content.
export type SiteContentMap = Record<string, string>;
