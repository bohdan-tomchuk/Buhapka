export default defineNuxtConfig({
  compatibilityDate: '2024-04-03',
  devtools: { enabled: true },

  srcDir: 'src/',

  pages: true,

  dir: {
    layouts: 'app/layouts',
    middleware: 'app/middleware',
  },

  components: [
    { path: '~/shared/ui' },
    { path: '~/entities' },
    { path: '~/features' },
    { path: '~/widgets' },
  ],

  modules: [
    '@pinia/nuxt',
    '@nuxtjs/tailwindcss'
  ],

  runtimeConfig: {
    public: {
      apiBaseUrl: process.env.NUXT_PUBLIC_API_BASE_URL || 'http://localhost:3001'
    }
  },

  imports: {
    dirs: [
      'shared/api',
      'shared/lib',
      'entities/*/model',
      'entities/*/api'
    ]
  }
})
