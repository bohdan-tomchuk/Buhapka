<script setup lang="ts">
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../../lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-gray-100 text-gray-800',
        primary: 'bg-blue-100 text-blue-800',
        secondary: 'bg-purple-100 text-purple-800',
        success: 'bg-green-100 text-green-800',
        warning: 'bg-yellow-100 text-yellow-800',
        danger: 'bg-red-100 text-red-800',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

export type BadgeVariants = VariantProps<typeof badgeVariants>

interface BadgeProps {
  variant?: BadgeVariants['variant']
  class?: string
}

const props = withDefaults(defineProps<BadgeProps>(), {
  variant: 'default',
})
</script>

<template>
  <span :class="cn(badgeVariants({ variant }), props.class)">
    <slot />
  </span>
</template>
