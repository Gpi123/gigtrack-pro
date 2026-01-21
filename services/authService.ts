import { supabase } from './supabase';
import { User } from '@supabase/supabase-js';

export interface UserProfile {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
}

// Helper function to check if supabase is initialized
const checkSupabase = () => {
  if (!supabase) {
    throw new Error('Supabase não está configurado. Por favor, configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY nas variáveis de ambiente.');
  }
  return supabase;
};

export const authService = {
  // Sign in with Google
  signInWithGoogle: async () => {
    const client = checkSupabase();
    // Use current origin (works for both localhost and production)
    // Remove hash/fragment to avoid issues
    const redirectTo = window.location.origin + window.location.pathname;
    
    const { data, error } = await client.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectTo,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        }
      }
    });
    
    if (error) throw error;
    return data;
  },

  // Sign out
  signOut: async () => {
    const client = checkSupabase();
    const { error } = await client.auth.signOut();
    if (error) throw error;
  },

  // Get current user
  getCurrentUser: async (): Promise<User | null> => {
    if (!supabase) return null;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  },

  // Get user profile
  getUserProfile: async (userId: string): Promise<UserProfile | null> => {
    if (!supabase) return null;
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error fetching profile:', error);
      return null;
    }
  },

  // Update user profile
  updateProfile: async (updates: Partial<UserProfile>) => {
    const client = checkSupabase();
    const { data: { user } } = await client.auth.getUser();
    if (!user) throw new Error('No user logged in');

    const { data, error } = await client
      .from('profiles')
      .update(updates)
      .eq('id', user.id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Listen to auth state changes
  onAuthStateChange: (callback: (user: User | null) => void) => {
    if (!supabase) {
      // Return a mock subscription if supabase is not initialized
      return {
        data: {
          subscription: {
            unsubscribe: () => {}
          }
        }
      } as any;
    }
    return supabase.auth.onAuthStateChange((event, session) => {
      callback(session?.user ?? null);
    });
  }
};
