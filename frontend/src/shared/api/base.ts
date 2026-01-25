import type { FetchOptions } from 'ofetch'

export const apiClient = $fetch.create({
  baseURL: useRuntimeConfig().public.apiBaseUrl as string,
  credentials: 'include',
  onResponseError({ response }) {
    if (response.status === 401) {
      navigateTo('/login')
    }
  },
} as FetchOptions)

export default apiClient
