/**
 * Authentication Middleware
 *
 * Protects routes by checking authentication status.
 * Uses cookie-based authentication - checks with backend on first access.
 */

export default defineNuxtRouteMiddleware(async () => {
  const userStore = useUserStore();

  // If not authenticated in store, check with backend
  // This triggers token refresh if access token expired
  if (!userStore.isAuthenticated) {
    await userStore.checkAuth();
  }

  // If still not authenticated after check, redirect to login
  if (!userStore.isAuthenticated) {
    return navigateTo('/login');
  }

  return;
});
