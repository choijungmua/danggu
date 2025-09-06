import { create } from 'zustand';
import { supabase } from '@/lib/supabase';

export const useAuthStore = create((set, get) => ({
  user: null,
  loading: true,
  authListener: null,

  // Initialize auth state (쿠키에서 사용자 정보 확인)
  initialize: async () => {
    try {
      const response = await fetch('/api/auth/me');
      const result = await response.json();
      
      set({ user: result.user || null, loading: false });
      
      // Set up auth state listener (only if not already set)
      const currentState = get();
      if (!currentState.authListener) {
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
          
          if (event === 'SIGNED_OUT' || !session) {
            set({ user: null });
          } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
            set({ user: session.user });
          }
        });
        
        set({ authListener: subscription });
      }
    } catch (error) {
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

  // Sign in (API 라우트 사용)
  signIn: async (email, password) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        return { data: null, error: { message: result.error } };
      }
      
      // 성공 시 사용자 정보 업데이트
      set({ user: result.user });
      
      // 로그인 성공 후 해당 사용자의 s_user 테이블 상태를 'entrance'로 변경
      try {
        await fetch('/api/users/update-status', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            userId: result.user.id,
            status: 'entrance'
          }),
        });
      } catch (statusError) {
      }
      
      return { data: { user: result.user }, error: null };
    } catch (error) {
      return { data: null, error: { message: error.message } };
    }
  },

  // Sign up (API 라우트 사용)
  signUp: async (email, password) => {
    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        return { data: null, error: { message: result.error } };
      }
      
      return { data: result.data, error: null };
    } catch (error) {
      return { data: null, error: { message: error.message } };
    }
  },

  // Sign out (API 라우트 사용)
  signOut: async () => {
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
      });
      
      // API 응답과 상관없이 클라이언트 상태는 초기화
      set({ user: null });
      
      if (!response.ok) {
      }
    } catch (error) {
      // 에러가 발생해도 클라이언트 상태는 초기화
      set({ user: null });
    }
  },
}));