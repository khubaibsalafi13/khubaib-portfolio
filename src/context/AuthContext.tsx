import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { AdminUser } from '../types';
import { authService } from '../services/authService';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

interface AuthContextType {
  user: AdminUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AdminUser | null>(() => authService.getCurrentUser());
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Hydrate authentication on initial mount or page refresh
  const refreshSession = useCallback(async () => {
    try {
      const restored = await authService.restoreSession();
      setUser(restored);
    } catch (err) {
      console.warn('Error during session restoration:', err);
      setUser(authService.getCurrentUser());
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    // Run initial restoration
    refreshSession();

    // Setup Supabase live auth state listener if configured
    let subscription: { unsubscribe: () => void } | null = null;
    if (isSupabaseConfigured()) {
      try {
        const { data } = supabase.auth.onAuthStateChange(async (event, session) => {
          if (!isMounted) return;
          if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
            if (session?.user) {
              const activeUser: AdminUser = {
                username: session.user.email || 'admin',
                isAuthenticated: true,
                token: session.access_token,
              };
              setUser(activeUser);
            }
          } else if (event === 'SIGNED_OUT') {
            setUser(null);
          }
        });
        subscription = data.subscription;
      } catch (err) {
        console.warn('Could not attach Supabase auth state change listener:', err);
      }
    }

    return () => {
      isMounted = false;
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [refreshSession]);

  const login = async (username: string, pass: string) => {
    setIsLoading(true);
    try {
      const res = await authService.login(username, pass);
      if (res.success) {
        setUser(authService.getCurrentUser());
      }
      return res;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await authService.logout();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: Boolean(user && user.isAuthenticated),
        isLoading,
        login,
        logout,
        refreshSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
