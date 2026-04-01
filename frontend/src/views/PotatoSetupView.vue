<template>
  <div class="setup-page">
    <div class="setup-card">
      <div class="logo">🥔</div>
      <h2 class="title">감자 이름 짓기</h2>
      <p class="desc">처음이군요! 함께 키울 감자에게<br />이름과 생일을 지어줘요.</p>

      <div v-if="error" class="error-msg">{{ error }}</div>

      <form @submit.prevent="handleSubmit" class="form">
        <label>감자 이름</label>
        <input
          v-model="name"
          type="text"
          placeholder="예) 뽀글이, 노을이, 감자탕..."
          maxlength="12"
          required
        />

        <label>감자 생일</label>
        <input v-model="birthday" type="date" required />

        <button type="submit" class="submit-btn" :disabled="loading">
          {{ loading ? '만드는 중...' : '감자 키우기 시작! 🌱' }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { createPotato } from '@/api/potato'
import { useGameStore } from '@/stores/game'

const router = useRouter()
const gameStore = useGameStore()

const name = ref('')
const birthday = ref('')
const error = ref('')
const loading = ref(false)

async function handleSubmit() {
  if (!name.value.trim()) {
    error.value = '감자 이름을 입력해주세요!'
    return
  }
  if (!birthday.value) {
    error.value = '생일을 선택해주세요!'
    return
  }
  error.value = ''
  loading.value = true
  try {
    await createPotato(name.value.trim(), birthday.value)
    gameStore.newGame(name.value.trim(), birthday.value)
    router.push('/game')
  } catch (e: any) {
    error.value = e?.response?.data?.message || '감자 생성에 실패했어요.'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.setup-page {
  min-height: 100vh;
  background: #FFF8E7;
  display: flex;
  align-items: center;
  justify-content: center;
}

.setup-card {
  background: #fff;
  border-radius: 16px;
  padding: 40px 36px;
  width: 380px;
  box-shadow: 0 4px 24px rgba(139, 101, 52, 0.15);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.logo { font-size: 64px; line-height: 1; }

.title {
  font-size: 22px;
  font-weight: 700;
  color: #8B6534;
  margin: 0;
}

.desc {
  font-size: 13px;
  color: #A0856A;
  margin: 0;
  text-align: center;
  line-height: 1.6;
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
  margin-top: 6px;
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
  margin-top: 14px;
  padding: 13px;
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
