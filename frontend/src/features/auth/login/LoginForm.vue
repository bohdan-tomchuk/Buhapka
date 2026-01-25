<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../../../entities/user'
import Input from '../../../shared/ui/input/Input.vue'
import Button from '../../../shared/ui/button/Button.vue'
import FormField from '../../../shared/ui/form-field/FormField.vue'

const router = useRouter()
const userStore = useUserStore()

const email = ref('')
const password = ref('')
const error = ref('')

const handleSubmit = async () => {
  error.value = ''

  if (!email.value || !password.value) {
    error.value = 'Please fill in all fields'
    return
  }

  try {
    await userStore.login({
      email: email.value,
      password: password.value,
    })
    await router.push('/expenses')
  } catch (err: any) {
    error.value = err.message || 'Login failed. Please check your credentials.'
  }
}
</script>

<template>
  <form @submit.prevent="handleSubmit" class="space-y-4">
    <h2 class="text-2xl font-bold text-gray-900 mb-6">Login to Buhapka</h2>

    <div v-if="error" class="p-3 rounded-md bg-error/10 border border-error text-error text-sm">
      {{ error }}
    </div>

    <FormField label="Email" required>
      <Input
        v-model="email"
        type="email"
        placeholder="Enter your email"
        :disabled="userStore.loading"
      />
    </FormField>

    <FormField label="Password" required>
      <Input
        v-model="password"
        type="password"
        placeholder="Enter your password"
        :disabled="userStore.loading"
      />
    </FormField>

    <Button
      type="submit"
      :disabled="userStore.loading"
      class="w-full"
    >
      {{ userStore.loading ? 'Logging in...' : 'Login' }}
    </Button>
  </form>
</template>
