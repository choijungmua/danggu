"use client";

import { useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';

export default function AuthInitializer() {
  const initialize = useAuthStore(state => state.initialize);
  const cleanup = useAuthStore(state => state.cleanup);

  useEffect(() => {
    initialize();

    // Cleanup on unmount
    return () => {
      cleanup();
    };
  }, [initialize, cleanup]);

  return null;
}