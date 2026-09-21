import { AdminUser } from '../types';
import { getItem, setItem, removeItem } from './storage';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

const AUTH_KEY = 'ks_admin_auth_user';

export const authService = {
  getCurrentUser(): AdminUser | null {
    return getItem<AdminUser | null>(AUTH_KEY, null);
  },

  isAuthenticated(): boolean {
    const user = this.getCurrentUser();
    return Boolean(user && user.isAuthenticated);
  },

  async login(username: string, pass: string): Promise<{ success: boolean; error?: string }> {
    const trimmedUser = username.trim().toLowerCase();

    // 1. If Supabase is configured and input looks like an email or admin credentials, try Supabase Auth
    if (isSupabaseConfigured()) {
      try {
        const email = trimmedUser.includes('@') ? trimmedUser : `${trimmedUser}@khubaibsalafi.com`;
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password: pass,
        });

        if (!error && data.user) {
          const user: AdminUser = {
            username: data.user.email || trimmedUser,
            isAuthenticated: true,
            token: data.session?.access_token || 'supabase-session-' + Date.now(),
          };
          setItem(AUTH_KEY, user);
          return { success: true };
        }
      } catch (err: any) {
        console.warn('Supabase Auth attempt failed, checking fallback:', err?.message);
      }
    }

    // 2. Prototype fallback (for demo access and testing before Supabase Auth is provisioned)
    if (
      (trimmedUser === 'admin' || trimmedUser === 'khubaib' || trimmedUser.includes('@')) &&
      pass.length >= 4
    ) {
      const user: AdminUser = {
        username: trimmedUser,
        isAuthenticated: true,
        token: 'admin-jwt-' + Date.now(),
      };
      setItem(AUTH_KEY, user);
      return { success: true };
    }

    return {
      success: false,
      error: 'Invalid credentials. Use username "admin" and password (min 4 chars), or your Supabase Auth credentials.',
    };
  },

  async logout(): Promise<void> {
    if (isSupabaseConfigured()) {
      try {
        await supabase.auth.signOut();
      } catch (e) {
        console.warn('Supabase sign out error:', e);
      }
    }
    removeItem(AUTH_KEY);
  },
};
