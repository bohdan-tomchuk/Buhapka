<script setup lang="ts">
import { useUserStore } from '../../entities/user/model/store'
import LogoutButton from '../../features/auth/logout/LogoutButton.vue'

const userStore = useUserStore()
</script>

<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <nav class="bg-white dark:bg-gray-800 shadow">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between h-16">
          <div class="flex">
            <div class="flex-shrink-0 flex items-center">
              <NuxtLink to="/" class="text-xl font-bold text-primary">
                Buhapka
              </NuxtLink>
            </div>
            <div class="hidden sm:ml-6 sm:flex sm:space-x-8">
              <NuxtLink
                v-if="userStore.isAuthenticated"
                to="/expenses"
                class="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                active-class="border-primary text-gray-900"
              >
                Expenses
              </NuxtLink>
            </div>
          </div>
          <div class="flex items-center">
            <div v-if="userStore.isAuthenticated" class="flex items-center gap-4">
              <span class="text-sm text-gray-700 dark:text-gray-300">
                {{ userStore.user?.email }}
              </span>
              <LogoutButton />
            </div>
            <NuxtLink
              v-else
              to="/login"
              class="text-sm font-medium text-primary hover:text-primary/80"
            >
              Login
            </NuxtLink>
          </div>
        </div>
      </div>
    </nav>

    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <slot />
    </main>
  </div>
</template>
