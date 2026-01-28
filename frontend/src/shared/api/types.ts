/**
 * API Client Type Definitions
 *
 * Type-safe interfaces for the API client infrastructure.
 */

/**
 * Extended request configuration
 */
export interface RequestConfig extends Omit<RequestInit, 'body'> {
  /** Request body - will be automatically serialized */
  body?: any;
  /** Response type to parse */
  responseType?: 'json' | 'blob' | 'text' | 'arrayBuffer';
  /** Skip error toast notification */
  skipErrorToast?: boolean;
  /** Custom error message for toast */
  customErrorMessage?: string;
}

/**
 * API response wrapper with metadata
 */
export interface ApiResponse<T = any> {
  /** Response data */
  data: T;
  /** HTTP status code */
  status: number;
  /** Status text */
  statusText: string;
  /** Response headers */
  headers: Headers;
}

/**
 * Enhanced API error with context
 */
export interface ApiError extends Error {
  /** HTTP status code */
  status?: number;
  /** Status text */
  statusText?: string;
  /** Response data if available */
  data?: any;
  /** Original error */
  cause?: Error;
  /** Error code for programmatic handling */
  code?: string;
}

/**
 * Queued request for token refresh scenarios
 */
export interface QueuedRequest {
  /** Request URL */
  url: string;
  /** Request configuration */
  config: RequestConfig;
  /** Promise resolve function */
  resolve: (value: any) => void;
  /** Promise reject function */
  reject: (reason?: any) => void;
}

/**
 * Interceptor function types
 */
export type RequestInterceptor = (url: string, config: RequestConfig) => Promise<{ url: string; config: RequestInit }>;
export type ResponseInterceptor = (response: Response) => Promise<ApiResponse>;
export type ErrorInterceptor = (error: any) => ApiError;
