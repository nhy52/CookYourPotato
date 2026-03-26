<template>
  <div ref="canvasWrap" class="potato-canvas-wrap" />
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import Phaser from 'phaser'
import { useGameStore } from '@/stores/game'
import type { GameActivity } from '@/stores/game'

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

    this.add.rectangle(cx, cy, width, height, 0xFFF8E7)

    this.bodyGfx = this.add.graphics()
    this.drawBody('idle')

    this.faceText = this.add.text(0, -2, '😌', { fontSize: '36px' }).setOrigin(0.5)

    this.potatoCont = this.add.container(cx, cy, [this.bodyGfx, this.faceText])

    this.startIdle()
    activeScene = this
  }

  drawBody(state: GameActivity) {
    const colorMap: Record<string, number> = {
      idle:        0xC8A96E,
      working:     0xD4935A,
      studying:    0xC8B06E,
      resting:     0xA89060,
      delinquent:  0x6A5030,
    }
    const bumpMap: Record<string, number> = {
      idle:        0xB89060,
      working:     0xC4834A,
      studying:    0xB8A060,
      resting:     0x988050,
      delinquent:  0x5A4020,
    }
    const sproutMap: Record<string, number> = {
      idle:        0x5A8A3C,
      working:     0x5A8A3C,
      studying:    0x5A8A3C,
      resting:     0x5A8A3C,
      delinquent:  0x2A4A1C,
    }

    const body   = colorMap[state] ?? 0xC8A96E
    const bump   = bumpMap[state]  ?? 0xB89060
    const sprout = sproutMap[state] ?? 0x5A8A3C

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
    this.bodyGfx.fillCircle(-8, 32, 13)

    // 새싹 (불량아면 시들어 있음)
    this.bodyGfx.fillStyle(sprout)
    this.bodyGfx.fillEllipse(0,  -63, 8, 22)
    this.bodyGfx.fillEllipse(-13, -68, 7, 18)
    this.bodyGfx.fillEllipse(13,  -66, 7, 18)

    // 불량아: 뾰족한 가시 추가
    if (state === 'delinquent') {
      this.bodyGfx.fillStyle(0x3A2010)
      this.bodyGfx.fillTriangle(-60, -10, -45, -30, -30, -10)
      this.bodyGfx.fillTriangle(30, -10, 45, -30, 60, -10)
      this.bodyGfx.fillTriangle(-20, -50, -10, -75, 0, -50)
    }

    // 공부 중: 안경
    if (state === 'studying') {
      this.bodyGfx.fillStyle(0x333333)
      this.bodyGfx.fillRoundedRect(-28, -20, 20, 11, 3)
      this.bodyGfx.fillRoundedRect(8, -20, 20, 11, 3)
      this.bodyGfx.fillRect(-8, -16, 16, 3)
    }

    // 알바 중: 땀방울
    if (state === 'working') {
      this.bodyGfx.fillStyle(0x5BA3D9)
      this.bodyGfx.fillCircle(52, -28, 5)
      this.bodyGfx.fillTriangle(48, -28, 56, -28, 52, -19)
    }
  }

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

  setState(state: GameActivity) {
    this.drawBody(state)

    // 배경색 변경
    const bgColor = state === 'delinquent' ? 0x1A1210 : 0xFFF8E7
    this.children.getAt(0)  // rectangle
    const bg = this.children.getAt(0) as Phaser.GameObjects.Rectangle
    if (bg && bg.setFillStyle) bg.setFillStyle(bgColor)

    const faceMap: Record<string, string> = {
      idle:        '😌',
      working:     '😤',
      studying:    '🤓',
      resting:     '😴',
      delinquent:  '😈',
    }
    this.faceText.setText(faceMap[state] ?? '😌')

    const effectMap: Record<string, string> = {
      working:     '💪',
      studying:    '💡',
      resting:     '💤',
      delinquent:  '💀',
    }
    if (effectMap[state]) this.spawnEffect(effectMap[state])

    this.currentTween?.stop()
    const cx = this.scale.width  / 2
    const cy = this.scale.height / 2

    if (state === 'working') {
      this.currentTween = this.tweens.add({
        targets: this.potatoCont,
        x: cx + 6,
        duration: 80,
        yoyo: true,
        repeat: 12,
        onComplete: () => { this.potatoCont.x = cx; this.startIdle() },
      })
    } else if (state === 'resting') {
      this.currentTween = this.tweens.add({
        targets: this.potatoCont,
        y: cy + 6,
        duration: 2500,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      })
    } else if (state === 'delinquent') {
      // 불량아: 좌우로 거들먹거림
      this.currentTween = this.tweens.add({
        targets: this.potatoCont,
        angle: 8,
        duration: 600,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
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

watch(() => store.currentActivity, (s) => activeScene?.setState(s))
</script>

<style scoped>
.potato-canvas-wrap {
  width: 100%;
  height: 100%;
}
</style>
