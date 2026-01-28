<script setup lang="ts">
import { computed } from 'vue'
import { Currency } from '../../../shared/types'
import { formatDate } from '../../expense/lib/formatters'

interface Props {
  currency: Currency
  rate: number
  rateDate: string | Date
}

const props = defineProps<Props>()

// Format the display string: "1 {currency} = {rate} UAH (rate from {rateDate})"
const displayText = computed(() => {
  const formattedRate = new Intl.NumberFormat('uk-UA', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  }).format(props.rate)

  const formattedDate = formatDate(props.rateDate)

  return `1 ${props.currency} = ${formattedRate} UAH (rate from ${formattedDate})`
})
</script>

<template>
  <div class="text-sm text-gray-600">
    {{ displayText }}
  </div>
</template>
