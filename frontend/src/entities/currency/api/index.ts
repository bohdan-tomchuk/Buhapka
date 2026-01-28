/**
 * Currency & Exchange Rate API
 *
 * API functions for fetching exchange rates.
 */

import { useApi } from '../../../shared/api/base';
import type { ExchangeRate, Currency } from '../../../shared/types';

/**
 * Get exchange rate for a specific currency and date
 */
export async function getRateForDate(currency: Currency, date: string): Promise<ExchangeRate> {
  const api = useApi();
  const params = new URLSearchParams();
  params.append('currency', currency);
  params.append('date', date);

  return await api.get<ExchangeRate>(`/api/exchange-rates?${params.toString()}`);
}
