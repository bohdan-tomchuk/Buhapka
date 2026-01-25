<script setup lang="ts">
import { computed, ref } from 'vue'
import type { Expense, Currency } from '../../../shared/types'
import { formatCurrency, formatDate, formatCategory, formatSource, formatExchangeRate } from '../lib/formatters'
import Badge from '../../../shared/ui/badge/Badge.vue'
import ReceiptPreview from '../../receipt/ui/ReceiptPreview.vue'

interface ExpenseCardProps {
  expense: Expense
  showActions?: boolean
  depth?: number
}

const props = withDefaults(defineProps<ExpenseCardProps>(), {
  showActions: false,
  depth: 0,
})

const emit = defineEmits<{
  edit: [expense: Expense]
  addChild: [expense: Expense]
}>()

const isExpanded = ref(true)
const showReceiptPreview = ref(false)

const hasReceipt = computed(() => !!props.expense.receipt_id)
const isForeignCurrency = computed(() => props.expense.currency !== ('UAH' as Currency))
const truncatedDescription = computed(() => {
  const desc = props.expense.description
  return desc.length > 50 ? desc.substring(0, 50) + '...' : desc
})
const shouldTruncate = computed(() => props.expense.description.length > 50)
const hasChildren = computed(() => props.expense.children && props.expense.children.length > 0)
const indentClass = computed(() => {
  if (props.depth === 0) return ''
  return `pl-${props.depth * 4}`
})
const indentStyle = computed(() => {
  if (props.depth === 0) return {}
  return { paddingLeft: `${props.depth * 1.5}rem` }
})

const toggleExpanded = () => {
  isExpanded.value = !isExpanded.value
}

const openReceiptPreview = () => {
  if (hasReceipt.value) {
    showReceiptPreview.value = true
  }
}
</script>

<template>
  <div>
    <div
      class="rounded-lg border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow"
      :style="indentStyle"
    >
      <div class="flex items-start justify-between">
        <div class="flex-1">
          <div class="flex items-center gap-2 mb-2">
            <button
              v-if="hasChildren"
              type="button"
              class="text-gray-500 hover:text-gray-700 transition-colors"
              @click="toggleExpanded"
              aria-label="Toggle children"
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
                :class="{ 'rotate-90': isExpanded }"
                class="transition-transform"
              >
                <path d="M9 18l6-6-6-6"></path>
              </svg>
            </button>
            <h3 class="text-lg font-semibold text-gray-900">
              {{ formatCurrency(expense.amount, expense.currency) }}
            </h3>
            <Badge v-if="isForeignCurrency" variant="primary">
              {{ expense.currency }}
            </Badge>
            <button
              v-if="hasReceipt"
              type="button"
              class="inline-flex items-center text-blue-600 hover:text-blue-700 transition-colors"
              @click="openReceiptPreview"
              title="View receipt"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path>
              </svg>
            </button>
            <Badge v-if="!hasReceipt" variant="warning">
              No Receipt
            </Badge>
            <Badge v-if="hasChildren" variant="primary">
              {{ expense.children.length }} {{ expense.children.length === 1 ? 'child' : 'children' }}
            </Badge>
          </div>

          <p
            class="text-sm text-gray-600 mb-2"
            :title="shouldTruncate ? expense.description : undefined"
          >
            {{ truncatedDescription }}
          </p>

          <div v-if="isForeignCurrency && expense.exchange_rate" class="mb-2 text-xs text-gray-500">
            {{ formatExchangeRate(expense.exchange_rate, expense.currency, expense.rate_date) }}
            <span class="ml-2 font-medium text-gray-700">
              = {{ formatCurrency(expense.amount_uah, 'UAH' as Currency) }}
            </span>
          </div>

          <div class="flex flex-wrap gap-2 items-center">
            <Badge variant="secondary">
              {{ formatCategory(expense.category) }}
            </Badge>
            <Badge variant="default">
              {{ formatSource(expense.source) }}
            </Badge>
            <span class="text-xs text-gray-500">
              {{ formatDate(expense.date) }}
            </span>
          </div>
        </div>

        <div v-if="showActions" class="flex gap-2 ml-4">
          <button
            type="button"
            class="text-primary hover:text-primary-700 p-1 transition-colors"
            @click="emit('edit', expense)"
            aria-label="Edit expense"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
            </svg>
          </button>
          <button
            type="button"
            class="text-green-600 hover:text-green-700 p-1 transition-colors"
            @click="emit('addChild', expense)"
            aria-label="Add child expense"
            title="Add child expense"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- Render children recursively -->
    <div v-if="hasChildren && isExpanded" class="mt-2 space-y-2">
      <ExpenseCard
        v-for="child in expense.children"
        :key="child.id"
        :expense="child"
        :show-actions="showActions"
        :depth="depth + 1"
        @edit="emit('edit', $event)"
        @add-child="emit('addChild', $event)"
      />
    </div>

    <!-- Receipt Preview Modal -->
    <ReceiptPreview
      v-if="hasReceipt && expense.receipt_id"
      :receipt-id="expense.receipt_id"
      :open="showReceiptPreview"
      @update:open="showReceiptPreview = $event"
    />
  </div>
</template>

