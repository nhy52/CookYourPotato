<template>
  <div class="side-panel" :class="{ 'is-delinquent': store.isDelinquent }">

    <!-- 날짜 -->
    <div class="day-box">
      <div class="day-label">📅 {{ store.day }}일 / {{ store.maxDay }}일</div>
      <div class="day-bar">
        <div class="day-fill" :style="{ width: (store.day / store.maxDay * 100) + '%' }" />
      </div>
    </div>

    <!-- 오늘 체력 -->
    <div class="hp-box">
      <span class="hp-label">오늘 체력</span>
      <div class="hp-dots">
        <span
          v-for="i in store.maxDailyHp" :key="i"
          class="hp-dot" :class="{ used: i > store.dailyHp }">♥</span>
      </div>
    </div>

    <!-- 보유 자금 -->
    <div class="money-box">
      <span class="money-icon">💰</span>
      <span class="money-label">보유 자금</span>
      <span class="money-val">{{ store.money }}원</span>
    </div>

    <!-- 불량아 배지 -->
    <div v-if="store.isDelinquent" class="delinquent-badge">😈 불량아 모드! (예절교육으로 복귀)</div>

    <!-- 스탯 (성장 수치) -->
    <div class="stat-section">
      <div class="stat-grid">
        <div v-for="s in growthStats" :key="s.key" class="stat-num-row">
          <span class="sn-icon">{{ s.icon }}</span>
          <span class="sn-label">{{ s.label }}</span>
          <span class="sn-val">{{ store.stats[s.key] }}</span>
        </div>
      </div>
      <!-- 바 스탯 -->
      <div class="bar-stats">
        <div v-for="s in barStats" :key="s.key" class="stat-bar-row">
          <span class="sb-label">{{ s.icon }}{{ s.label }}</span>
          <div class="sb-bar">
            <div class="sb-fill"
              :style="{ width: store.stats[s.key] + '%', backgroundColor: s.color }" />
          </div>
          <span class="sb-val" :class="s.key === 'stress' && store.stats[s.key] >= 70 ? 'val-danger' : ''">
            {{ store.stats[s.key] }}
          </span>
        </div>
      </div>
    </div>

    <div class="divider" />

    <!-- 행동 영역 -->
    <template v-if="store.phase === 'day'">
      <!-- 탭 -->
      <div class="tab-grid">
        <button
          v-for="t in tabs" :key="t.key"
          class="tab-btn" :class="{ active: activeTab === t.key }"
          @click="activeTab = t.key">
          <span class="tab-icon">{{ t.icon }}</span>
          <span class="tab-lbl">{{ t.label }}</span>
        </button>
      </div>

      <!-- 서브 버튼 -->
      <div class="sub-list">
        <!-- 고강도 알바 -->
        <template v-if="activeTab === 'highWork'">
          <div class="tab-desc">체력 ♥×4 소모</div>
          <button
            v-for="j in highWorkJobs" :key="j.key"
            class="sub-btn" :disabled="!store.canAfford(4)"
            @click="store.doHighWork(j.key)">
            <span class="sub-icon">{{ j.icon }}</span>
            <span class="sub-name">{{ j.label }}</span>
          </button>
        </template>

        <!-- 저강도 알바 -->
        <template v-else-if="activeTab === 'lowWork'">
          <div class="tab-desc">체력 ♥×3 소모</div>
          <button
            v-for="j in lowWorkJobs" :key="j.key"
            class="sub-btn" :disabled="!store.canAfford(3)"
            @click="store.doLowWork(j.key)">
            <span class="sub-icon">{{ j.icon }}</span>
            <span class="sub-name">{{ j.label }}</span>
          </button>
        </template>

        <!-- 교육 -->
        <template v-else-if="activeTab === 'education'">
          <div class="tab-desc">체력 ♥×2 소모 | 비용 20원</div>
          <button
            v-for="e in eduList" :key="e.key"
            class="sub-btn" :disabled="!store.canAfford(2, 20)"
            @click="store.doEducation(e.key)">
            <span class="sub-icon">{{ e.icon }}</span>
            <span class="sub-name">{{ e.label }}</span>
          </button>
        </template>

        <!-- 휴식 -->
        <template v-else-if="activeTab === 'rest'">
          <div class="tab-desc">체력 ♥×1 소모</div>
          <button
            v-for="r in restList" :key="r.key"
            class="sub-btn" :disabled="!store.canAfford(1)"
            @click="store.doRest(r.key)">
            <span class="sub-icon">{{ r.icon }}</span>
            <span class="sub-name">{{ r.label }}</span>
          </button>
        </template>
      </div>

      <button class="next-day-btn" @click="store.nextDay()">☀️ 다음 날로 →</button>
    </template>

    <!-- 엔딩 화면 -->
    <div v-else class="ending-box">
      <p class="ending-title">🎉 엔딩!</p>
      <p class="ending-name">{{ store.ending }}</p>
      <p class="ending-detail">{{ store.endingDetail }}</p>
      <button class="reset-btn" @click="store.resetGame()">다시 키우기 🌱</button>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useGameStore } from '@/stores/game'

