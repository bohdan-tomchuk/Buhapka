import apiClient from '../../../shared/api/base'
import type { Expense, ExpenseFilters, PaginatedExpenseResponse } from '../../../shared/types'
import type { CreateExpenseDto, UpdateExpenseDto } from '../model/store'

export async function fetchExpensesApi(filters?: ExpenseFilters): Promise<PaginatedExpenseResponse> {
  const params = new URLSearchParams()

  if (filters?.page) params.append('page', filters.page.toString())
  if (filters?.limit) params.append('limit', filters.limit.toString())
  if (filters?.dateFrom) params.append('dateFrom', filters.dateFrom)
  if (filters?.dateTo) params.append('dateTo', filters.dateTo)
  if (filters?.category) params.append('category', filters.category)
  if (filters?.source) params.append('source', filters.source)

  const queryString = params.toString()
  const url = queryString ? `/expenses?${queryString}` : '/expenses'

  return await apiClient(url, {
    method: 'GET',
  })
}

export async function createExpenseApi(expense: CreateExpenseDto, receiptFile?: File | null): Promise<Expense> {
  if (receiptFile) {
    // Create FormData for multipart upload
    const formData = new FormData()

    // Append all expense fields
    Object.entries(expense).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        formData.append(key, value.toString())
      }
    })

    // Append file
    formData.append('receipt', receiptFile)

    // Send as multipart/form-data (fetch will automatically set Content-Type with boundary)
    return await apiClient('/expenses', {
      method: 'POST',
      body: formData,
    })
  }

  // Send as JSON when no file
  return await apiClient('/expenses', {
    method: 'POST',
    body: expense,
  })
}

export async function updateExpenseApi(id: string, expense: UpdateExpenseDto): Promise<Expense> {
  return await apiClient(`/expenses/${id}`, {
    method: 'PATCH',
    body: expense,
  })
}

export async function deleteExpenseApi(id: string): Promise<void> {
  await apiClient(`/expenses/${id}`, {
    method: 'DELETE',
  })
}

export async function createChildExpenseApi(
  parentId: string,
  expense: CreateExpenseDto
): Promise<Expense> {
  return await apiClient(`/expenses/${parentId}/children`, {
    method: 'POST',
    body: expense,
  })
}

export async function getExpenseWithChildrenApi(id: string): Promise<Expense> {
  return await apiClient(`/expenses/${id}/with-children`, {
    method: 'GET',
  })
}
