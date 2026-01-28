<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Currency, Category, Source, type Expense } from '../../../shared/types'
import type { UpdateExpenseDto } from '../../../entities/expense/model/store'
import { useExpenseStore } from '../../../entities/expense/model/store'
import { useCurrencyStore, CurrencyDisplay } from '../../../entities/currency'
import { useToast } from '../../../shared/ui/toast'
import Input from '../../../shared/ui/input/Input.vue'
import Select from '../../../shared/ui/select/Select.vue'
import Button from '../../../shared/ui/button/Button.vue'
import FormField from '../../../shared/ui/form-field/FormField.vue'
import DatePicker from '../../../shared/ui/date-picker/DatePicker.vue'
import Textarea from '../../../shared/ui/textarea/Textarea.vue'
import Modal from '../../../shared/ui/modal/Modal.vue'

interface EditExpenseFormProps {
  open: boolean
  expense: Expense | null
}

const props = defineProps<EditExpenseFormProps>()

const emit = defineEmits<{
  close: []
  success: []
}>()

const expenseStore = useExpenseStore()
const currencyStore = useCurrencyStore()
const toast = useToast()

const formData = ref<Partial<Expense>>({})
const validationErrors = ref<Record<string, string>>({})
const fetchedRate = ref<number | null>(null)
const fetchedRateDate = ref<string | null>(null)
const isLoadingRate = ref(false)
const rateError = ref<string | null>(null)

const currencyOptions = [
  { label: 'UAH', value: Currency.UAH },
  { label: 'USD', value: Currency.USD },
  { label: 'EUR', value: Currency.EUR },
]

const sourceOptions = [
  { label: 'Cash', value: Source.CASH },
  { label: 'Fund Account', value: Source.FUND_ACCOUNT },
]

const categoryOptions = [
  { label: 'Parts', value: Category.PARTS },
  { label: 'Tools', value: Category.TOOLS },
  { label: 'Repair', value: Category.REPAIR },
  { label: 'Charity Transfer', value: Category.CHARITY_TRANSFER },
  { label: 'Delivery', value: Category.DELIVERY },
]

const isForeignCurrency = computed(() => formData.value.currency !== Currency.UAH)

// Computed property for UAH preview
const uahPreview = computed(() => {
  if (formData.value.currency === Currency.UAH) {
    return formData.value.amount || 0
  }
  if (fetchedRate.value && formData.value.amount) {
    return formData.value.amount * fetchedRate.value
  }
  return 0
})

watch(() => props.expense, (expense) => {
  if (expense) {
    formData.value = {
      amount: expense.amount,
      currency: expense.currency,
      exchange_rate: expense.exchange_rate,
      rate_date: expense.rate_date,
      amount_uah: expense.amount_uah,
      date: expense.date,
      source: expense.source,
      category: expense.category,
      description: expense.description,
    }
    validationErrors.value = {}

    // Pre-fill fetched rate if exists
    if (expense.exchange_rate && expense.rate_date) {
      fetchedRate.value = expense.exchange_rate
      fetchedRateDate.value = expense.rate_date
    }
  }
}, { immediate: true })

// Watch currency and date to automatically fetch exchange rate
watch([() => formData.value.currency, () => formData.value.date], async ([currency, date]) => {
  if (currency === Currency.UAH) {
    formData.value.exchange_rate = null
    formData.value.rate_date = null
    fetchedRate.value = null
    fetchedRateDate.value = null
    rateError.value = null
    return
  }

  if (!date) {
    return
  }

  // Fetch exchange rate for foreign currency
  isLoadingRate.value = true
  rateError.value = null
  try {
    const rate = await currencyStore.getRateForDate(currency, date)
    fetchedRate.value = rate.rate
    fetchedRateDate.value = rate.date
    formData.value.exchange_rate = rate.rate
    formData.value.rate_date = rate.date
  } catch (err: any) {
    rateError.value = err.message || 'Failed to fetch exchange rate'
    fetchedRate.value = null
    fetchedRateDate.value = null
    formData.value.exchange_rate = null
    formData.value.rate_date = null
  } finally {
    isLoadingRate.value = false
  }
})

