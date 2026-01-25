<script setup lang="ts">
import { cn } from '../../lib/utils'

interface TextareaProps {
  modelValue?: string
  placeholder?: string
  disabled?: boolean
  error?: string
  rows?: number
  class?: string
}

const props = withDefaults(defineProps<TextareaProps>(), {
  disabled: false,
  rows: 3,
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const handleInput = (event: Event) => {
  const target = event.target as HTMLTextAreaElement
  emit('update:modelValue', target.value)
}
</script>

<template>
  <div class="w-full">
    <textarea
      :value="modelValue"
      :placeholder="placeholder"
      :disabled="disabled"
      :rows="rows"
      :class="cn(
        'w-full rounded-md border px-3 py-2 text-sm transition-colors resize-none',
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
