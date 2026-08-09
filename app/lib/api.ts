// lib/api.ts
import { supabase } from './supabaseClient';
import { User, Contestant, Category, Vote, Result, VotingLock } from './types';

// Auth functions
export const auth = {
  signUp: async (email: string, password: string, userData: any) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: userData
      }
    });
    
    if (error) throw error;
    
    // Create user record in public.users
    if (data.user) {
      await supabase.from('users').insert({
        id: data.user.id,
        email: data.user.email,
        full_name: userData.full_name,
        phone: userData.phone,
        voter_id: `MTIS-${Math.floor(Math.random() * 10000)}`,
        role: 'voter'
      });
    }
    
    return data;
  },
  
  signIn: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    if (error) throw error;
    return data;
  },
  
  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },
  
  getCurrentUser: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: userData } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();
      return userData;
    }
    return null;
  }
};

// Contestant functions
export const contestantsAPI = {
  getAll: async (gender?: 'male' | 'female') => {
    let query = supabase.from('contestants').select('*');
    if (gender) {
      query = query.eq('gender', gender);
    }
    const { data, error } = await query;
    if (error) throw error;
    return data as Contestant[];
  },
  
  getById: async (id: number) => {
    const { data, error } = await supabase
      .from('contestants')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data as Contestant;
  }
};

// Category functions
export const categoriesAPI = {
  getAll: async () => {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('id');
    if (error) throw error;
    return data as Category[];
  },
  
  getVotingLocks: async () => {
    const { data, error } = await supabase
      .from('voting_locks')
      .select('*');
    if (error) throw error;
    return data as VotingLock[];
  },
  
  updateLock: async (categoryId: string, isLocked: boolean) => {
    const { data, error } = await supabase
      .from('voting_locks')
      .upsert({
        category_id: categoryId,
        is_locked: isLocked,
        unlocked_at: isLocked ? null : new Date().toISOString(),
        locked_at: isLocked ? new Date().toISOString() : null
      })
      .select();
    if (error) throw error;
    return data;
  }
};

// Vote functions
export const votesAPI = {
  castVote: async (voteData: { contestant_id: number; category_id: string }) => {
    const user = await auth.getCurrentUser();
    if (!user) throw new Error('User not authenticated');
    
    const { data, error } = await supabase
      .from('votes')
      .insert({
        voter_id: user.id,
        contestant_id: voteData.contestant_id,
        category_id: voteData.category_id
      })
      .select();
    if (error) throw error;
    return data;
  },
  
  hasVoted: async (categoryId: string) => {
    const user = await auth.getCurrentUser();
    if (!user) return false;
    
    const { data, error } = await supabase
      .from('votes')
      .select('*')
      .eq('voter_id', user.id)
      .eq('category_id', categoryId)
      .maybeSingle();
    if (error) throw error;
    return !!data;
  },
  
  getResults: async (categoryId?: string) => {
    let query = supabase
      .from('results')
      .select('*, contestants(*)')
      .order('total_votes', { ascending: false });
    
    if (categoryId) {
      query = query.eq('category_id', categoryId);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return data;
  }
};

// Admin functions
export const adminAPI = {
  unlockCategory: async (categoryId: string) => {
    return await categoriesAPI.updateLock(categoryId, false);
  },
  
  lockCategory: async (categoryId: string) => {
    return await categoriesAPI.updateLock(categoryId, true);
  },
  
  getVotingStats: async () => {
    const { data: totalVotes, error: votesError } = await supabase
      .from('votes')
      .select('*', { count: 'exact', head: true });
    
    const { data: totalVoters, error: votersError } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });
    
    if (votesError || votersError) throw 'error';
    
    return {
      totalVotes: totalVotes || 0,
      totalVoters: totalVoters || 0
    };
  }
};