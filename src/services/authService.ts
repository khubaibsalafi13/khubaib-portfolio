import { AdminUser } from '../types';
import { getItem, setItem, removeItem } from './storage';

/**
 * NOTE: This prototype authentication uses client-side simulated state.
 * This prototype authentication must be replaced with Supabase Auth before production.
 */

const AUTH_KEY = 'ks_admin_auth_user';

export const authService = {
  getCurrentUser(): AdminUser | null {
    return getItem<AdminUser | null>(AUTH_KEY, null);
  },

  isAuthenticated(): boolean {
    const user = this.getCurrentUser();
    return Boolean(user && user.isAuthenticated);
  },

  login(username: string, pass: string): Promise<{ success: boolean; error?: string }> {
    // Prototype check: accepts standard admin credentials or demo access
    // Will be swapped with supabase.auth.signInWithPassword({ email, password })
    return new Promise((resolve) => {
      setTimeout(() => {
        const trimmedUser = username.trim().toLowerCase();
        // Allow login with admin or owner email
        if (
          (trimmedUser === 'admin' || trimmedUser === 'khubaib' || trimmedUser.includes('@')) &&
          pass.length >= 4
        ) {
          const user: AdminUser = {
            username: trimmedUser,
            isAuthenticated: true,
            token: 'proto-jwt-' + Date.now(),
          };
          setItem(AUTH_KEY, user);
          resolve({ success: true });
        } else {
          resolve({
            success: false,
            error: 'Invalid credentials. For prototype access, use username "admin" and password (min 4 chars).',
          });
        }
      }, 300);
    });
  },

  logout(): void {
    removeItem(AUTH_KEY);
  },
};
