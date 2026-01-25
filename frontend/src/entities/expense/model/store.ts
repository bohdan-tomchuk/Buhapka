import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Expense, ExpenseFilters } from '../../../shared/types'
import {
  fetchExpensesApi,
  createExpenseApi,
  updateExpenseApi,
  deleteExpenseApi,
  createChildExpenseApi,
  getExpenseWithChildrenApi,
} from '../api'

export type CreateExpenseDto = Omit<Expense, 'id' | 'user_id' | 'created_at' | 'updated_at'>
export type UpdateExpenseDto = Partial<CreateExpenseDto>

export const useExpenseStore = defineStore('expense', () => {
  // State
  const expenses = ref<Expense[]>([])
  const total = ref(0)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const filters = ref<ExpenseFilters>({
    page: 1,
    limit: 20,
    dateFrom: null,
    dateTo: null,
    category: null,
    source: null,
  })

  // Getters
  const hasExpenses = computed(() => expenses.value.length > 0)
  const isEmpty = computed(() => expenses.value.length === 0 && !loading.value)
  const totalPages = computed(() => Math.ceil(total.value / (filters.value.limit || 20)))
  const expenseById = computed(() => (id: string) =>
    expenses.value.find((e) => e.id === id)
  )

  // Actions
  async function fetchExpenses() {
    loading.value = true
    error.value = null
    try {
      const response = await fetchExpensesApi(filters.value)
      expenses.value = response.data
      total.value = response.total
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch expenses'
      throw err
    } finally {
      loading.value = false
    }
  }

  function updateFilters(newFilters: Partial<ExpenseFilters>) {
    filters.value = { ...filters.value, ...newFilters }
  }

  function clearFilters() {
    filters.value = {
      page: 1,
      limit: 20,
      dateFrom: null,
      dateTo: null,
      category: null,
      source: null,
    }
  }

  async function createExpense(expense: CreateExpenseDto, receiptFile?: File | null) {
    loading.value = true
    error.value = null
    try {
      const newExpense = await createExpenseApi(expense, receiptFile)
      await fetchExpenses() // Refetch to get updated list with pagination
      return newExpense
    } catch (err: any) {
      error.value = err.message || 'Failed to create expense'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function updateExpense(id: string, expense: UpdateExpenseDto) {
    loading.value = true
    error.value = null
    try {
      const updatedExpense = await updateExpenseApi(id, expense)
      await fetchExpenses() // Refetch to get updated list
      return updatedExpense
    } catch (err: any) {
      error.value = err.message || 'Failed to update expense'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function deleteExpense(id: string) {
    loading.value = true
    error.value = null
    try {
      await deleteExpenseApi(id)
      await fetchExpenses() // Refetch to get updated list
    } catch (err: any) {
      error.value = err.message || 'Failed to delete expense'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function createChildExpense(parentId: string, expense: CreateExpenseDto) {
    loading.value = true
    error.value = null
    try {
      const newExpense = await createChildExpenseApi(parentId, expense)
      await fetchExpenses() // Refetch to get updated list with children
      return newExpense
    } catch (err: any) {
      error.value = err.message || 'Failed to create child expense'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function getExpenseWithChildren(id: string) {
    loading.value = true
    error.value = null
    try {
      return await getExpenseWithChildrenApi(id)
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch expense with children'
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    // State
    expenses,
    total,
    loading,
    error,
    filters,
    // Getters
    hasExpenses,
    isEmpty,
    totalPages,
    expenseById,
    // Actions
    fetchExpenses,
    updateFilters,
    clearFilters,
    createExpense,
    updateExpense,
    deleteExpense,
    createChildExpense,
    getExpenseWithChildren,
  }
})
