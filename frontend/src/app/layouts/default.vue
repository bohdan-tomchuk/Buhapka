<script setup lang="ts">
import { ref } from 'vue'
import { useUserStore } from '../../entities/user/model/store'
import LogoutButton from '../../features/auth/logout/LogoutButton.vue'
import { ToastContainer } from '../../shared/ui/toast'

const userStore = useUserStore()
const mobileMenuOpen = ref(false)

const toggleMobileMenu = () => {
  mobileMenuOpen.value = !mobileMenuOpen.value
}

const closeMobileMenu = () => {
  mobileMenuOpen.value = false
}
</script>

<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <ToastContainer />
    <nav class="bg-white dark:bg-gray-800 shadow">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between h-16">
          <div class="flex">
            <div class="flex-shrink-0 flex items-center">
              <NuxtLink
                to="/"
                class="text-xl font-bold text-primary"
                @click="closeMobileMenu"
              >
                Buhapka
              </NuxtLink>
            </div>
            <div class="hidden sm:ml-6 sm:flex sm:space-x-8">
              <NuxtLink
                v-if="userStore.isAuthenticated"
                to="/expenses"
                class="border-transparent text-gray-500 dark:text-gray-400 hover:border-gray-300 hover:text-gray-700 dark:hover:text-gray-200 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors"
                active-class="border-primary text-gray-900 dark:text-white"
              >
                Expenses
              </NuxtLink>
              <NuxtLink
                v-if="userStore.isAuthenticated"
                to="/reports"
                class="border-transparent text-gray-500 dark:text-gray-400 hover:border-gray-300 hover:text-gray-700 dark:hover:text-gray-200 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors"
                active-class="border-primary text-gray-900 dark:text-white"
              >
                Reports
              </NuxtLink>
            </div>
          </div>
          <div class="flex items-center">
            <div v-if="userStore.isAuthenticated" class="hidden sm:flex items-center gap-4">
              <span class="text-sm text-gray-700 dark:text-gray-300">
                {{ userStore.user?.email }}
              </span>
              <LogoutButton />
            </div>
            <NuxtLink
              v-else
              to="/login"
              class="hidden sm:block text-sm font-medium text-primary hover:text-primary/80 transition-colors"
            >
              Login
            </NuxtLink>

            <!-- Mobile menu button -->
            <button
              v-if="userStore.isAuthenticated"
              type="button"
              class="sm:hidden inline-flex items-center justify-center p-2 rounded-md text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary transition-colors"
              aria-controls="mobile-menu"
              :aria-expanded="mobileMenuOpen"
              aria-label="Toggle navigation menu"
              @click="toggleMobileMenu"
            >
              <svg
                v-if="!mobileMenuOpen"
                class="block h-6 w-6"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
              <svg
                v-else
                class="block h-6 w-6"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <!-- Mobile menu -->
      <div
        v-if="mobileMenuOpen && userStore.isAuthenticated"
        id="mobile-menu"
        class="sm:hidden"
      >
        <div class="pt-2 pb-3 space-y-1">
          <NuxtLink
            to="/expenses"
            class="border-transparent text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-300 hover:text-gray-700 dark:hover:text-gray-200 block pl-3 pr-4 py-2 border-l-4 text-base font-medium transition-colors"
            active-class="bg-primary-50 dark:bg-primary-900/20 border-primary text-primary"
            @click="closeMobileMenu"
          >
            Expenses
          </NuxtLink>
          <NuxtLink
            to="/reports"
            class="border-transparent text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-300 hover:text-gray-700 dark:hover:text-gray-200 block pl-3 pr-4 py-2 border-l-4 text-base font-medium transition-colors"
            active-class="bg-primary-50 dark:bg-primary-900/20 border-primary text-primary"
            @click="closeMobileMenu"
          >
            Reports
          </NuxtLink>
        </div>
        <div class="pt-4 pb-3 border-t border-gray-200 dark:border-gray-700">
          <div class="flex items-center px-4">
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
                {{ userStore.user?.email }}
              </p>
            </div>
            <LogoutButton />
          </div>
        </div>
      </div>
    </nav>

    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
      <slot />
    </main>
  </div>
</template>
