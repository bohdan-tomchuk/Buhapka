/**
 * Token Refresh Queue Manager
 *
 * Prevents race conditions when multiple requests receive 401 simultaneously.
 * Queues requests during token refresh and retries them after refresh completes.
 */

import type { QueuedRequest, RequestConfig } from './types';

/**
 * Singleton queue manager for token refresh scenarios
 */
class RefreshQueue {
  private static instance: RefreshQueue;
  private queue: QueuedRequest[] = [];
  private isRefreshing = false;

  private constructor() {}

  /**
   * Get singleton instance
   */
  static getInstance(): RefreshQueue {
    if (!RefreshQueue.instance) {
      RefreshQueue.instance = new RefreshQueue();
    }
    return RefreshQueue.instance;
  }

  /**
   * Check if currently refreshing
   */
  getIsRefreshing(): boolean {
    return this.isRefreshing;
  }

  /**
   * Add request to queue
   *
   * @param url Request URL
   * @param config Request configuration
   * @returns Promise that resolves when request is retried
   */
  add(url: string, config: RequestConfig): Promise<any> {
    return new Promise((resolve, reject) => {
      this.queue.push({ url, config, resolve, reject });
    });
  }

  /**
   * Process queued requests after token refresh
   *
   * @param refreshFn Function to perform token refresh
   * @param retryFn Function to retry a request
   */
  async processQueue(
    refreshFn: () => Promise<void>,
    retryFn: (url: string, config: RequestConfig) => Promise<any>
  ): Promise<void> {
    if (this.isRefreshing) {
      return;
    }

    this.isRefreshing = true;

    try {
      // Perform token refresh
      await refreshFn();

      // Retry all queued requests
      const requests = [...this.queue];
      this.queue = [];

      await Promise.all(
        requests.map(async ({ url, config, resolve, reject }) => {
          try {
            const result = await retryFn(url, config);
            resolve(result);
          } catch (error) {
            reject(error);
          }
        })
      );
    } catch (error) {
      // Refresh failed - reject all queued requests
      const requests = [...this.queue];
      this.queue = [];

      requests.forEach(({ reject }) => {
        reject(error);
      });

      throw error;
    } finally {
      this.isRefreshing = false;
    }
  }

  /**
   * Clear the queue (e.g., on logout)
   */
  clear(): void {
    this.queue = [];
    this.isRefreshing = false;
  }
}

export default RefreshQueue;
