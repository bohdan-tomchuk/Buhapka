<script setup lang="ts">
import { ref, computed } from 'vue'
import FileInput from '../../../shared/ui/file-input/FileInput.vue'

interface UploadReceiptProps {
  modelValue?: File | null
  error?: string
  disabled?: boolean
}

const props = withDefaults(defineProps<UploadReceiptProps>(), {
  disabled: false,
})

const emit = defineEmits<{
  'update:modelValue': [file: File | null]
  error: [message: string]
}>()

const fileError = ref<string | null>(null)
const previewUrl = ref<string | null>(null)

const handleFileChange = (file: File | null) => {
  fileError.value = null

  // Clear preview
  if (previewUrl.value) {
    URL.revokeObjectURL(previewUrl.value)
    previewUrl.value = null
  }

  if (file) {
    // Create preview for images
    if (file.type.startsWith('image/')) {
      previewUrl.value = URL.createObjectURL(file)
    }
  }

  emit('update:modelValue', file)
}

const handleError = (message: string) => {
  fileError.value = message
  emit('error', message)
}

const displayError = computed(() => props.error || fileError.value)
</script>

<template>
  <div class="space-y-4">
    <div>
      <label class="block text-sm font-medium text-gray-700 mb-2">
        Receipt (Optional)
      </label>
      <FileInput
        :model-value="modelValue"
        accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
        :max-size="10 * 1024 * 1024"
        :error="displayError"
        :disabled="disabled"
        @update:model-value="handleFileChange"
        @error="handleError"
      />
    </div>

    <div v-if="previewUrl && modelValue?.type.startsWith('image/')" class="mt-4">
      <p class="text-sm font-medium text-gray-700 mb-2">Preview:</p>
      <div class="rounded-lg border border-gray-200 p-2 bg-gray-50">
        <img
          :src="previewUrl"
          :alt="modelValue?.name"
          class="max-h-48 mx-auto rounded"
        />
      </div>
    </div>
  </div>
</template>
