<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useExpenseStore } from '../../entities/expense/model/store'
import type { Expense } from '../../shared/types'
import ExpenseCard from '../../entities/expense/ui/ExpenseCard.vue'
import ExpenseFilter from '../../features/expense/filter/ExpenseFilter.vue'
import CreateExpenseForm from '../../features/expense/create/CreateExpenseForm.vue'
import CreateChildExpenseForm from '../../features/expense/create-child/CreateChildExpenseForm.vue'
import EditExpenseForm from '../../features/expense/edit/EditExpenseForm.vue'
import Button from '../../shared/ui/button/Button.vue'
import Select from '../../shared/ui/select/Select.vue'

const expenseStore = useExpenseStore()

const showCreateModal = ref(false)
const showEditModal = ref(false)
const showCreateChildModal = ref(false)
const selectedExpense = ref<Expense | null>(null)
const parentExpenseForChild = ref<Expense | null>(null)

const pageSizeOptions = [
  { label: '10 per page', value: 10 },
  { label: '20 per page', value: 20 },
  { label: '50 per page', value: 50 },
]

const currentPageStart = computed(() => {
  if (expenseStore.isEmpty) return 0
  return (expenseStore.filters.page! - 1) * expenseStore.filters.limit! + 1
})

const currentPageEnd = computed(() => {
  const end = expenseStore.filters.page! * expenseStore.filters.limit!
  return Math.min(end, expenseStore.total)
})

const canGoPrevious = computed(() => expenseStore.filters.page! > 1)
const canGoNext = computed(() => expenseStore.filters.page! < expenseStore.totalPages)

const handleEdit = (expense: Expense) => {
  selectedExpense.value = expense
  showEditModal.value = true
}

const handleAddChild = (expense: Expense) => {
  parentExpenseForChild.value = expense
  showCreateChildModal.value = true
}

const handleCreateSuccess = async () => {
  showCreateModal.value = false
}

const handleEditSuccess = async () => {
  showEditModal.value = false
  selectedExpense.value = null
}

const handleCreateChildSuccess = async () => {
  showCreateChildModal.value = false
  parentExpenseForChild.value = null
}

const goToPreviousPage = async () => {
  if (canGoPrevious.value) {
    expenseStore.updateFilters({ page: expenseStore.filters.page! - 1 })
    await expenseStore.fetchExpenses()
  }
}

const goToNextPage = async () => {
  if (canGoNext.value) {
    expenseStore.updateFilters({ page: expenseStore.filters.page! + 1 })
    await expenseStore.fetchExpenses()
  }
}

const handlePageSizeChange = async (newSize: number) => {
  expenseStore.updateFilters({ limit: newSize, page: 1 })
  await expenseStore.fetchExpenses()
}

const refreshExpenses = async () => {
  await expenseStore.fetchExpenses()
}

onMounted(async () => {
  try {
    await expenseStore.fetchExpenses()
  } catch (error) {
    console.error('Failed to fetch expenses:', error)
  }
})
</script>

<template>
  <div class="space-y-6">
    <div class="flex justify-between items-center">
      <div>
        <h1 class="text-3xl font-bold text-gray-900">Expense Management</h1>
        <p v-if="!expenseStore.isEmpty" class="text-sm text-gray-600 mt-1">
          Showing {{ currentPageStart }}-{{ currentPageEnd }} of {{ expenseStore.total }} expenses
        </p>
      </div>
      <div class="flex gap-2">
        <Button
          variant="outline"
          @click="refreshExpenses"
          :disabled="expenseStore.loading"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="mr-2"
          >
            <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2" />
          </svg>
          Refresh
        </Button>
        <Button @click="showCreateModal = true">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="mr-2"
          >
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          Create Expense
        </Button>
      </div>
    </div>

    <ExpenseFilter />

    <!-- Loading Skeleton -->
    <div v-if="expenseStore.loading" class="space-y-4">
      <div v-for="i in 5" :key="i" class="animate-pulse">
        <div class="h-24 bg-gray-200 rounded-lg"></div>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="expenseStore.error" class="bg-red-50 border border-red-200 rounded-lg p-8 text-center">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="48"
        height="48"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        class="mx-auto mb-4 text-red-500"
      >
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="8" x2="12" y2="12"></line>
        <line x1="12" y1="16" x2="12.01" y2="16"></line>
      </svg>
      <p class="text-red-700 font-medium">{{ expenseStore.error }}</p>
    </div>

    <!-- Empty State -->
    <div v-else-if="expenseStore.isEmpty" class="bg-gray-50 border border-gray-200 rounded-lg p-12 text-center">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="64"
        height="64"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        class="mx-auto mb-4 text-gray-400"
      >
        <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
        <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
      </svg>
      <h3 class="text-lg font-semibold text-gray-900 mb-2">No expenses found</h3>
      <p class="text-gray-600 mb-4">Get started by creating your first expense</p>
      <Button @click="showCreateModal = true">Create Expense</Button>
    </div>

    <!-- Expense Table -->
    <div v-else class="bg-white border border-gray-200 rounded-lg overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-gray-50 border-b border-gray-200">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Source</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200">
            <tr v-for="expense in expenseStore.expenses" :key="expense.id" class="hover:bg-gray-50">
              <td colspan="6" class="p-0">
                <div class="px-6 py-4">
                  <ExpenseCard
                    :expense="expense"
                    :show-actions="true"
                    @edit="handleEdit"
                    @add-child="handleAddChild"
                  />
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination Controls -->
      <div class="bg-gray-50 px-6 py-4 border-t border-gray-200 flex items-center justify-between">
        <div class="flex items-center gap-4">
          <Select
            :model-value="expenseStore.filters.limit"
            :options="pageSizeOptions"
            @update:model-value="handlePageSizeChange"
            class="w-40"
          />
        </div>

        <div class="flex items-center gap-4">
          <span class="text-sm text-gray-700">
            Page {{ expenseStore.filters.page }} of {{ expenseStore.totalPages }}
          </span>
          <div class="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              @click="goToPreviousPage"
              :disabled="!canGoPrevious || expenseStore.loading"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <polyline points="15 18 9 12 15 6"></polyline>
              </svg>
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              @click="goToNextPage"
              :disabled="!canGoNext || expenseStore.loading"
            >
              Next
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </Button>
          </div>
        </div>
      </div>
    </div>

    <CreateExpenseForm
      :open="showCreateModal"
      @close="showCreateModal = false"
      @success="handleCreateSuccess"
    />

    <CreateChildExpenseForm
      v-if="parentExpenseForChild"
      :open="showCreateChildModal"
      :parent-expense="parentExpenseForChild"
      @close="showCreateChildModal = false"
      @success="handleCreateChildSuccess"
    />

    <EditExpenseForm
      :open="showEditModal"
      :expense="selectedExpense"
      @close="showEditModal = false"
      @success="handleEditSuccess"
    />
  </div>
</template>
