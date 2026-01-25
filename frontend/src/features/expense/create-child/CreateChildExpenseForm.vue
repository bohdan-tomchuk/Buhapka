<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Currency, Category, Source } from '../../../shared/types'
import type { Expense } from '../../../shared/types'
import type { CreateExpenseDto } from '../../../entities/expense/model/store'
import { useExpenseStore } from '../../../entities/expense/model/store'
import { formatCurrency, formatDate } from '../../../entities/expense/lib/formatters'
import Input from '../../../shared/ui/input/Input.vue'
import Select from '../../../shared/ui/select/Select.vue'
import Button from '../../../shared/ui/button/Button.vue'
import FormField from '../../../shared/ui/form-field/FormField.vue'
import DatePicker from '../../../shared/ui/date-picker/DatePicker.vue'
import Textarea from '../../../shared/ui/textarea/Textarea.vue'
import Modal from '../../../shared/ui/modal/Modal.vue'
import Badge from '../../../shared/ui/badge/Badge.vue'

interface CreateChildExpenseFormProps {
  open: boolean
  parentExpense: Expense
}

const props = defineProps<CreateChildExpenseFormProps>()

const emit = defineEmits<{
  close: []
  success: []
}>()

const expenseStore = useExpenseStore()

const formData = ref<CreateExpenseDto>({
  amount: 0,
  currency: Currency.UAH,
  exchange_rate: null,
  rate_date: null,
  amount_uah: 0,
  date: new Date().toISOString().split('T')[0],
  source: Source.CASH,
  category: Category.DELIVERY,
  description: '',
  parent_expense_id: props.parentExpense.id,
})

const validationErrors = ref<Record<string, string>>({})

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

// Watch currency changes to clear exchange rate when switching to UAH
watch(() => formData.value.currency, (newCurrency) => {
  if (newCurrency === Currency.UAH) {
    formData.value.exchange_rate = null
    formData.value.rate_date = null
  }
})

const validateForm = (): boolean => {
  validationErrors.value = {}

  if (!formData.value.amount || formData.value.amount <= 0) {
    validationErrors.value.amount = 'Amount must be greater than 0'
  }

  const selectedDate = new Date(formData.value.date)
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  if (selectedDate > today) {
    validationErrors.value.date = 'Date cannot be in the future'
  }

  if (!formData.value.description.trim()) {
    validationErrors.value.description = 'Description is required'
  }

  if (isForeignCurrency.value && (!formData.value.exchange_rate || formData.value.exchange_rate <= 0)) {
    validationErrors.value.exchange_rate = 'Exchange rate is required for foreign currency'
  }

  return Object.keys(validationErrors.value).length === 0
}

const handleSubmit = async () => {
  if (!validateForm()) {
    return
  }

  try {
    await expenseStore.createChildExpense(props.parentExpense.id, formData.value)
    emit('success')
    emit('close')
    resetForm()
  } catch (err: any) {
    validationErrors.value.general = err.message || 'Failed to create child expense'
  }
}

const resetForm = () => {
  formData.value = {
    amount: 0,
    currency: Currency.UAH,
    exchange_rate: null,
    rate_date: null,
    amount_uah: 0,
    date: new Date().toISOString().split('T')[0],
    source: Source.CASH,
    category: Category.DELIVERY,
    description: '',
    parent_expense_id: props.parentExpense.id,
  }
  validationErrors.value = {}
}

const handleClose = () => {
  resetForm()
  emit('close')
}
</script>

<template>
  <Modal :open="open" title="Create Child Expense" @close="handleClose">
    <div class="mb-4 p-4 rounded-md bg-blue-50 border border-blue-200">
      <div class="text-sm font-medium text-blue-900 mb-1">Parent Expense</div>
      <div class="flex items-center gap-2">
        <span class="text-lg font-semibold text-blue-900">
          {{ formatCurrency(parentExpense.amount, parentExpense.currency) }}
        </span>
        <Badge variant="secondary">{{ parentExpense.category }}</Badge>
      </div>
      <div class="text-sm text-blue-700 mt-1">{{ parentExpense.description }}</div>
      <div class="text-xs text-blue-600 mt-1">{{ formatDate(parentExpense.date) }}</div>
    </div>

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

      <div v-if="isForeignCurrency" class="grid grid-cols-2 gap-4">
        <FormField label="Exchange Rate" :error="validationErrors.exchange_rate" required>
          <Input
            v-model.number="formData.exchange_rate"
            type="number"
            step="0.0001"
            placeholder="0.0000"
            :disabled="expenseStore.loading"
            :error="validationErrors.exchange_rate"
          />
        </FormField>

        <FormField label="Rate Date">
          <DatePicker
            v-model="formData.rate_date"
            :disabled="expenseStore.loading"
          />
        </FormField>
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
          @click="handleClose"
          :disabled="expenseStore.loading"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          :disabled="expenseStore.loading"
        >
          {{ expenseStore.loading ? 'Creating...' : 'Create Child Expense' }}
        </Button>
      </div>
    </form>
  </Modal>
</template>
