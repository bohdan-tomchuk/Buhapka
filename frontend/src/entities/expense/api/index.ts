/**
 * Expense API
 *
 * API functions for expense CRUD operations and filtering.
 */

import useApi from '../../../shared/api/base';
import type { Expense, ExpenseFilters, PaginatedExpenseResponse } from '../../../shared/types';
import type { CreateExpenseDto, UpdateExpenseDto } from '../model/store';

/**
 * Fetch expenses with optional filters
 */
export async function fetchExpensesApi(filters?: ExpenseFilters): Promise<PaginatedExpenseResponse> {
  const api = useApi();
  const params = new URLSearchParams();

  if (filters?.page) params.append('page', filters.page.toString());
  if (filters?.limit) params.append('limit', filters.limit.toString());
  if (filters?.dateFrom) params.append('dateFrom', filters.dateFrom);
  if (filters?.dateTo) params.append('dateTo', filters.dateTo);
  if (filters?.category) params.append('category', filters.category);
  if (filters?.source) params.append('source', filters.source);

  const queryString = params.toString();
  const url = queryString ? `/api/expenses?${queryString}` : '/api/expenses';

  return await api.request<PaginatedExpenseResponse>(`/api/expenses?${queryString}`);
}

/**
 * Create new expense with optional receipt file
 */
export async function createExpenseApi(expense: CreateExpenseDto, receiptFile?: File | null): Promise<Expense> {
  const api = useApi();

  if (receiptFile) {
    // Create FormData for multipart upload
    const formData = new FormData();

    // Append all expense fields
    Object.entries(expense).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        formData.append(key, value.toString());
      }
    });

    // Append file
    formData.append('receipt', receiptFile);

    // Send as multipart/form-data (browser sets Content-Type with boundary automatically)
    return await api.request<Expense>('/api/expenses', {
      method: 'POST',
      body: formData,
    });
  }

  // Send as JSON when no file
  return await api.request<Expense>('/api/expenses', {
    method: 'POST',
    body: JSON.stringify(expense),
  });
}

/**
 * Update existing expense
 */
export async function updateExpenseApi(id: string, expense: UpdateExpenseDto): Promise<Expense> {
  const api = useApi();
  return await api.request<Expense>(`/api/expenses/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(expense),
  });
}

/**
 * Delete expense by ID
 */
export async function deleteExpenseApi(id: string): Promise<void> {
  const api = useApi();
  await api.request<void>(`/api/expenses/${id}`, {
    method: 'DELETE',
  });
}

/**
 * Create child expense under a parent
 */
export async function createChildExpenseApi(
  parentId: string,
  expense: CreateExpenseDto
): Promise<Expense> {
  const api = useApi();
  return await api.request<Expense>(`/api/expenses/${parentId}/children`, {
    method: 'POST',
    body: JSON.stringify(expense),
  });
}

/**
 * Get expense with all its children
 */
export async function getExpenseWithChildrenApi(id: string): Promise<Expense> {
  const api = useApi();
  return await api.request<Expense>(`/api/expenses/${id}/with-children`, {
  });
}
