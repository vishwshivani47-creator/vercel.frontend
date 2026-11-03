'use client';

import { useState, useEffect, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { User } from '@/types/auth.types';
import { authStorage, AUTH_CHANGE_EVENT } from '@/lib/auth';
import { authService } from '@/services/auth.service';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const pathname = usePathname();

  const syncFromStorage = useCallback(() => {
    const isAuthed = authStorage.isAuthenticated();
    setIsAuthenticated(isAuthed);
    if (isAuthed) {
      const cached = authStorage.getUser();
      setUser(cached);
    } else {
      setUser(null);
    }
  }, []);

  const refreshUser = useCallback(async () => {
    if (!authStorage.isAuthenticated()) {
      setUser(null);
      setIsAuthenticated(false);
      setIsLoading(false);
      return;
    }

    try {
      syncFromStorage();
      const fresh = await authService.getMe();
      setUser(fresh);
      authStorage.setUser(fresh);
      setIsAuthenticated(true);
    } catch {
      // If getMe fails because token is invalid/expired and cannot be refreshed
      if (!authStorage.isAuthenticated()) {
        setUser(null);
        setIsAuthenticated(false);
      }
    } finally {
      setIsLoading(false);
    }
  }, [syncFromStorage]);

  useEffect(() => {
    // Initial sync
    syncFromStorage();
    refreshUser();

    const handleAuthChange = () => {
      syncFromStorage();
    };

    const handleAuthExpired = () => {
      authStorage.clearTokens();
      setUser(null);
      setIsAuthenticated(false);
    };

    window.addEventListener(AUTH_CHANGE_EVENT, handleAuthChange);
    window.addEventListener('storage', handleAuthChange);
    window.addEventListener('humorphic-auth-expired', handleAuthExpired);

    return () => {
      window.removeEventListener(AUTH_CHANGE_EVENT, handleAuthChange);
      window.removeEventListener('storage', handleAuthChange);
      window.removeEventListener('humorphic-auth-expired', handleAuthExpired);
    };
  }, [syncFromStorage, refreshUser]);

  // Sync state whenever route/pathname changes
  useEffect(() => {
    syncFromStorage();
  }, [pathname, syncFromStorage]);

  const logout = async () => {
    try {
      await authService.logout();
    } finally {
      authStorage.clearTokens();
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  return {
    user,
    isLoading,
    isAuthenticated,
    refreshUser,
    logout,
  };
}
