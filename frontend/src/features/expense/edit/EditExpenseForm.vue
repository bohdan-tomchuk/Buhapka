<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Currency, Category, Source, type Expense } from '../../../shared/types'
import type { UpdateExpenseDto } from '../../../entities/expense/model/store'
import { useExpenseStore } from '../../../entities/expense/model/store'
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

const formData = ref<Partial<Expense>>({})
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
  }
}, { immediate: true })

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
    validationErrors.value.exchange_rate = 'Exchange rate is required for foreign currency'
  }

  return Object.keys(validationErrors.value).length === 0
}

const handleSubmit = async () => {
  if (!props.expense?.id) {
    validationErrors.value.general = 'No expense selected'
    return
  }

  if (!validateForm()) {
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
    emit('success')
    emit('close')
  } catch (err: any) {
    validationErrors.value.general = err.message || 'Failed to update expense'
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
          @click="emit('close')"
          :disabled="expenseStore.loading"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          :disabled="expenseStore.loading"
        >
          {{ expenseStore.loading ? 'Updating...' : 'Update Expense' }}
        </Button>
      </div>
    </form>
  </Modal>
</template>
