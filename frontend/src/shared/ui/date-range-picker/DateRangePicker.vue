<script setup lang="ts">
import DatePicker from '../date-picker/DatePicker.vue'

export interface DateRange {
  from: string
  to: string
}

interface DateRangePickerProps {
  modelValue: DateRange
  disabled?: boolean
  fromLabel?: string
  toLabel?: string
  fromError?: string
  toError?: string
}

const props = withDefaults(defineProps<DateRangePickerProps>(), {
  disabled: false,
  fromLabel: 'From',
  toLabel: 'To',
})

const emit = defineEmits<{
  'update:modelValue': [value: DateRange]
}>()

const updateFrom = (value: string) => {
  emit('update:modelValue', { ...props.modelValue, from: value })
}

const updateTo = (value: string) => {
  emit('update:modelValue', { ...props.modelValue, to: value })
}
</script>

<template>
  <div class="flex gap-4">
    <div class="flex-1">
      <DatePicker
        :model-value="modelValue.from"
        :label="fromLabel"
        :disabled="disabled"
        :error="fromError"
        :max="modelValue.to"
        @update:model-value="updateFrom"
      />
    </div>
    <div class="flex-1">
      <DatePicker
        :model-value="modelValue.to"
        :label="toLabel"
        :disabled="disabled"
        :error="toError"
        :min="modelValue.from"
        @update:model-value="updateTo"
      />
    </div>
  </div>
</template>
