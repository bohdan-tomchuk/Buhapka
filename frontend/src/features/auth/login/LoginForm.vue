<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../../../entities/user'
import { useToast } from '../../../shared/ui/toast'
import Input from '../../../shared/ui/input/Input.vue'
import Button from '../../../shared/ui/button/Button.vue'
import FormField from '../../../shared/ui/form-field/FormField.vue'

const router = useRouter()
const userStore = useUserStore()
const toast = useToast()

const email = ref('')
const password = ref('')

const handleSubmit = async () => {
  if (!email.value || !password.value) {
    toast.error('Please fill in all fields', 'Validation Error')
    return
  }

  try {
    await userStore.login({
      email: email.value,
      password: password.value,
    })
    toast.success('Welcome back!', 'Login Successful')
    await router.push('/expenses')
  } catch (err: any) {
    toast.error(err.message || 'Please check your credentials and try again.', 'Login Failed')
  }
}
</script>

<template>
  <form @submit.prevent="handleSubmit" class="space-y-4">
    <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-6">Login to Buhapka</h2>

    <FormField label="Email" required>
      <Input
        id="email"
        v-model="email"
        type="email"
        placeholder="Enter your email"
        :disabled="userStore.loading"
        autocomplete="email"
        aria-label="Email address"
      />
    </FormField>

    <FormField label="Password" required>
      <Input
        id="password"
        v-model="password"
        type="password"
        placeholder="Enter your password"
        :disabled="userStore.loading"
        autocomplete="current-password"
        aria-label="Password"
      />
    </FormField>

    <Button
      type="submit"
      :loading="userStore.loading"
      class="w-full"
    >
      Login
    </Button>
  </form>
</template>