const store = useGameStore()

type TabKey = 'highWork' | 'lowWork' | 'education' | 'rest'
const activeTab = ref<TabKey>('highWork')

const tabs = [
  { key: 'highWork'   as const, label: '고강도알바', icon: '💼' },
  { key: 'lowWork'    as const, label: '저강도알바', icon: '🌿' },
  { key: 'education'  as const, label: '교육',       icon: '📚' },
  { key: 'rest'       as const, label: '휴식',       icon: '💤' },
]

const highWorkJobs = [
  { key: 'nightGuard' as const, label: '야간 경비',  icon: '🌙' },
  { key: 'tavern'     as const, label: '주점 바텐더', icon: '🍺' },
  { key: 'farm'       as const, label: '농장 일꾼',  icon: '🌾' },
  { key: 'mine'       as const, label: '광산 노동',  icon: '⛏️' },
]

const lowWorkJobs = [
  { key: 'cafe' as const, label: '카페 알바',    icon: '☕' },
  { key: 'jog'  as const, label: '아침 조깅 알바', icon: '🏃' },
]

const eduList = [
  { key: 'library'   as const, label: '도서관 공부', icon: '📖' },
  { key: 'etiquette' as const, label: '예절 교육',  icon: '🙏' },
  { key: 'arts'      as const, label: '예술 교육',  icon: '🎨' },
  { key: 'church'    as const, label: '성당',       icon: '⛪' },
]

const restList = [
  { key: 'home'   as const, label: '집에서 쉬기', icon: '🛋️' },
  { key: 'walk'   as const, label: '산책하기',    icon: '🚶' },
  { key: 'street' as const, label: '거리 공연',   icon: '🎸' },
]

const growthStats = [
  { key: 'constitution' as const, label: '체력',   icon: '💪' },
  { key: 'intelligence' as const, label: '지능',   icon: '🧠' },
  { key: 'grace'        as const, label: '기품',   icon: '✨' },
  { key: 'charm'        as const, label: '매력',   icon: '💖' },
  { key: 'sensitivity'  as const, label: '감수성', icon: '🎵' },
]

const barStats = [
  { key: 'morality' as const, label: '도덕성', icon: '🌟', color: '#55B055' },
  { key: 'mental'   as const, label: '멘탈',   icon: '🧘', color: '#5590E0' },
  { key: 'stress'   as const, label: '스트레스', icon: '😤', color: '#E05555' },
]
</script>

<style scoped>
.side-panel {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 14px 12px;
  background: #F5E6C8;
  height: 100%;
  overflow-y: auto;
  box-sizing: border-box;
  transition: background 0.4s;
}
.side-panel.is-delinquent {
  background: #2A1F1F;
}
.side-panel.is-delinquent .day-label,
.side-panel.is-delinquent .hp-label,
.side-panel.is-delinquent .sn-label,
.side-panel.is-delinquent .sn-val,
.side-panel.is-delinquent .sb-label,
.side-panel.is-delinquent .sb-val,
.side-panel.is-delinquent .tab-lbl,
.side-panel.is-delinquent .tab-desc {
  color: #DDA0A0 !important;
}

