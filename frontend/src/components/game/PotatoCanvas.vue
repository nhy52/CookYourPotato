<template>
  <div ref="canvasWrap" class="potato-canvas-wrap" />
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import Phaser from 'phaser'
import { useGameStore } from '@/stores/game'
import type { GameState } from '@/stores/game'

const canvasWrap = ref<HTMLDivElement>()
const store = useGameStore()
let phaserGame: Phaser.Game | null = null
let activeScene: PotatoScene | null = null

// ──────────────────────────────────────
// Phaser Scene
// ──────────────────────────────────────
class PotatoScene extends Phaser.Scene {
  private potatoCont!: Phaser.GameObjects.Container
  private bodyGfx!: Phaser.GameObjects.Graphics
  private faceText!: Phaser.GameObjects.Text
  private currentTween: Phaser.Tweens.Tween | null = null

  constructor() { super({ key: 'PotatoScene' }) }

  create() {
    const { width, height } = this.scale
    const cx = width / 2
    const cy = height / 2

    // 따뜻한 크림색 배경
    this.add.rectangle(cx, cy, width, height, 0xFFF8E7)

    // 감자 몸통 (Graphics는 container 기준 (0,0)에서 그림)
    this.bodyGfx = this.add.graphics()
    this.drawBody('idle')

    // 표정 이모지
    this.faceText = this.add.text(0, -2, '😌', { fontSize: '36px' }).setOrigin(0.5)

    // 전체를 하나의 Container로 묶어서 애니메이션
    this.potatoCont = this.add.container(cx, cy, [this.bodyGfx, this.faceText])

    this.startIdle()
    activeScene = this
  }

  // ── 감자 몸통 그리기 ──────────────────
  drawBody(state: GameState) {
    const colorMap: Record<string, number> = {
      idle:        0xC8A96E,
      working:     0xD4935A,
      studying:    0xC8B06E,
      resting:     0xA89060,
      adventuring: 0xD4B878,
      eating:      0xC8B555,
    }
    const bumpMap: Record<string, number> = {
      idle:        0xB89060,
      working:     0xC4834A,
      studying:    0xB8A060,
      resting:     0x988050,
      adventuring: 0xC4A868,
      eating:      0xB8A545,
    }
    const body = colorMap[state] ?? 0xC8A96E
    const bump = bumpMap[state]  ?? 0xB89060

    this.bodyGfx.clear()

    // 그림자
    this.bodyGfx.fillStyle(0x000000, 0.08)
    this.bodyGfx.fillEllipse(3, 62, 120, 16)

    // 몸통
    this.bodyGfx.fillStyle(body)
    this.bodyGfx.fillEllipse(0, 0, 140, 108)

    // 울퉁불퉁 감자 표면
    this.bodyGfx.fillStyle(bump)
    this.bodyGfx.fillCircle(-36, -20, 15)
    this.bodyGfx.fillCircle(38, -16, 12)
    this.bodyGfx.fillCircle(-8,  32, 13)

    // 새싹
    this.bodyGfx.fillStyle(0x5A8A3C)
    this.bodyGfx.fillEllipse(  0, -63,  8, 22)
    this.bodyGfx.fillEllipse(-13, -68,  7, 18)
    this.bodyGfx.fillEllipse( 13, -66,  7, 18)

    // 공부 중: 안경
    if (state === 'studying') {
      this.bodyGfx.fillStyle(0x333333)
      this.bodyGfx.fillRoundedRect(-28, -20, 20, 11, 3)
      this.bodyGfx.fillRoundedRect(  8, -20, 20, 11, 3)
      this.bodyGfx.fillRect(-8, -16, 16, 3)
    }

    // 알바 중: 땀방울
    if (state === 'working') {
      this.bodyGfx.fillStyle(0x5BA3D9)
      this.bodyGfx.fillCircle(52, -28, 5)
      this.bodyGfx.fillTriangle(48, -28, 56, -28, 52, -19)
    }
  }

  // ── 떠다니는 이펙트 이모지 ────────────
  spawnEffect(emoji: string) {
    const { width, height } = this.scale
    const e = this.add.text(
      width / 2 + Phaser.Math.Between(-25, 25),
      height / 2 - 80,
      emoji,
      { fontSize: '22px' },
    ).setOrigin(0.5)

    this.tweens.add({
      targets: e,
      y: height / 2 - 150,
      alpha: 0,
      duration: 1400,
      onComplete: () => e.destroy(),
    })
  }

  // ── 기본 둥실둥실 ──────────────────────
  startIdle() {
    const cy = this.scale.height / 2
    this.currentTween?.stop()
    this.currentTween = this.tweens.add({
      targets: this.potatoCont,
      y: cy - 10,
      duration: 1200,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    })
  }

  // ── 상태에 따른 표정 + 애니메이션 ──────
  setState(state: GameState) {
    this.drawBody(state)

    const faceMap: Record<string, string> = {
      idle:        '😌',
      working:     '😤',
      studying:    '🤓',
      resting:     '😴',
      adventuring: '😮',
      eating:      '😋',
    }
    this.faceText.setText(faceMap[state] ?? '😌')

    const effectMap: Record<string, string> = {
      working:     '💪',
      studying:    '💡',
      resting:     '💤',
      adventuring: '✨',
      eating:      '❤️',
    }
    if (effectMap[state]) this.spawnEffect(effectMap[state])

    this.currentTween?.stop()
    const cx = this.scale.width  / 2
    const cy = this.scale.height / 2

    if (state === 'working') {
      // 좌우 흔들
      this.currentTween = this.tweens.add({
        targets: this.potatoCont,
        x: cx + 6,
        duration: 80,
        yoyo: true,
        repeat: 12,
        onComplete: () => { this.potatoCont.x = cx; this.startIdle() },
      })
    } else if (state === 'resting') {
      // 천천히 내려앉음
      this.currentTween = this.tweens.add({
        targets: this.potatoCont,
        y: cy + 6,
        duration: 2500,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      })
    } else if (state === 'adventuring') {
      // 위아래 점프
      this.currentTween = this.tweens.add({
        targets: this.potatoCont,
        y: cy - 25,
        duration: 350,
        yoyo: true,
        repeat: 4,
        ease: 'Quad.easeOut',
        onComplete: () => this.startIdle(),
      })
    } else {
      this.startIdle()
    }
  }
}

// ──────────────────────────────────────
// Vue lifecycle
// ──────────────────────────────────────
onMounted(() => {
  if (!canvasWrap.value) return
  phaserGame = new Phaser.Game({
    type: Phaser.AUTO,
    parent: canvasWrap.value,
    backgroundColor: '#FFF8E7',
    scale: {
      mode: Phaser.Scale.RESIZE,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: '100%',
      height: '100%',
    },
    scene: PotatoScene,
  })
})

onUnmounted(() => {
  phaserGame?.destroy(true)
  activeScene = null
})

watch(() => store.currentState, (s) => activeScene?.setState(s))
</script>

<style scoped>
.potato-canvas-wrap {
  width: 100%;
  height: 100%;
}
</style>
