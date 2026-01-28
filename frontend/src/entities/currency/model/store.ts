import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { ExchangeRate, Currency } from '../../../shared/types'
import { getRateForDate as getRateForDateApi } from '../api'

export const useCurrencyStore = defineStore('currency', () => {
  // State - using Map for cache with key format: `${currency}_${date}`
  const ratesCache = ref<Map<string, ExchangeRate>>(new Map())
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Helper to generate cache key
  function getCacheKey(currency: Currency, date: string): string {
    return `${currency}_${date}`
  }

  // Actions
  async function getRateForDate(currency: Currency, date: string): Promise<ExchangeRate> {
    const cacheKey = getCacheKey(currency, date)

    // Check cache first
    if (ratesCache.value.has(cacheKey)) {
      return ratesCache.value.get(cacheKey)!
    }

    // Fetch from API if not cached
    loading.value = true
    error.value = null
    try {
      const rate = await getRateForDateApi(currency, date)
      // Store in cache
      ratesCache.value.set(cacheKey, rate)
      return rate
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch exchange rate'
      throw err
    } finally {
      loading.value = false
    }
  }

  // Optional: Clear cache if needed
  function clearCache() {
    ratesCache.value.clear()
  }

  return {
    // State
    ratesCache,
    loading,
    error,
    // Actions
    getRateForDate,
    clearCache,
  }
})
