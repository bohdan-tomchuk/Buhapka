<script setup lang="ts">
import { ref, computed } from 'vue'
import { cn } from '../../lib/utils'

interface FileInputProps {
  accept?: string
  maxSize?: number // in bytes
  modelValue?: File | null
  error?: string
  disabled?: boolean
  class?: string
}

const props = withDefaults(defineProps<FileInputProps>(), {
  accept: '*',
  maxSize: 10 * 1024 * 1024, // 10MB default
  disabled: false,
})

const emit = defineEmits<{
  'update:modelValue': [file: File | null]
  error: [message: string]
}>()

const fileInput = ref<HTMLInputElement>()
const isDragging = ref(false)

const fileName = computed(() => props.modelValue?.name || null)
const fileSize = computed(() => {
  if (!props.modelValue) return null
  const size = props.modelValue.size
  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
  return `${(size / (1024 * 1024)).toFixed(1)} MB`
})

const handleFileChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  processFile(file)
}

const handleDrop = (event: DragEvent) => {
  isDragging.value = false
  const file = event.dataTransfer?.files?.[0]
  processFile(file)
}

const processFile = (file: File | undefined) => {
  if (!file) {
    emit('update:modelValue', null)
    return
  }

  // Validate file size
  if (props.maxSize && file.size > props.maxSize) {
    const maxSizeMB = (props.maxSize / (1024 * 1024)).toFixed(0)
    emit('error', `File size exceeds the maximum limit of ${maxSizeMB}MB`)
    emit('update:modelValue', null)
    return
  }

  // Validate file type
  if (props.accept && props.accept !== '*') {
    const acceptedTypes = props.accept.split(',').map(t => t.trim())
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase()
    const mimeType = file.type

    const isAccepted = acceptedTypes.some(type => {
      if (type.startsWith('.')) {
        return fileExtension === type.toLowerCase()
      }
      return mimeType === type
    })

    if (!isAccepted) {
      emit('error', `File type not accepted. Please upload: ${props.accept}`)
      emit('update:modelValue', null)
      return
    }
  }

  emit('update:modelValue', file)
}

const handleDragEnter = () => {
  if (!props.disabled) {
    isDragging.value = true
  }
}

const handleDragLeave = () => {
  isDragging.value = false
}

const handleClick = () => {
  if (!props.disabled) {
    fileInput.value?.click()
  }
}

const clearFile = () => {
  emit('update:modelValue', null)
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}
</script>

<template>
  <div class="space-y-2">
    <div
      :class="cn(
        'relative rounded-lg border-2 border-dashed transition-colors cursor-pointer',
        isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400',
        props.disabled && 'opacity-50 cursor-not-allowed',
        props.error && 'border-red-500',
        props.class
      )"
      @click="handleClick"
      @dragenter.prevent="handleDragEnter"
      @dragover.prevent
      @dragleave.prevent="handleDragLeave"
      @drop.prevent="handleDrop"
    >
      <input
        ref="fileInput"
        type="file"
        :accept="accept"
        :disabled="disabled"
        class="hidden"
        @change="handleFileChange"
      />

      <div class="p-6 text-center">
        <div v-if="!fileName" class="space-y-2">
          <svg
            class="mx-auto h-12 w-12 text-gray-400"
            stroke="currentColor"
            fill="none"
            viewBox="0 0 48 48"
            aria-hidden="true"
          >
            <path
              d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
          <div class="text-sm text-gray-600">
            <span class="font-semibold text-blue-600">Click to upload</span>
            or drag and drop
          </div>
          <p class="text-xs text-gray-500">
            {{ accept === '*' ? 'Any file type' : accept }}
            (max {{ (maxSize / (1024 * 1024)).toFixed(0) }}MB)
          </p>
        </div>

        <div v-else class="flex items-center justify-between">
          <div class="flex items-center space-x-3">
            <svg
              class="h-8 w-8 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <div class="text-left">
              <p class="text-sm font-medium text-gray-900">{{ fileName }}</p>
              <p class="text-xs text-gray-500">{{ fileSize }}</p>
            </div>
          </div>
          <button
            type="button"
            class="text-red-600 hover:text-red-700 ml-4"
            @click.stop="clearFile"
          >
            <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>

    <p v-if="error" class="text-sm text-red-600">{{ error }}</p>
  </div>
</template>
