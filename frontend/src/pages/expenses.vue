<script setup lang="ts">
import ExpenseList from '../widgets/expense-list/ExpenseList.vue'

definePageMeta({
  layout: 'default',
  middleware: ['auth'],
})
</script>

<template>
  <div>
    <ExpenseList />
  </div>
</template>
