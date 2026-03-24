<template>
  <div class="side-panel">

    <!-- 날짜 -->
    <div class="day-box">
      <span class="day-label">🗓️ {{ store.day }}일 / {{ store.maxDay }}일</span>
      <div class="day-bar">
        <div class="day-fill" :style="{ width: (store.day / store.maxDay * 100) + '%' }" />
      </div>
    </div>

    <!-- 스탯 -->
    <div class="stats">
      <div v-for="s in statList" :key="s.key" class="stat-row">
        <span class="stat-icon">{{ s.icon }}</span>
        <span class="stat-name">{{ s.label }}</span>
        <div class="stat-bar">
          <div class="stat-fill"
            :style="{ width: store.stats[s.key] + '%', backgroundColor: s.color }" />
        </div>
        <span class="stat-val">{{ store.stats[s.key] }}</span>
      </div>
    </div>

    <div class="divider" />

    <!-- 행동 버튼 -->
    <div v-if="!store.isEnded" class="actions">
      <button
        v-for="a in actions" :key="a.key"
        class="action-btn"
        :disabled="store.currentState !== 'idle'"
        @click="a.handler()">
        <span class="a-icon">{{ a.icon }}</span>
        <span class="a-label">{{ a.label }}</span>
      </button>
    </div>

    <!-- 결말 화면 -->
    <div v-else class="ending">
      <p class="ending-title">🎉 결말!</p>
      <p class="ending-result">{{ store.ending }}</p>
      <button class="reset-btn" @click="store.resetGame()">다시 키우기 🌱</button>
    </div>

  </div>
</template>

<script setup lang="ts">
import { useGameStore } from '@/stores/game'

const store = useGameStore()

const statList = [
  { key: 'health'    as const, label: '건강', icon: '❤️',  color: '#E05555' },
  { key: 'knowledge' as const, label: '지식', icon: '📚',  color: '#5590E0' },
  { key: 'happiness' as const, label: '행복', icon: '😊',  color: '#E0C055' },
  { key: 'labor'     as const, label: '노동', icon: '💪',  color: '#55B055' },
]

const actions = [
  { key: 'work',      label: '알바하기',  icon: '💼', handler: () => store.doWork()      },
  { key: 'study',     label: '교육받기',  icon: '📖', handler: () => store.doStudy()     },
  { key: 'rest',      label: '휴식하기',  icon: '💤', handler: () => store.doRest()      },
  { key: 'adventure', label: '모험하기',  icon: '🌍', handler: () => store.doAdventure() },
  { key: 'eat',       label: '밥 먹기',   icon: '🍽️', handler: () => store.doEat()       },
]
</script>

<style scoped>
.side-panel {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
  background: #F5E6C8;
  height: 100%;
  overflow-y: auto;
  box-sizing: border-box;
}

/* 날짜 */
.day-box { display: flex; flex-direction: column; gap: 4px; }
.day-label { font-size: 13px; font-weight: 600; color: #5C4A2A; }
.day-bar { height: 6px; background: #DDD0B0; border-radius: 3px; overflow: hidden; }
.day-fill { height: 100%; background: #C8813C; border-radius: 3px; transition: width 0.4s; }

/* 스탯 */
.stats { display: flex; flex-direction: column; gap: 8px; }
.stat-row { display: flex; align-items: center; gap: 6px; }
.stat-icon { font-size: 14px; width: 20px; text-align: center; }
.stat-name { font-size: 12px; color: #5C4A2A; width: 28px; flex-shrink: 0; }
.stat-bar {
  flex: 1;
  height: 8px;
  background: #DDD0B0;
  border-radius: 4px;
  overflow: hidden;
}
.stat-fill { height: 100%; border-radius: 4px; transition: width 0.4s; }
.stat-val { font-size: 11px; color: #7A6040; width: 24px; text-align: right; }

/* 구분선 */
.divider { height: 1px; background: #D0BFA0; margin: 4px 0; }

/* 행동 버튼 */
.actions { display: flex; flex-direction: column; gap: 6px; }
.action-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: #8B6534;
  color: #FFF8E7;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s, transform 0.1s;
}
.action-btn:hover:not(:disabled) { background: #C8813C; transform: translateX(2px); }
.action-btn:disabled { background: #BCA880; cursor: not-allowed; opacity: 0.6; }
.a-icon { font-size: 16px; }

/* 결말 */
.ending { display: flex; flex-direction: column; align-items: center; gap: 10px; padding: 12px 0; }
.ending-title { font-size: 18px; font-weight: 700; color: #C8813C; margin: 0; }
.ending-result { font-size: 22px; font-weight: 700; color: #5C4A2A; margin: 0; text-align: center; }
.reset-btn {
  padding: 10px 20px;
  background: #5A8A3C;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s;
}
.reset-btn:hover { background: #4A7A2C; }
</style>
