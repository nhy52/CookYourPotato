<template>
  <div ref="logEl" class="chat-log">
    <TransitionGroup name="msg">
      <div
        v-for="msg in store.chatLog" :key="msg.id"
        class="chat-msg" :class="`type-${msg.type}`">
        <span class="chat-day">{{ msg.day }}일</span>
        <span class="chat-potato">{{ avatarFor(msg.type) }}</span>
        <div class="chat-bubble">
          <span class="chat-text">{{ msg.text }}</span>
          <!-- 선택지 버튼 -->
          <div v-if="msg.type === 'choice'" class="choice-area">
            <template v-if="!msg.choiceResolved">
              <button
                v-for="c in msg.choices" :key="c.key"
                class="choice-btn"
                @click="store.resolveChoice(msg.id, c.key)">
                {{ c.label }}
              </button>
            </template>
            <span v-else class="choice-done">✓ 선택 완료</span>
          </div>
        </div>
      </div>
    </TransitionGroup>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'
import { useGameStore } from '@/stores/game'
import type { ChatMessage } from '@/stores/game'

const store = useGameStore()
const logEl = ref<HTMLDivElement>()

function avatarFor(type: ChatMessage['type']) {
  if (type === 'event')   return '🌟'
  if (type === 'warning') return '⚠️'
  if (type === 'ending')  return '🎬'
  if (type === 'choice')  return '❓'
  return '🥔'
}

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
  gap: 6px;
  background: #FFFDF5;
  box-sizing: border-box;
}

.chat-msg {
  display: flex;
  align-items: flex-start;
  gap: 8px;
}

.chat-day {
  font-size: 10px;
  color: #A09080;
  white-space: nowrap;
  margin-top: 4px;
  flex-shrink: 0;
  min-width: 22px;
}

.chat-potato {
  font-size: 16px;
  flex-shrink: 0;
  margin-top: 1px;
}

.chat-bubble {
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex: 1;
  min-width: 0;
}

.chat-text {
  font-size: 13px;
  color: #5C4A2A;
  background: #FFF0D0;
  padding: 5px 10px;
  border-radius: 0 10px 10px 10px;
  line-height: 1.6;
  white-space: pre-line;
  display: block;
}

/* 타입별 색상 */
.type-event .chat-text {
  background: #E8F4E0;
  color: #2A5A1A;
  border-left: 3px solid #5A8A3C;
}
.type-warning .chat-text {
  background: #FFF0E0;
  color: #7A3A1A;
  border-left: 3px solid #E07030;
}
.type-ending .chat-text {
  background: #FFF5D0;
  color: #5A3A00;
  border-left: 3px solid #C8A030;
  font-weight: 700;
}
.type-choice .chat-text {
  background: #E8F0FF;
  color: #2A3A7A;
  border-left: 3px solid #5070C8;
}

/* 선택지 버튼 */
.choice-area {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  padding-left: 2px;
}

.choice-btn {
  padding: 5px 12px;
  background: #5070C8;
  color: white;
  border: none;
  border-radius: 16px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s, transform 0.1s;
  white-space: nowrap;
}
.choice-btn:hover {
  background: #3A58B0;
  transform: translateY(-1px);
}

.choice-done {
  font-size: 11px;
  color: #8090A0;
  font-style: italic;
}

/* TransitionGroup */
.msg-enter-from { opacity: 0; transform: translateY(8px); }
.msg-enter-active { transition: all 0.3s ease; }
.msg-enter-to { opacity: 1; transform: translateY(0); }
</style>