const validateForm = (): boolean => {
  validationErrors.value = {}

  if (!formData.value.amount || formData.value.amount <= 0) {
    validationErrors.value.amount = 'Amount must be greater than 0'
  }

  if (formData.value.date) {
    const selectedDate = new Date(formData.value.date)
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    if (selectedDate > today) {
      validationErrors.value.date = 'Date cannot be in the future'
    }
  }

  if (!formData.value.description?.trim()) {
    validationErrors.value.description = 'Description is required'
  }

  if (isForeignCurrency.value && (!formData.value.exchange_rate || formData.value.exchange_rate <= 0)) {
    validationErrors.value.general = 'Exchange rate is required for foreign currency'
    return false
  }

  if (rateError.value) {
    validationErrors.value.general = rateError.value
    return false
  }

  return Object.keys(validationErrors.value).length === 0
}

const handleSubmit = async () => {
  if (!props.expense?.id) {
    toast.error('No expense selected', 'Error')
    return
  }

  if (!validateForm()) {
    toast.error('Please fix the validation errors', 'Validation Failed')
    return
  }

  try {
    const updateData: UpdateExpenseDto = {
      amount: formData.value.amount,
      currency: formData.value.currency,
      exchange_rate: formData.value.exchange_rate,
      rate_date: formData.value.rate_date,
      date: formData.value.date,
      source: formData.value.source,
      category: formData.value.category,
      description: formData.value.description,
    }

    await expenseStore.updateExpense(props.expense.id, updateData)
    toast.success('Expense updated successfully', 'Expense Updated')
    emit('success')
    emit('close')
  } catch (err: any) {
    toast.error(err.message || 'Failed to update expense', 'Error')
  }
}
</script>

<template>
  <Modal :open="open" title="Edit Expense" @close="emit('close')">
    <form @submit.prevent="handleSubmit" class="space-y-4">
      <div v-if="validationErrors.general" class="p-3 rounded-md bg-red-50 border border-red-200 text-red-700 text-sm">
        {{ validationErrors.general }}
      </div>

      <div class="grid grid-cols-2 gap-4">
        <FormField label="Amount" :error="validationErrors.amount" required>
          <Input
            v-model.number="formData.amount"
            type="number"
            step="0.01"
            placeholder="0.00"
            :disabled="expenseStore.loading"
            :error="validationErrors.amount"
          />
        </FormField>

        <FormField label="Currency" required>
          <Select
            v-model="formData.currency"
            :options="currencyOptions"
            :disabled="expenseStore.loading"
          />
        </FormField>
      </div>

      <!-- UAH Preview and Exchange Rate Info for Foreign Currencies -->
      <div v-if="isForeignCurrency" class="space-y-2">
        <div v-if="isLoadingRate" class="flex items-center gap-2 text-sm text-gray-600">
          <svg class="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span>Fetching exchange rate...</span>
        </div>

        <div v-else-if="rateError" class="p-3 rounded-md bg-red-50 border border-red-200 text-red-700 text-sm">
          {{ rateError }}
        </div>

        <div v-else-if="fetchedRate && fetchedRateDate">
          <div class="text-sm font-medium text-gray-700 mb-1">
            Amount in UAH: ≈ {{ uahPreview.toFixed(2) }} UAH
          </div>
          <CurrencyDisplay
            :currency="formData.currency"
            :rate="fetchedRate"
            :rate-date="fetchedRateDate"
          />
        </div>
      </div>

      <FormField label="Date" :error="validationErrors.date" required>
        <DatePicker
          v-model="formData.date"
          :disabled="expenseStore.loading"
        />
      </FormField>

      <FormField label="Source" required>
        <Select
          v-model="formData.source"
          :options="sourceOptions"
          :disabled="expenseStore.loading"
        />
      </FormField>

      <FormField label="Category" required>
        <Select
          v-model="formData.category"
          :options="categoryOptions"
          :disabled="expenseStore.loading"
        />
      </FormField>

      <FormField label="Description" :error="validationErrors.description" required>
        <Textarea
          v-model="formData.description"
          placeholder="Enter description"
          :rows="3"
          :disabled="expenseStore.loading"
          :error="validationErrors.description"
        />
      </FormField>

      <div class="flex gap-2 justify-end mt-6">
        <Button
          type="button"
          variant="outline"
          @click="emit('close')"
          :disabled="expenseStore.loading"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          :loading="expenseStore.loading"
          :disabled="isLoadingRate || !!rateError"
        >
          Update Expense
        </Button>
      </div>
    </form>
  </Modal>
</template>