/* 날짜 */
.day-box { display: flex; flex-direction: column; gap: 4px; }
.day-label { font-size: 12px; font-weight: 600; color: #5C4A2A; }
.day-bar { height: 6px; background: #DDD0B0; border-radius: 3px; overflow: hidden; }
.day-fill { height: 100%; background: #C8813C; border-radius: 3px; transition: width 0.4s; }

/* 오늘 체력 */
.hp-box { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
.hp-label { font-size: 11px; color: #7A6040; flex-shrink: 0; }
.hp-dots { display: flex; gap: 2px; flex-wrap: wrap; }
.hp-dot { font-size: 13px; color: #E05555; transition: color 0.2s; }
.hp-dot.used { color: #CCC; }

/* 보유 자금 */
.money-box {
  display: flex;
  align-items: center;
  gap: 5px;
  background: #EAD8A0;
  border-radius: 6px;
  padding: 5px 8px;
  border: 1px solid #C8B070;
}
.money-icon { font-size: 14px; }
.money-label { font-size: 11px; color: #6A5020; }
.money-val { font-size: 13px; font-weight: 700; color: #5A3A00; margin-left: auto; }

/* 불량아 배지 */
.delinquent-badge {
  background: #6B1A1A;
  color: #FFB0B0;
  font-size: 11px;
  font-weight: 700;
  padding: 5px 8px;
  border-radius: 6px;
  text-align: center;
  border: 1px solid #FF4444;
}

/* 스탯 */
.stat-section { display: flex; flex-direction: column; gap: 6px; }
.stat-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 4px 8px; }
.stat-num-row { display: flex; align-items: center; gap: 3px; }
.sn-icon { font-size: 12px; }
.sn-label { font-size: 11px; color: #7A6040; }
.sn-val { font-size: 12px; font-weight: 700; color: #3A2A0A; margin-left: auto; min-width: 28px; text-align: right; }

.bar-stats { display: flex; flex-direction: column; gap: 5px; }
.stat-bar-row { display: flex; align-items: center; gap: 4px; }
.sb-label { font-size: 10px; color: #7A6040; white-space: nowrap; width: 46px; flex-shrink: 0; }
.sb-bar { flex: 1; height: 7px; background: #DDD0B0; border-radius: 3px; overflow: hidden; }
.sb-fill { height: 100%; border-radius: 3px; transition: width 0.4s; }
.sb-val { font-size: 10px; color: #7A6040; width: 22px; text-align: right; }
.val-danger { color: #E03030 !important; font-weight: 700; }

/* 구분선 */
.divider { height: 1px; background: #D0BFA0; margin: 2px 0; }

/* 탭 */
.tab-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 4px; }
.tab-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 6px 4px;
  background: #D5C4A0;
  border: 1px solid #C0AE88;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.15s;
}
.tab-btn:hover { background: #C8B088; }
.tab-btn.active { background: #8B6534; border-color: #6A4A20; }
.tab-icon { font-size: 16px; }
.tab-lbl { font-size: 9px; font-weight: 600; color: #5C4A2A; }
.tab-btn.active .tab-lbl { color: #FFF8E7; }

/* 서브 리스트 */
.sub-list { display: flex; flex-direction: column; gap: 4px; }
.tab-desc { font-size: 10px; color: #A09070; text-align: center; padding: 2px 0; }
.sub-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 7px 10px;
  background: #8B6534;
  color: #FFF8E7;
  border: none;
  border-radius: 7px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s, transform 0.1s;
  text-align: left;
}
.sub-btn:hover:not(:disabled) { background: #C8813C; transform: translateX(2px); }
.sub-btn:disabled { background: #BCA880; cursor: not-allowed; opacity: 0.55; }
.sub-icon { font-size: 14px; flex-shrink: 0; }
.sub-name { font-size: 11px; }

/* 다음 날 버튼 */
.next-day-btn {
  padding: 9px 0;
  width: 100%;
  background: #5A8A3C;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.15s;
  margin-top: 2px;
}
.next-day-btn:hover { background: #4A7A2C; }

/* 엔딩 */
.ending-box { display: flex; flex-direction: column; align-items: center; gap: 10px; padding: 8px 0; }
.ending-title { font-size: 20px; font-weight: 700; color: #C8813C; margin: 0; }
.ending-name { font-size: 13px; font-weight: 700; color: #5C4A2A; margin: 0; text-align: center; line-height: 1.4; }
.ending-detail { font-size: 11px; color: #7A6040; margin: 0; text-align: center; line-height: 1.5; }
.reset-btn {
  padding: 10px 16px;
  background: #5A8A3C;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s;
}
.reset-btn:hover { background: #4A7A2C; }
</style>
