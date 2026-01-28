/**
 * User & Auth API
 *
 * API functions for authentication operations.
 * Uses cookie-based authentication (httpOnly tokens managed by backend).
 */

import useApi from '../../../shared/api/base';
import type { LoginCredentials } from '../../../shared/types';

/**
 * Login user with credentials
 * Backend sets httpOnly cookies for access_token and refresh_token
 */
export async function loginApi(credentials: LoginCredentials): Promise<{ message: string }> {
  const api = useApi();
  return await api.request<{ message: string }>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email: credentials.email,
      password: credentials.password,
    }),
  });
}

/**
 * Logout user
 * Backend clears httpOnly cookies
 */
export async function logoutApi(): Promise<{ message: string }> {
  const api = useApi();
  return await api.request<{ message: string }>('/api/auth/logout', {
    method: 'POST',
  });
}

/**
 * Refresh access token
 * Uses httpOnly refresh_token cookie automatically
 * Backend sets new access_token cookie
 */
export async function refreshApi(): Promise<{ message: string }> {
  const api = useApi();
  return await api.request<{ message: string }>('/api/auth/refresh', {
    method: 'POST',
  });
}

/**
 * Check if user is authenticated
 * Makes a test request to a protected endpoint to verify cookies are valid
 */
export async function checkAuthApi(): Promise<boolean> {
  try {
    const api = useApi();
    // Make a HEAD request to expenses endpoint (protected route)
    // This will trigger token refresh if needed
    await api.request('/api/expenses', {
      method: 'HEAD',
    });
    return true;
  } catch (error) {
    return false;
  }
}
