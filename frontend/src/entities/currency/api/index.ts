/**
 * Currency & Exchange Rate API
 *
 * API functions for fetching exchange rates.
 */

import useApi from '../../../shared/api/base';
import type { ExchangeRate, Currency } from '../../../shared/types';

/**
 * Get exchange rate for a specific currency and date
 */
export async function getRateForDate(currency: Currency, date: string): Promise<ExchangeRate> {
  const api = useApi();
  return await api.request<ExchangeRate>(`/api/exchange-rates`, {
    method: 'GET',
    params: {
        currency: currency.toString(),
        date: new Date(date).toISOString(),
      },
    } as unknown as RequestInit,
  );
}
