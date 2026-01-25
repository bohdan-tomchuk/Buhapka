<script setup lang="ts">
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../../lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        primary: 'bg-primary text-white hover:bg-primary-600 focus-visible:ring-primary',
        secondary: 'bg-secondary text-white hover:bg-secondary-600 focus-visible:ring-secondary',
        outline: 'border border-primary text-primary hover:bg-primary-50 focus-visible:ring-primary',
      },
      size: {
        sm: 'h-9 px-3 text-sm',
        md: 'h-10 px-4 py-2',
        lg: 'h-11 px-8 text-lg',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
)

export type ButtonVariants = VariantProps<typeof buttonVariants>

interface ButtonProps {
  variant?: ButtonVariants['variant']
  size?: ButtonVariants['size']
  disabled?: boolean
  type?: 'button' | 'submit' | 'reset'
  class?: string
}

const props = withDefaults(defineProps<ButtonProps>(), {
  variant: 'primary',
  size: 'md',
  type: 'button',
  disabled: false,
})

const emit = defineEmits<{
  click: [event: MouseEvent]
}>()
</script>

<template>
  <button
    :type="type"
    :disabled="disabled"
    :class="cn(buttonVariants({ variant, size }), props.class)"
    @click="emit('click', $event)"
  >
    <slot />
  </button>
</template>
