/**
 * User Store
 *
 * Manages user authentication state.
 * Uses cookie-based authentication (no manual token management).
 */

import { defineStore } from 'pinia';
import type { LoginCredentials } from '../../../shared/types';
import { loginApi, logoutApi, checkAuthApi } from '../api';

interface UserState {
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

export const useUserStore = defineStore('user', {
  state: (): UserState => ({
    isAuthenticated: false,
    loading: false,
    error: null,
  }),

  getters: {
    isLoggedIn: (state) => state.isAuthenticated,
  },

  actions: {
    /**
     * Login user with credentials
     * Backend sets httpOnly cookies
     */
    async login(credentials: LoginCredentials) {
      this.loading = true;
      this.error = null;
      try {
        await loginApi(credentials);
        this.isAuthenticated = true;
      } catch (error: any) {
        this.error = error.message || 'Login failed';
        throw error;
      } finally {
        this.loading = false;
      }
    },

    /**
     * Logout user
     * Backend clears httpOnly cookies
     */
    async logout() {
      this.loading = true;
      this.error = null;
      try {
        await logoutApi();
        this.isAuthenticated = false;
      } catch (error: any) {
        this.error = error.message || 'Logout failed';
        throw error;
      } finally {
        this.loading = false;
      }
    },

    /**
     * Check authentication status
     * Verifies cookies are valid
     */
    async checkAuth() {
      this.loading = true;
      this.error = null;
      try {
        const isAuthenticated = await checkAuthApi();
        this.isAuthenticated = isAuthenticated;
      } catch (error: any) {
        this.isAuthenticated = false;
        this.error = error.message || 'Authentication check failed';
      } finally {
        this.loading = false;
      }
    },
  },
});
