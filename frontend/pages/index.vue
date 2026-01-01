<template>
  <div class="container">
    <h1>Buhapka</h1>
    <p>Welcome to the Buhapka application!</p>
    <div v-if="backendStatus">
      <h2>Backend Status</h2>
      <p>{{ backendStatus }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
const config = useRuntimeConfig()
const backendStatus = ref<string>('')

onMounted(async () => {
  try {
    const response = await fetch(`${config.public.apiBaseUrl}`)
    const data = await response.text()
    backendStatus.value = `Connected! Response: ${data}`
  } catch (error) {
    backendStatus.value = `Error connecting to backend: ${error}`
  }
})
</script>

<style scoped>
.container {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
  font-family: system-ui, -apple-system, sans-serif;
}

h1 {
  color: #00DC82;
  margin-bottom: 1rem;
}

h2 {
  color: #333;
  margin-top: 2rem;
}

p {
  color: #666;
  line-height: 1.6;
}
</style>
