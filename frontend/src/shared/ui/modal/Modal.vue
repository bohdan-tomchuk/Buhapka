<script setup lang="ts">
import { cn } from '../../lib/utils'

interface ModalProps {
  open: boolean
  title?: string
  class?: string
}

const props = defineProps<ModalProps>()

const emit = defineEmits<{
  close: []
}>()

const handleBackdropClick = (event: MouseEvent) => {
  if (event.target === event.currentTarget) {
    emit('close')
  }
}
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition-opacity duration-200"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-opacity duration-200"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="open"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
        @click="handleBackdropClick"
      >
        <div
          :class="cn(
            'relative w-full max-w-lg rounded-lg bg-white p-6 shadow-xl',
            props.class
          )"
          role="dialog"
          aria-modal="true"
        >
          <div v-if="title" class="mb-4 flex items-center justify-between">
            <h2 class="text-lg font-semibold">{{ title }}</h2>
            <button
              type="button"
              class="rounded-sm opacity-70 hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-primary"
              @click="emit('close')"
            >
              <span class="sr-only">Close</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
          <slot />
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
