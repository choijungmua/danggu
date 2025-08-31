import { create } from 'zustand';
import { supabase } from '@/lib/supabase';

export const useAuthStore = create((set, get) => ({
  user: null,
  loading: true,

  // Initialize auth state
  initialize: async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      set({ user: session?.user ?? null, loading: false });

      // Listen for auth changes
      supabase.auth.onAuthStateChange((event, session) => {
        set({ user: session?.user ?? null, loading: false });
      });
    } catch (error) {
      console.error('Auth initialization error:', error);
      set({ loading: false });
    }
  },

  // Sign in
  signIn: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  },

  // Sign up
  signUp: async (email, password) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    return { data, error };
  },

  // Sign out
  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null });
  },
}));