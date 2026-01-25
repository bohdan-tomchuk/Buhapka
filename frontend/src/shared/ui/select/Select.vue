<script setup lang="ts">
import { cn } from '../../lib/utils'

export interface SelectOption {
  label: string
  value: string | number
}

interface SelectProps {
  modelValue?: string | number
  options: SelectOption[]
  placeholder?: string
  disabled?: boolean
  error?: string
  label?: string
  class?: string
}

const props = withDefaults(defineProps<SelectProps>(), {
  disabled: false,
  placeholder: 'Select an option',
})

const emit = defineEmits<{
  'update:modelValue': [value: string | number]
}>()

const handleChange = (event: Event) => {
  const target = event.target as HTMLSelectElement
  emit('update:modelValue', target.value)
}
</script>

<template>
  <div class="w-full">
    <label v-if="label" class="block text-sm font-medium text-gray-700 mb-1">
      {{ label }}
    </label>
    <select
      :value="modelValue"
      :disabled="disabled"
      :class="cn(
        'w-full rounded-md border px-3 py-2 text-sm transition-colors',
        'focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent',
        'disabled:cursor-not-allowed disabled:opacity-50',
        error ? 'border-error' : 'border-gray-300',
        props.class
      )"
      @change="handleChange"
    >
      <option value="" disabled>{{ placeholder }}</option>
      <option v-for="option in options" :key="option.value" :value="option.value">
        {{ option.label }}
      </option>
    </select>
    <p v-if="error" class="mt-1 text-sm text-error">{{ error }}</p>
  </div>
</template>
