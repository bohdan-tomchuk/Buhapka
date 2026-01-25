<script setup lang="ts">
import { useUserStore } from '../entities/user/model/store'
import Button from '../shared/ui/button/Button.vue'

definePageMeta({
  layout: 'default',
})

const userStore = useUserStore()
</script>

<template>
  <div class="text-center py-16">
    <h1 class="text-4xl font-bold mb-4">Welcome to Buhapka</h1>
    <p class="text-xl text-gray-600 mb-8">
      Your expense tracking solution for managing finances efficiently
    </p>

    <div v-if="!userStore.isAuthenticated" class="flex gap-4 justify-center">
      <NuxtLink to="/login">
        <Button>Get Started</Button>
      </NuxtLink>
    </div>

    <div v-else class="flex gap-4 justify-center">
      <NuxtLink to="/expenses">
        <Button>View Expenses</Button>
      </NuxtLink>
    </div>

    <div class="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
      <div class="p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
        <h3 class="text-lg font-semibold mb-2">Track Expenses</h3>
        <p class="text-gray-600 dark:text-gray-400">
          Keep track of all your expenses in one place with detailed categorization
        </p>
      </div>
      <div class="p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
        <h3 class="text-lg font-semibold mb-2">Multiple Currencies</h3>
        <p class="text-gray-600 dark:text-gray-400">
          Support for UAH, USD, and EUR with automatic conversion tracking
        </p>
      </div>
      <div class="p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
        <h3 class="text-lg font-semibold mb-2">Filter & Analyze</h3>
        <p class="text-gray-600 dark:text-gray-400">
          Filter expenses by date, category, source, and currency for better insights
        </p>
      </div>
    </div>
  </div>
</template>
