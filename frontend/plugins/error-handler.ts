export default defineNuxtPlugin((nuxtApp) => {
  // Global error handler for Vue errors
  nuxtApp.vueApp.config.errorHandler = (error, instance, info) => {
    console.error('Vue error:', error, info)

    // Log to external service if configured (e.g., Sentry)
    if (window.Sentry) {
      window.Sentry.captureException(error, {
        contexts: {
          vue: {
            componentName: instance?.$options?.name || 'Unknown',
            info,
          },
        },
      })
    }
  }

  // Hook into Nuxt's error handler
  nuxtApp.hook('vue:error', (error, instance, info) => {
    console.error('Nuxt error:', error, info)

    // Log to external service if configured
    if (window.Sentry) {
      window.Sentry.captureException(error)
    }
  })

  // Optional: Initialize Sentry if DSN is provided
  if (import.meta.client && import.meta.env.VITE_SENTRY_DSN) {
    initSentry(import.meta.env.VITE_SENTRY_DSN as string)
  }
})

function initSentry(dsn: string) {
  // This is a placeholder for Sentry initialization
  // To use: pnpm add @sentry/vue
  // import * as Sentry from '@sentry/vue'
  //
  // Sentry.init({
  //   dsn,
  //   integrations: [
  //     Sentry.browserTracingIntegration(),
  //     Sentry.replayIntegration(),
  //   ],
  //   tracesSampleRate: 1.0,
  //   replaysSessionSampleRate: 0.1,
  //   replaysOnErrorSampleRate: 1.0,
  // })

  console.info('Sentry DSN provided but SDK not installed. Install @sentry/vue to enable.')
}

declare global {
  interface Window {
    Sentry?: {
      captureException: (error: unknown, context?: unknown) => void
      init: (options: unknown) => void
    }
  }
}
