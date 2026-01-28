<template>
  <div v-if="error" class="min-h-screen flex items-center justify-center bg-gray-50 px-4">
    <div class="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
      <div class="flex items-center gap-3 mb-4">
        <div class="flex-shrink-0">
          <svg
            class="w-10 h-10 text-red-500"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fill-rule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z"
              clip-rule="evenodd"
            />
          </svg>
        </div>
        <div>
          <h2 class="text-xl font-semibold text-gray-900">Something went wrong</h2>
          <p class="text-sm text-gray-600 mt-1">
            We're sorry, but an unexpected error occurred.
          </p>
        </div>
      </div>

      <div v-if="isDevelopment && errorMessage" class="mb-4">
        <details class="bg-gray-50 rounded p-3">
          <summary class="cursor-pointer text-sm font-medium text-gray-700">
            Error Details
          </summary>
          <pre class="mt-2 text-xs text-red-600 whitespace-pre-wrap">{{ errorMessage }}</pre>
        </details>
      </div>

      <div class="flex gap-3">
        <button
          @click="handleReload"
          class="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          Reload Page
        </button>
        <button
          v-if="showReset"
          @click="handleReset"
          class="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition-colors"
        >
          Try Again
        </button>
      </div>
    </div>
  </div>
  <slot v-else />
</template>

<script setup lang="ts">
import { ref, onErrorCaptured } from 'vue'

const props = defineProps<{
  showReset?: boolean
}>()

const emit = defineEmits<{
  reset: []
}>()

const error = ref<Error | null>(null)
const errorMessage = ref('')
const isDevelopment = ref(process.env.NODE_ENV !== 'production')

onErrorCaptured((err) => {
  error.value = err
  errorMessage.value = err.stack || err.message
  console.error('Error captured by boundary:', err)

  // Report to error tracking service if configured
  if (window.Sentry) {
    window.Sentry.captureException(err)
  }

  return false // Prevent error from propagating
})

const handleReload = () => {
  window.location.reload()
}

const handleReset = () => {
  error.value = null
  errorMessage.value = ''
  emit('reset')
}
</script>
