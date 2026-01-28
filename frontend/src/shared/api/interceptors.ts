/**
 * API Client Interceptors
 *
 * Request, response, and error interceptors for the API client.
 */

import type {
  RequestConfig,
  RequestInterceptor,
  ResponseInterceptor,
  ErrorInterceptor,
  ApiResponse,
  ApiError,
} from './types';

/**
 * Request interceptor: prepares request before sending
 *
 * - Serializes body (JSON vs FormData)
 * - Sets appropriate headers
 * - Adds credentials for cookie-based auth
 */
export const requestInterceptor: RequestInterceptor = async (url, config) => {
  const requestInit: RequestInit = {
    ...config,
    credentials: 'include', // Enable cookie-based authentication
  };

  // Handle body serialization
  if (config.body !== undefined) {
    // FormData: browser sets Content-Type with boundary automatically
    if (config.body instanceof FormData) {
      requestInit.body = config.body;
      // Don't set Content-Type - browser will add multipart boundary
    }
    // Object/Array: serialize to JSON
    else if (typeof config.body === 'object') {
      requestInit.body = JSON.stringify(config.body);
      requestInit.headers = {
        'Content-Type': 'application/json',
        ...config.headers,
      };
    }
    // Primitive or already serialized: use as-is
    else {
      requestInit.body = config.body;
      requestInit.headers = config.headers;
    }
  } else {
    requestInit.headers = config.headers;
  }

  return { url, config: requestInit };
};

/**
 * Response interceptor: parses response based on type
 *
 * - Handles json/blob/text/arrayBuffer response types
 * - Wraps response with metadata
 * - Throws on non-2xx status codes
 */
export const responseInterceptor: ResponseInterceptor = async (response) => {
  // Extract response type from config or infer from Content-Type
  const contentType = response.headers.get('content-type') || '';

  // Determine how to parse the response
  let data: any;
  const responseType = (response as any)._responseType; // Injected by request method

  if (responseType === 'blob' || contentType.includes('application/pdf')) {
    data = await response.blob();
  } else if (responseType === 'arrayBuffer') {
    data = await response.arrayBuffer();
  } else if (responseType === 'text') {
    data = await response.text();
  } else if (contentType.includes('application/json')) {
    data = await response.json();
  } else {
    // Default to text for unknown types
    data = await response.text();
  }

  return {
    data,
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
  };
};

/**
 * Error interceptor: extracts error message and context
 *
 * - Provides status-specific error messages
 * - Extracts backend error messages if available
 * - Adds detailed context for debugging
 */
export const errorInterceptor: ErrorInterceptor = (error: any): ApiError => {
  // Network error (no response)
  if (!error.response && error.message) {
    const apiError: ApiError = new Error(
      'Network error. Please check your internet connection.'
    ) as ApiError;
    apiError.code = 'NETWORK_ERROR';
    apiError.cause = error;
    return apiError;
  }

  // HTTP error (non-2xx response)
  const status = error.response?.status;
  const data = error.response?.data;

  // Extract error message from backend response
  let message = 'An unexpected error occurred';

  if (data) {
    // NestJS validation error format
    if (data.message) {
      if (Array.isArray(data.message)) {
        message = data.message.join(', ');
      } else {
        message = data.message;
      }
    }
    // Generic error object
    else if (data.error) {
      message = data.error;
    }
  }

  // Status-specific default messages
  if (!data?.message && !data?.error) {
    switch (status) {
      case 400:
        message = 'Invalid request. Please check your input.';
        break;
      case 401:
        message = 'Authentication required. Please log in.';
        break;
      case 403:
        message = 'You do not have permission to perform this action.';
        break;
      case 404:
        message = 'The requested resource was not found.';
        break;
      case 422:
        message = 'Validation failed. Please check your input.';
        break;
      case 500:
        message = 'Server error. Please try again later.';
        break;
      case 503:
        message = 'Service temporarily unavailable. Please try again later.';
        break;
    }
  }

  const apiError: ApiError = new Error(message) as ApiError;
  apiError.status = status;
  apiError.statusText = error.response?.statusText;
  apiError.data = data;
  apiError.cause = error;
  apiError.code = `HTTP_${status}`;

  return apiError;
};
