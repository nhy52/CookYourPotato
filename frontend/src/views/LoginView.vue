<template>
  <div class="login-page">
    <div class="login-card">
      <!-- 타이틀 -->
      <div class="logo">🥔</div>
      <h1 class="title">감자 키우기</h1>
      <p class="subtitle">나만의 감자를 키워보세요!</p>

      <!-- 탭 -->
      <div class="tab-row">
        <button :class="['tab-btn', { active: mode === 'login' }]" @click="mode = 'login'">로그인</button>
        <button :class="['tab-btn', { active: mode === 'register' }]" @click="mode = 'register'">회원가입</button>
      </div>

      <!-- 에러 메시지 -->
      <div v-if="error" class="error-msg">{{ error }}</div>

      <!-- 로그인 폼 -->
      <form v-if="mode === 'login'" @submit.prevent="handleLogin" class="form">
        <label>이메일</label>
        <input v-model="email" type="email" placeholder="이메일 입력" required />
        <label>비밀번호</label>
        <input v-model="password" type="password" placeholder="비밀번호 입력" required />
        <button type="submit" class="submit-btn" :disabled="loading">
          {{ loading ? '로그인 중...' : '로그인' }}
        </button>
      </form>

      <!-- 회원가입 폼 -->
      <form v-else @submit.prevent="handleRegister" class="form">
        <label>닉네임</label>
        <input v-model="username" type="text" placeholder="닉네임 입력" required />
        <label>이메일</label>
        <input v-model="email" type="email" placeholder="이메일 입력" required />
        <label>비밀번호</label>
        <input v-model="password" type="password" placeholder="비밀번호 입력" required />
        <button type="submit" class="submit-btn" :disabled="loading">
          {{ loading ? '가입 중...' : '회원가입' }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import api from '@/api/index'
import { useAuthStore } from '@/stores/auth'
import { useGameStore } from '@/stores/game'
import { getMyPotato } from '@/api/potato'

const router = useRouter()
const authStore = useAuthStore()
const gameStore = useGameStore()

const mode = ref<'login' | 'register'>('login')
const email = ref('')
const password = ref('')
const username = ref('')
const error = ref('')
const loading = ref(false)

async function handleLogin() {
  error.value = ''
  loading.value = true
  try {
    const res = await api.post('/auth/login', { email: email.value, password: password.value })
    authStore.setAuth(res.data)

    // 감자 존재 여부 확인
    const potato = await getMyPotato()
    if (potato) {
      gameStore.loadFromDb(potato)
      router.push('/game')
    } else {
      router.push('/setup')
    }
  } catch (e: any) {
    error.value = e?.response?.data?.message || '로그인에 실패했어요.'
  } finally {
    loading.value = false
  }
}

async function handleRegister() {
  error.value = ''
  loading.value = true
  try {
    await api.post('/auth/register', {
      username: username.value,
      email: email.value,
      password: password.value,
    })
    // 가입 후 자동 로그인
    const res = await api.post('/auth/login', { email: email.value, password: password.value })
    authStore.setAuth(res.data)
    router.push('/setup')
  } catch (e: any) {
    error.value = e?.response?.data?.message || '회원가입에 실패했어요.'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  background: #FFF8E7;
  display: flex;
  align-items: center;
  justify-content: center;
}

.login-card {
  background: #fff;
  border-radius: 16px;
  padding: 40px 36px;
  width: 360px;
  box-shadow: 0 4px 24px rgba(139, 101, 52, 0.15);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.logo { font-size: 56px; line-height: 1; }

.title {
  font-size: 24px;
  font-weight: 700;
  color: #8B6534;
  margin: 0;
}

.subtitle {
  font-size: 13px;
  color: #A0856A;
  margin: 0 0 8px;
}

.tab-row {
  display: flex;
  width: 100%;
  border-radius: 8px;
  overflow: hidden;
  border: 2px solid #D0BFA0;
}

.tab-btn {
  flex: 1;
  padding: 8px;
  background: #FFF8E7;
  border: none;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  color: #A0856A;
  transition: background 0.2s, color 0.2s;
}

.tab-btn.active {
  background: #8B6534;
  color: #FFF8E7;
}

.error-msg {
  width: 100%;
  background: #FEE2E2;
  color: #B91C1C;
  border-radius: 8px;
  padding: 8px 12px;
  font-size: 13px;
  text-align: center;
}

.form {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form label {
  font-size: 12px;
  font-weight: 600;
  color: #8B6534;
  margin-top: 4px;
}

.form input {
  padding: 10px 12px;
  border: 2px solid #D0BFA0;
  border-radius: 8px;
  font-size: 14px;
  background: #FFFDF5;
  color: #555;
  outline: none;
  transition: border-color 0.2s;
}

.form input:focus {
  border-color: #8B6534;
}

.submit-btn {
  margin-top: 10px;
  padding: 12px;
  background: #8B6534;
  color: #FFF8E7;
  border: none;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.2s;
}

.submit-btn:hover:not(:disabled) {
  background: #6B4E28;
}

.submit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
