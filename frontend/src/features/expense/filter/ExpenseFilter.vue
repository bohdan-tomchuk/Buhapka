<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Category, Source } from '../../../shared/types'
import type { ExpenseFilters } from '../../../shared/types'
import { useExpenseStore } from '../../../entities/expense/model/store'
import Select from '../../../shared/ui/select/Select.vue'
import Button from '../../../shared/ui/button/Button.vue'
import FormField from '../../../shared/ui/form-field/FormField.vue'
import DatePicker from '../../../shared/ui/date-picker/DatePicker.vue'
import Badge from '../../../shared/ui/badge/Badge.vue'

const expenseStore = useExpenseStore()

const localFilters = ref<Omit<ExpenseFilters, 'page' | 'limit'>>({
  dateFrom: null,
  dateTo: null,
  category: null,
  source: null,
})

const sourceOptions = [
  { label: 'All Sources', value: null },
  { label: 'Cash', value: Source.CASH },
  { label: 'Fund Account', value: Source.FUND_ACCOUNT },
]

const categoryOptions = [
  { label: 'All Categories', value: null },
  { label: 'Parts', value: Category.PARTS },
  { label: 'Tools', value: Category.TOOLS },
  { label: 'Repair', value: Category.REPAIR },
  { label: 'Charity Transfer', value: Category.CHARITY_TRANSFER },
  { label: 'Delivery', value: Category.DELIVERY },
]

// Sync local filters with store filters
watch(() => expenseStore.filters, (storeFilters) => {
  localFilters.value = {
    dateFrom: storeFilters.dateFrom,
    dateTo: storeFilters.dateTo,
    category: storeFilters.category,
    source: storeFilters.source,
  }
}, { immediate: true, deep: true })

// Count active filters
const activeFilterCount = computed(() => {
  let count = 0
  if (localFilters.value.dateFrom) count++
  if (localFilters.value.dateTo) count++
  if (localFilters.value.category) count++
  if (localFilters.value.source) count++
  return count
})

// Check if filters have changed
const hasChanges = computed(() => {
  const store = expenseStore.filters
  return (
    localFilters.value.dateFrom !== store.dateFrom ||
    localFilters.value.dateTo !== store.dateTo ||
    localFilters.value.category !== store.category ||
    localFilters.value.source !== store.source
  )
})

const applyFilters = async () => {
  expenseStore.updateFilters({
    ...localFilters.value,
    page: 1, // Reset to first page when applying filters
  })
  await expenseStore.fetchExpenses()
}

const clearFilters = async () => {
  localFilters.value = {
    dateFrom: null,
    dateTo: null,
    category: null,
    source: null,
  }
  expenseStore.clearFilters()
  await expenseStore.fetchExpenses()
}
</script>

<template>
  <div class="bg-white rounded-lg border border-gray-200 p-4">
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-lg font-semibold text-gray-900">Filters</h3>
      <Badge v-if="activeFilterCount > 0" variant="primary">
        {{ activeFilterCount }} active
      </Badge>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <FormField label="Date From">
        <DatePicker v-model="localFilters.dateFrom" :disabled="expenseStore.loading" />
      </FormField>

      <FormField label="Date To">
        <DatePicker v-model="localFilters.dateTo" :disabled="expenseStore.loading" />
      </FormField>

      <FormField label="Source">
        <Select
          v-model="localFilters.source"
          :options="sourceOptions"
          :disabled="expenseStore.loading"
        />
      </FormField>

      <FormField label="Category">
        <Select
          v-model="localFilters.category"
          :options="categoryOptions"
          :disabled="expenseStore.loading"
        />
      </FormField>
    </div>

    <div class="flex gap-2 justify-end mt-4">
      <Button
        type="button"
        variant="outline"
        @click="clearFilters"
        :disabled="expenseStore.loading || activeFilterCount === 0"
      >
        Clear Filters
      </Button>
      <Button
        type="button"
        @click="applyFilters"
        :disabled="expenseStore.loading || !hasChanges"
      >
        {{ expenseStore.loading ? 'Applying...' : 'Apply Filters' }}
      </Button>
    </div>
  </div>
</template>
