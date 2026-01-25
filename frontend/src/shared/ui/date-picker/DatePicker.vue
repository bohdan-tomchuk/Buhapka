<script setup lang="ts">
import { cn } from '../../lib/utils'

interface DatePickerProps {
  modelValue?: string
  placeholder?: string
  disabled?: boolean
  error?: string
  label?: string
  min?: string
  max?: string
  class?: string
}

const props = withDefaults(defineProps<DatePickerProps>(), {
  disabled: false,
  placeholder: 'Select date',
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const handleInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  emit('update:modelValue', target.value)
}
</script>

<template>
  <div class="w-full">
    <label v-if="label" class="block text-sm font-medium text-gray-700 mb-1">
      {{ label }}
    </label>
    <input
      type="date"
      :value="modelValue"
      :placeholder="placeholder"
      :disabled="disabled"
      :min="min"
      :max="max"
      :class="cn(
        'w-full rounded-md border px-3 py-2 text-sm transition-colors',
        'focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent',
        'disabled:cursor-not-allowed disabled:opacity-50',
        error ? 'border-error' : 'border-gray-300',
        props.class
      )"
      @input="handleInput"
    />
    <p v-if="error" class="mt-1 text-sm text-error">{{ error }}</p>
  </div>
</template>
