import { defineStore } from 'pinia'
import { ref } from 'vue'

export type GameState = 'idle' | 'working' | 'studying' | 'resting' | 'adventuring' | 'eating'

export interface Stats {
  health: number
  knowledge: number
  happiness: number
  labor: number
}

export interface ChatMessage {
  id: number
  text: string
  day: number
}

export const useGameStore = defineStore('game', () => {
  const stats = ref<Stats>({ health: 50, knowledge: 50, happiness: 50, labor: 50 })
  const day = ref(1)
  const maxDay = 100
  const chatLog = ref<ChatMessage[]>([])
  const currentState = ref<GameState>('idle')
  const isEnded = ref(false)
  const ending = ref<string | null>(null)
  let msgId = 0

  function clamp(v: number) { return Math.max(0, Math.min(100, v)) }

  function addMsg(text: string) {
    chatLog.value.push({ id: msgId++, text, day: day.value })
  }

  function applyStats(d: Partial<Stats>) {
    if (d.health !== undefined)    stats.value.health    = clamp(stats.value.health    + d.health)
    if (d.knowledge !== undefined) stats.value.knowledge = clamp(stats.value.knowledge + d.knowledge)
    if (d.happiness !== undefined) stats.value.happiness = clamp(stats.value.happiness + d.happiness)
    if (d.labor !== undefined)     stats.value.labor     = clamp(stats.value.labor     + d.labor)
  }

  function checkEnding() {
    if (day.value >= maxDay && !isEnded.value) {
      isEnded.value = true
      ending.value = calcEnding()
      currentState.value = 'idle'
      addMsg(`드디어 100일이 됐어요! 저는... ${ending.value}이/가 됐어요!`)
    }
  }

  function calcEnding(): string {
    const { health, knowledge, happiness, labor } = stats.value
    if (labor >= 70)                            return '감자튀김 🍟'
    if (knowledge >= 70)                        return '뇨끼 🍝'
    if (happiness >= 70)                        return '감자샐러드 🥗'
    if (health >= 70)                           return '웨지감자 🥔'
    if (labor >= 55 && health >= 55)            return '해쉬브라운 🥞'
    if (knowledge >= 55 && happiness >= 55)     return '감자옹심이 🍲'
    if (labor >= 50 && knowledge >= 50)         return '감자스프 🍵'
    return '그냥 삶은 감자... 😢'
  }

  function doAction(state: GameState, delta: Partial<Stats>, days: number, messages: string[]) {
    if (isEnded.value || currentState.value !== 'idle') return
    currentState.value = state
    applyStats(delta)
    day.value = Math.min(day.value + days, maxDay)
    addMsg(messages[Math.floor(Math.random() * messages.length)])
    checkEnding()
    if (!isEnded.value) setTimeout(() => { currentState.value = 'idle' }, 2000)
  }

  function doWork() {
    doAction('working', { health: -5, happiness: -5, labor: 15 }, 7, [
      '힘들지만 열심히 일했어요! 뿌듯해요 💪',
      '오늘도 알바 다녀왔어요. 발이 아파요...',
      '고된 하루였지만 보람 있어요!',
      '일이 끝났어요. 근육이 생기는 것 같아요!',
    ])
  }

  function doStudy() {
    doAction('studying', { health: -5, happiness: -5, knowledge: 15 }, 7, [
      '새로운 걸 배웠어요! 머리가 터질 것 같아요 📚',
      '공부가 어렵지만 재밌기도 해요.',
      '오늘은 감자의 역사에 대해 배웠어요.',
      '지식이 쌓이는 게 느껴져요!',
    ])
  }

  function doRest() {
    doAction('resting', { health: 10, happiness: 10, labor: -5 }, 7, [
      '푹 쉬었어요~ 기분이 너무 좋아요 😊',
      '낮잠을 실컷 잤어요. 행복해요.',
      '아무것도 안 했는데 이렇게 행복한 게 맞나요?',
      '오늘은 하루 종일 뒹굴뒹굴했어요!',
    ])
  }

  function doAdventure() {
    doAction('adventuring', { health: -10, happiness: 10, knowledge: 10, labor: 5 }, 7, [
      '모험을 떠났어요! 신기한 감자밭을 발견했어요 🌍',
      '위험했지만 재밌었어요!',
      '멀리까지 굴러가 봤어요. 세상이 넓네요!',
      '모험 중에 다른 감자 친구를 만났어요!',
    ])
  }

  function doEat() {
    doAction('eating', { health: 15, happiness: 5 }, 1, [
      '맛있는 밥 먹었어요! 🍽️',
      '영양가 있는 거 먹었어요!',
      '배가 든든해요!',
      '맛있다~~!',
    ])
  }

  function resetGame() {
    stats.value = { health: 50, knowledge: 50, happiness: 50, labor: 50 }
    day.value = 1
    chatLog.value = []
    currentState.value = 'idle'
    isEnded.value = false
    ending.value = null
    msgId = 0
    addMsg('안녕하세요! 저는 아직 어린 감자예요. 잘 키워주세요! 🥔')
  }

  // 초기 메시지
  addMsg('안녕하세요! 저는 아직 어린 감자예요. 잘 키워주세요! 🥔')

  return {
    stats, day, maxDay, chatLog, currentState, isEnded, ending,
    doWork, doStudy, doRest, doAdventure, doEat, resetGame,
  }
})
