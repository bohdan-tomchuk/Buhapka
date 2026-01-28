<script setup lang="ts">
import GenerateReportForm from '../features/report/generate/GenerateReportForm.vue'

definePageMeta({
  layout: 'default',
  middleware: 'auth',
})
</script>

<template>
  <div>
    <div class="mb-6">
      <h1 class="text-3xl font-bold text-gray-900 dark:text-white">
        Reports
      </h1>
      <p class="mt-2 text-gray-600 dark:text-gray-400">
        Generate PDF reports of your expenses for any date range
      </p>
    </div>

    <GenerateReportForm />
  </div>
</template>
