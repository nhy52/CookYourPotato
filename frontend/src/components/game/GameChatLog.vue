<template>
  <div ref="logEl" class="chat-log">
    <TransitionGroup name="msg">
      <div v-for="msg in store.chatLog" :key="msg.id" class="chat-msg">
        <span class="chat-day">{{ msg.day }}일</span>
        <span class="chat-potato">🥔</span>
        <span class="chat-text">{{ msg.text }}</span>
      </div>
    </TransitionGroup>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'
import { useGameStore } from '@/stores/game'

const store = useGameStore()
const logEl = ref<HTMLDivElement>()

// 새 메시지 오면 자동 스크롤
watch(() => store.chatLog.length, async () => {
  await nextTick()
  if (logEl.value) logEl.value.scrollTop = logEl.value.scrollHeight
})
</script>

<style scoped>
.chat-log {
  height: 100%;
  overflow-y: auto;
  padding: 12px 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  background: #FFFDF5;
  box-sizing: border-box;
}

.chat-msg {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  animation: fadeIn 0.3s ease;
}

.chat-day {
  font-size: 11px;
  color: #A09080;
  white-space: nowrap;
  margin-top: 2px;
  flex-shrink: 0;
}

.chat-potato {
  font-size: 18px;
  flex-shrink: 0;
}

.chat-text {
  font-size: 14px;
  color: #5C4A2A;
  background: #FFF0D0;
  padding: 6px 10px;
  border-radius: 0 10px 10px 10px;
  line-height: 1.5;
}

/* TransitionGroup 애니메이션 */
.msg-enter-from { opacity: 0; transform: translateY(8px); }
.msg-enter-active { transition: all 0.3s ease; }
.msg-enter-to { opacity: 1; transform: translateY(0); }

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(6px); }
  to   { opacity: 1; transform: translateY(0); }
}
</style>
