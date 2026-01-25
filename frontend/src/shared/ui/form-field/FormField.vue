<script setup lang="ts">
interface FormFieldProps {
  label: string
  error?: string
  required?: boolean
}

defineProps<FormFieldProps>()
</script>

<template>
  <div class="w-full space-y-1">
    <label class="block text-sm font-medium text-gray-700">
      {{ label }}
      <span v-if="required" class="text-error">*</span>
    </label>
    <slot />
    <p v-if="error" class="text-sm text-error">{{ error }}</p>
  </div>
</template>
