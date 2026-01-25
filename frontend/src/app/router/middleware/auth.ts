import { useUserStore } from '../../../entities/user/model/store'

export default defineNuxtRouteMiddleware((to) => {
  const userStore = useUserStore()

  // Allow access to login page without authentication
  if (to.path === '/login') {
    return
  }

  // Check if user is authenticated
  if (!userStore.isAuthenticated) {
    return navigateTo('/login')
  }
})
