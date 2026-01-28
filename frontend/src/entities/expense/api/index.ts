/**
 * Expense API
 *
 * API functions for expense CRUD operations and filtering.
 */

import { useApi } from '../../../shared/api/base';
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

  return await api.get<PaginatedExpenseResponse>(url);
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
    return await api.post<Expense>('/api/expenses', formData);
  }

  // Send as JSON when no file
  return await api.post<Expense>('/api/expenses', expense);
}

/**
 * Update existing expense
 */
export async function updateExpenseApi(id: string, expense: UpdateExpenseDto): Promise<Expense> {
  const api = useApi();
  return await api.patch<Expense>(`/api/expenses/${id}`, expense);
}

/**
 * Delete expense by ID
 */
export async function deleteExpenseApi(id: string): Promise<void> {
  const api = useApi();
  await api.delete<void>(`/api/expenses/${id}`);
}

/**
 * Create child expense under a parent
 */
export async function createChildExpenseApi(
  parentId: string,
  expense: CreateExpenseDto
): Promise<Expense> {
  const api = useApi();
  return await api.post<Expense>(`/api/expenses/${parentId}/children`, expense);
}

/**
 * Get expense with all its children
 */
export async function getExpenseWithChildrenApi(id: string): Promise<Expense> {
  const api = useApi();
  return await api.get<Expense>(`/api/expenses/${id}/with-children`);
}
