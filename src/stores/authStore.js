import { create } from 'zustand';
import { supabase } from '@/lib/supabase';

export const useAuthStore = create((set, get) => ({
  user: null,
  loading: true,
  authListener: null,

  // Initialize auth state
  initialize: async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Session error:', error);
        set({ user: null, loading: false });
        return;
      }

      set({ user: session?.user ?? null, loading: false });

      // Set up auth state listener (only if not already set)
      const currentState = get();
      if (!currentState.authListener) {
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
          console.log('Auth state changed:', event, session?.user?.email);
          
          if (event === 'SIGNED_OUT' || !session) {
            set({ user: null });
          } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
            set({ user: session.user });
          }
        });
        
        set({ authListener: subscription });
      }
    } catch (error) {
      console.error('Auth initialization error:', error);
      set({ user: null, loading: false });
    }
  },

  // Clean up auth listener
  cleanup: () => {
    const { authListener } = get();
    if (authListener) {
      authListener.unsubscribe();
      set({ authListener: null });
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
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Sign out error:', error);
    }
    set({ user: null });
  },
}));