/**
 * API Client
 *
 * Composable-based HTTP client with:
 * - Cookie-based authentication (httpOnly tokens)
 * - Automatic body serialization (JSON + FormData)
 * - Request/response/error interceptors
 * - Token refresh queue (prevents race conditions)
 * - Type-safe request methods
 * - Toast notification integration
 */

import type { RequestConfig } from './types';
import {
  requestInterceptor,
  responseInterceptor,
  errorInterceptor,
} from './interceptors';
import RefreshQueue from './refresh-queue';

/**
 * Create API client factory
 */
export const createApiClient = () => {
  const config = useRuntimeConfig();
  const baseURL = config.public.apiBaseUrl as string;
  const refreshQueue = RefreshQueue.getInstance();

  /**
   * Core request method with interceptor pipeline
   *
   * @param url Request URL (relative to baseURL)
   * @param config Request configuration
   * @returns Promise with response data
   */
  const request = async <T = any>(
    url: string,
    config: RequestConfig = {}
  ): Promise<T> => {
    try {
      // Apply request interceptor
      const { url: finalUrl, config: requestInit } = await requestInterceptor(
        `${baseURL}${url}`,
        config
      );

      // Make request
      const response = await fetch(finalUrl, requestInit);

      // Handle 401 (Unauthorized) - token refresh
      if (response.status === 401) {
        // If already refreshing, queue this request
        if (refreshQueue.getIsRefreshing()) {
          return await refreshQueue.add(url, config);
        }

        // Start refresh process
        return await refreshQueue.processQueue(
          async () => {
            // Call backend refresh endpoint (uses httpOnly refresh token cookie)
            const refreshResponse = await fetch(`${baseURL}/api/auth/refresh`, {
              method: 'POST',
              credentials: 'include',
            });

            if (!refreshResponse.ok) {
              // Refresh failed - redirect to login
              if (import.meta.client) {
                refreshQueue.clear();
                window.location.href = '/login';
              }
              throw new Error('Token refresh failed');
            }
          },
          (retryUrl, retryConfig) => request<T>(retryUrl, retryConfig)
        );
      }

      // Handle non-2xx responses
      if (!response.ok) {
        const errorResponse = {
          response: {
            status: response.status,
            statusText: response.statusText,
            data: await response.json().catch(() => ({})),
          },
        };
        throw errorResponse;
      }

      // Inject response type for interceptor
      (response as any)._responseType = config.responseType;

      // Apply response interceptor
      const apiResponse = await responseInterceptor(response);

      return apiResponse.data as T;
    } catch (error: any) {
      // Apply error interceptor
      const apiError = errorInterceptor(error);

      // Show toast notification (unless disabled)
      if (!config.skipErrorToast && import.meta.client) {
        // Dynamic import to avoid SSR issues
        const { useToast } = await import('../ui/toast');
        const toast = useToast();
        toast.error(config.customErrorMessage || apiError.message);
      }

      throw apiError;
    }
  };

  /**
   * GET request
   */
  const get = <T = any>(url: string, config?: RequestConfig): Promise<T> => {
    return request<T>(url, { ...config, method: 'GET' });
  };

  /**
   * POST request
   */
  const post = <T = any>(
    url: string,
    body?: any,
    config?: RequestConfig
  ): Promise<T> => {
    return request<T>(url, { ...config, method: 'POST', body });
  };

  /**
   * PATCH request
   */
  const patch = <T = any>(
    url: string,
    body?: any,
    config?: RequestConfig
  ): Promise<T> => {
    return request<T>(url, { ...config, method: 'PATCH', body });
  };

  /**
   * PUT request
   */
  const put = <T = any>(
    url: string,
    body?: any,
    config?: RequestConfig
  ): Promise<T> => {
    return request<T>(url, { ...config, method: 'PUT', body });
  };

  /**
   * DELETE request
   */
  const del = <T = any>(url: string, config?: RequestConfig): Promise<T> => {
    return request<T>(url, { ...config, method: 'DELETE' });
  };

  return {
    request,
    get,
    post,
    patch,
    put,
    delete: del,
  };
};

/**
 * Composable for accessing API client
 *
 * Usage:
 * ```ts
 * const api = useApi();
 * const data = await api.get('/api/expenses');
 * ```
 */
export const useApi = () => {
  const nuxtApp = useNuxtApp();

  if (!nuxtApp.$api) {
    nuxtApp.$api = createApiClient();
  }

  return nuxtApp.$api;
};

/**
 * Default export for backward compatibility
 */
export default useApi;
