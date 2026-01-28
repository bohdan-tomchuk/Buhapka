<script setup lang="ts">
import { computed } from 'vue'

interface FormFieldProps {
  label: string
  error?: string
  required?: boolean
  for?: string
}

const props = defineProps<FormFieldProps>()

const labelId = computed(() => props.for || `field-${Math.random().toString(36).substring(2, 9)}`)
</script>

<template>
  <div class="w-full space-y-1">
    <label
      :for="labelId"
      class="block text-sm font-medium text-gray-700 dark:text-gray-300"
    >
      {{ label }}
      <span v-if="required" class="text-error" aria-label="required">*</span>
    </label>
    <slot />
    <p v-if="error" class="text-sm text-error" role="alert" aria-live="polite">{{ error }}</p>
  </div>
</template>
