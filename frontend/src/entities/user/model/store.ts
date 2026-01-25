import { defineStore } from 'pinia'
import type { User, LoginCredentials } from '../../../shared/types'
import { loginApi, logoutApi, refreshApi, getCurrentUser } from '../api'

interface UserState {
  user: User | null
  isAuthenticated: boolean
  loading: boolean
  error: string | null
}

export const useUserStore = defineStore('user', {
  state: (): UserState => ({
    user: null,
    isAuthenticated: false,
    loading: false,
    error: null,
  }),

  getters: {
    currentUser: (state) => state.user,
    isLoggedIn: (state) => state.isAuthenticated,
  },

  actions: {
    async login(credentials: LoginCredentials) {
      this.loading = true
      this.error = null
      try {
        const response = await loginApi(credentials)
        this.user = response.user
        this.isAuthenticated = true
        return response
      } catch (error: any) {
        this.error = error.message || 'Login failed'
        throw error
      } finally {
        this.loading = false
      }
    },

    async logout() {
      this.loading = true
      this.error = null
      try {
        await logoutApi()
        this.user = null
        this.isAuthenticated = false
      } catch (error: any) {
        this.error = error.message || 'Logout failed'
        throw error
      } finally {
        this.loading = false
      }
    },

    async refresh() {
      this.loading = true
      this.error = null
      try {
        const response = await refreshApi()
        this.user = response.user
        this.isAuthenticated = true
        return response
      } catch (error: any) {
        this.error = error.message || 'Refresh failed'
        this.user = null
        this.isAuthenticated = false
        throw error
      } finally {
        this.loading = false
      }
    },

    async checkAuth() {
      this.loading = true
      this.error = null
      try {
        const user = await getCurrentUser()
        this.user = user
        this.isAuthenticated = true
      } catch (error: any) {
        this.user = null
        this.isAuthenticated = false
        this.error = error.message || 'Authentication check failed'
      } finally {
        this.loading = false
      }
    },
  },
})
