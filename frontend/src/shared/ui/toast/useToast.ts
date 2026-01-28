import { defineStore } from 'pinia'

export interface Toast {
  id: string
  message: string
  type: 'success' | 'error' | 'warning' | 'info'
  title?: string
  duration?: number
}

export const useToastStore = defineStore('toast', {
  state: () => ({
    toasts: [] as Toast[],
  }),

  actions: {
    show(toast: Omit<Toast, 'id'>) {
      const id = Math.random().toString(36).substring(2, 9)
      this.toasts.push({ id, ...toast })
      return id
    },

    success(message: string, title?: string, duration?: number) {
      return this.show({ message, type: 'success', title, duration })
    },

    error(message: string, title?: string, duration?: number) {
      return this.show({ message, type: 'error', title, duration: duration ?? 7000 })
    },

    warning(message: string, title?: string, duration?: number) {
      return this.show({ message, type: 'warning', title, duration })
    },

    info(message: string, title?: string, duration?: number) {
      return this.show({ message, type: 'info', title, duration })
    },

    remove(id: string) {
      const index = this.toasts.findIndex((t) => t.id === id)
      if (index > -1) {
        this.toasts.splice(index, 1)
      }
    },

    clear() {
      this.toasts = []
    },
  },
})

// Composable for easy access
export const useToast = () => {
  const store = useToastStore()

  return {
    success: store.success,
    error: store.error,
    warning: store.warning,
    info: store.info,
    clear: store.clear,
  }
}
