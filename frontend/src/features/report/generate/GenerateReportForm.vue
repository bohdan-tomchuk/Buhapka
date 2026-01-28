<script setup lang="ts">
import { ref } from 'vue'
import { generatePDF } from '../../../entities/report/api'
import { downloadFile } from '../../../shared/lib/download'
import DateRangePicker, { type DateRange } from '../../../shared/ui/date-range-picker/DateRangePicker.vue'
import Button from '../../../shared/ui/button/Button.vue'
import FormField from '../../../shared/ui/form-field/FormField.vue'

const dateRange = ref<DateRange>({
  from: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0],
  to: new Date().toISOString().split('T')[0],
})

const isGenerating = ref(false)
const errorMessage = ref<string | null>(null)
const validationErrors = ref<Record<string, string>>({})

const validateForm = (): boolean => {
  validationErrors.value = {}
  errorMessage.value = null

  if (!dateRange.value.from) {
    validationErrors.value.from = 'Start date is required'
  }

  if (!dateRange.value.to) {
    validationErrors.value.to = 'End date is required'
  }

  if (dateRange.value.from && dateRange.value.to) {
    const fromDate = new Date(dateRange.value.from)
    const toDate = new Date(dateRange.value.to)

    if (fromDate > toDate) {
      validationErrors.value.from = 'Start date must be before end date'
      validationErrors.value.to = 'End date must be after start date'
    }

    const today = new Date()
    today.setHours(23, 59, 59, 999)

    if (toDate > today) {
      validationErrors.value.to = 'End date cannot be in the future'
    }
  }

  return Object.keys(validationErrors.value).length === 0
}

const handleGenerate = async () => {
  if (!validateForm()) {
    return
  }

  isGenerating.value = true
  errorMessage.value = null

  try {
    const blob = await generatePDF({
      dateFrom: dateRange.value.from,
      dateTo: dateRange.value.to,
    })

    const filename = `report-${dateRange.value.from}-${dateRange.value.to}.pdf`
    downloadFile(blob, filename)
  } catch (err: any) {
    errorMessage.value = err.message || 'Failed to generate report. Please try again.'
  } finally {
    isGenerating.value = false
  }
}
</script>

<template>
  <div class="max-w-2xl">
    <div class="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
      <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        Generate Expense Report
      </h2>

      <form @submit.prevent="handleGenerate" class="space-y-6">
        <div v-if="errorMessage" class="p-3 rounded-md bg-red-50 border border-red-200 text-red-700 text-sm">
          {{ errorMessage }}
        </div>

        <FormField label="Date Range" required>
          <DateRangePicker
            v-model="dateRange"
            from-label="From"
            to-label="To"
            :from-error="validationErrors.from"
            :to-error="validationErrors.to"
            :disabled="isGenerating"
          />
        </FormField>

        <div class="text-sm text-gray-600 dark:text-gray-400">
          The report will include all expenses within the selected date range. The PDF will contain:
          <ul class="list-disc list-inside mt-2 space-y-1">
            <li>Expense date, description, amount (in original currency and UAH)</li>
            <li>Receipt availability indicator</li>
            <li>Total sum in UAH</li>
          </ul>
        </div>

        <div class="flex gap-3">
          <Button
            type="submit"
            :disabled="isGenerating"
            class="flex items-center gap-2"
          >
            <svg
              v-if="isGenerating"
              class="animate-spin h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            {{ isGenerating ? 'Generating...' : 'Generate PDF' }}
          </Button>
        </div>
      </form>
    </div>
  </div>
</template>
