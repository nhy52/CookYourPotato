<template>
  <div class="game-view">
    <!-- 타이틀 -->
    <header class="game-header">
      <span class="game-title">🥔 감자 키우기</span>
    </header>

    <!-- 메인 영역: 왼쪽 캔버스 + 오른쪽 패널 -->
    <div class="game-main">
      <div class="canvas-area">
        <PotatoCanvas />
      </div>
      <div class="panel-area">
        <GameSidePanel />
      </div>
    </div>

    <!-- 채팅 로그 -->
    <div class="chat-area">
      <GameChatLog />
    </div>
  </div>
</template>

<script setup lang="ts">
import PotatoCanvas  from '@/components/game/PotatoCanvas.vue'
import GameSidePanel from '@/components/game/GameSidePanel.vue'
import GameChatLog   from '@/components/game/GameChatLog.vue'
</script>

<style scoped>
.game-view {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #FFF8E7;
  font-family: 'Segoe UI', sans-serif;
  overflow: hidden;
}

/* 타이틀 */
.game-header {
  padding: 10px 20px;
  background: #8B6534;
  color: #FFF8E7;
  flex-shrink: 0;
}
.game-title { font-size: 18px; font-weight: 700; letter-spacing: 1px; }

/* 메인: 캔버스 + 사이드패널 */
.game-main {
  display: flex;
  flex: 0 0 58%;
  min-height: 0;
}

.canvas-area {
  flex: 1;
  min-width: 0;
  border-right: 2px solid #D0BFA0;
}

.panel-area {
  width: 270px;
  flex-shrink: 0;
}

/* 채팅 영역 */
.chat-area {
  flex: 1;
  min-height: 0;
  border-top: 2px solid #D0BFA0;
}
</style>
