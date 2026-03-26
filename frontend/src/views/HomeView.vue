<script setup lang="ts">
import { ref, onMounted } from 'vue'
import TheWelcome from '../components/TheWelcome.vue'
import Main from '@/components/Main.vue'
import instance from '@/api/index'

const test = ref()

async function getHello() {
  const resp = await instance.get('')
  test.value = resp.data
}

onMounted(()=>{
  getHello()
})
</script>

<template>
  <main>
    <h1>{{ test }}</h1>
    <Main />
  </main>
</template>
