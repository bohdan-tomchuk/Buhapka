<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useUserStore } from '../../../entities/user'
import Button from '../../../shared/ui/button/Button.vue'

const router = useRouter()
const userStore = useUserStore()

const handleLogout = async () => {
  try {
    await userStore.logout()
    await router.push('/login')
  } catch (err) {
    console.error('Logout failed:', err)
  }
}
</script>

<template>
  <Button
    variant="outline"
    size="sm"
    :disabled="userStore.loading"
    @click="handleLogout"
  >
    {{ userStore.loading ? 'Logging out...' : 'Logout' }}
  </Button>
</template>
