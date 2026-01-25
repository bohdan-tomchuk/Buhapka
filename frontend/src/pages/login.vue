<script setup lang="ts">
import LoginForm from '../features/auth/login/LoginForm.vue'

definePageMeta({
  layout: 'default',
})
</script>

<template>
  <div class="flex items-center justify-center min-h-[calc(100vh-200px)]">
    <div class="w-full max-w-md">
      <div class="text-center mb-8">
        <h1 class="text-3xl font-bold">Welcome to Buhapka</h1>
        <p class="text-gray-600 mt-2">Sign in to manage your expenses</p>
      </div>
      <LoginForm />
    </div>
  </div>
</template>
