<template>
  <div
    class="fixed top-4 right-4 z-50 flex flex-col gap-2"
    aria-live="polite"
    aria-atomic="true"
  >
    <Toast
      v-for="toast in toasts"
      :key="toast.id"
      :message="toast.message"
      :type="toast.type"
      :title="toast.title"
      :duration="toast.duration"
      @close="removeToast(toast.id)"
    />
  </div>
</template>

<script setup lang="ts">
import Toast from './Toast.vue'
import { useToastStore } from './useToast'

const toastStore = useToastStore()
const toasts = computed(() => toastStore.toasts)

const removeToast = (id: string) => {
  toastStore.remove(id)
}
</script>
