import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(JSON.parse(localStorage.getItem('user') || 'null'))
  const token = ref<string | null>(localStorage.getItem('access_token'))

  const isLoggedIn = computed(() => !!token.value)

  function setAuth(userData: any) {
    console.log(userData)
    token.value = userData.access_token
    user.value = userData
    localStorage.setItem('access_token', userData.access_token)
    localStorage.setItem('user', JSON.stringify(userData))
  }

  function clearAuth() {
    token.value = null
    user.value = null
    localStorage.removeItem('access_token')
    localStorage.removeItem('user')
  }


  function logout() {
    clearAuth()
  }


  return { user, token, isLoggedIn, setAuth, logout }
})
