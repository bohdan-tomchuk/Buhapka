/**
 * Report API
 *
 * API functions for generating expense reports (PDF).
 */

import useApi from '../../../shared/api/base';

export interface GenerateReportParams {
  dateFrom: string;
  dateTo: string;
}

/**
 * Generate PDF report for expenses in date range
 * Returns a Blob that can be downloaded
 */
export async function generatePDF(params: GenerateReportParams): Promise<Blob> {
  const api = useApi();

  return await api.request<Blob>('/api/reports/pdf', {
    method: 'POST',
    body: JSON.stringify({
      dateFrom: params.dateFrom,
      dateTo: params.dateTo,
    }),
  });
}
