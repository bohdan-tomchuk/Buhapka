<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import Modal from '../../../shared/ui/modal/Modal.vue'

interface ReceiptPreviewProps {
  receiptId: string
  open: boolean
}

const props = defineProps<ReceiptPreviewProps>()
const emit = defineEmits<{
  'update:open': [value: boolean]
}>()

const receiptUrl = computed(() => `/api/receipts/${props.receiptId}/file`)
const isLoading = ref(true)
const error = ref<string | null>(null)
const mimeType = ref<string | null>(null)

const isImage = computed(() => {
  return mimeType.value?.startsWith('image/')
})

const isPdf = computed(() => {
  return mimeType.value === 'application/pdf'
})

const loadReceipt = async () => {
  if (!props.receiptId) return

  isLoading.value = true
  error.value = null

  try {
    const response = await fetch(receiptUrl.value, {
      credentials: 'include',
    })

    if (!response.ok) {
      throw new Error('Failed to load receipt')
    }

    const contentType = response.headers.get('content-type')
    mimeType.value = contentType

    isLoading.value = false
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Unknown error'
    isLoading.value = false
  }
}

const handleClose = () => {
  emit('update:open', false)
}

onMounted(() => {
  if (props.open) {
    loadReceipt()
  }
})

// Reload when modal opens
const handleOpenChange = (value: boolean) => {
  if (value) {
    loadReceipt()
  }
  emit('update:open', value)
}
</script>

<template>
  <Modal :open="open" @update:open="handleOpenChange">
    <template #title>Receipt Preview</template>

    <div class="min-h-[400px] max-h-[600px] overflow-auto">
      <div v-if="isLoading" class="flex items-center justify-center h-64">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>

      <div v-else-if="error" class="flex flex-col items-center justify-center h-64 text-center">
        <svg
          class="h-12 w-12 text-red-500 mb-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <p class="text-red-600">{{ error }}</p>
      </div>

      <div v-else-if="isImage" class="flex items-center justify-center bg-gray-100 rounded-lg p-4">
        <img :src="receiptUrl" alt="Receipt" class="max-w-full h-auto rounded" />
      </div>

      <div v-else-if="isPdf" class="w-full h-[600px]">
        <iframe
          :src="receiptUrl"
          class="w-full h-full border-0 rounded-lg"
          title="Receipt PDF"
        ></iframe>
      </div>

      <div v-else class="flex flex-col items-center justify-center h-64 text-center">
        <svg
          class="h-12 w-12 text-gray-400 mb-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
          />
        </svg>
        <p class="text-gray-600 mb-4">Unable to preview this file type</p>
        <a
          :href="receiptUrl"
          download
          class="text-blue-600 hover:text-blue-700 underline"
        >
          Download file
        </a>
      </div>
    </div>

    <template #footer>
      <div class="flex justify-end space-x-2">
        <a
          :href="receiptUrl"
          download
          class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
        >
          Download
        </a>
        <button
          type="button"
          class="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
          @click="handleClose"
        >
          Close
        </button>
      </div>
    </template>
  </Modal>
</template>
