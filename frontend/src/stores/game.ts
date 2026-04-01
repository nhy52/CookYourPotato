import { defineStore } from 'pinia'
import { ref } from 'vue'
import { updatePotato } from '@/api/potato'

export type GameActivity = 'idle' | 'working' | 'studying' | 'resting' | 'delinquent'

export interface Stats {
  constitution: number  // 체력 (성장 스탯)
  intelligence: number  // 지능
  grace: number         // 기품
  charm: number         // 매력
  sensitivity: number   // 감수성
  morality: number      // 도덕성 (0-100)
  mental: number        // 멘탈 (0-100)
  stress: number        // 스트레스 (0-100)
}

export interface ChatChoice {
  label: string
  key: string
}

export interface ChatMessage {
  id: number
  text: string
  day: number
  type: 'normal' | 'event' | 'ending' | 'warning' | 'choice'
  choices?: ChatChoice[]
  choiceResolved?: boolean
}

// 상점 아이템 정의
const SHOP_ITEMS: { key: string; label: string; price: number; delta: Partial<Stats>; desc: string }[] = [
  {
    key: 'buy_alcohol',
    label: '🍶 독한 술 (400원)',
    price: 400,
    delta: { charm: 80, morality: -15, stress: -10 },
    desc: '매력이 폭발적으로 오르지만 도덕성이 내려가요.',
  },
  {
    key: 'buy_necklace',
    label: '💎 매혹의 목걸이 (400원)',
    price: 400,
    delta: { charm: 60, grace: 25 },
    desc: '매력과 기품이 크게 오르는 럭셔리 아이템!',
  },
  {
    key: 'buy_book',
    label: '📕 지식의 두꺼운 책 (200원)',
    price: 200,
    delta: { intelligence: 70 },
    desc: '지능이 대폭 오르는 비법서!',
  },
  {
    key: 'buy_potion',
    label: '🧪 힐링 포션 (150원)',
    price: 150,
    delta: { stress: -50, mental: 20 },
    desc: '스트레스가 확 풀리고 멘탈이 회복돼요.',
  },
  {
    key: 'buy_supplement',
    label: '💊 헬스 보충제 (180원)',
    price: 180,
    delta: { constitution: 50 },
    desc: '체력이 대폭 올라가는 근육 보충제!',
  },
]

const STAT_LABELS: Record<keyof Stats, string> = {
  constitution: '체력',
  intelligence: '지능',
  grace: '기품',
  charm: '매력',
  sensitivity: '감수성',
  morality: '도덕성',
  mental: '멘탈',
  stress: '스트레스',
}

export const useGameStore = defineStore('game', () => {
  const potatoName = ref('')
  const birthday = ref('')

  const stats = ref<Stats>({
    constitution: 30,
    intelligence: 20,
    grace: 20,
    charm: 20,
    sensitivity: 20,
    morality: 50,
    mental: 50,
    stress: 0,
  })

  const day = ref(1)
  const maxDay = 30
  const dailyHp = ref(10)
  const maxDailyHp = 10
  const money = ref(300) // 초기 용돈
  const currentActivity = ref<GameActivity>('idle')
  const phase = ref<'day' | 'ended'>('day')
  const ending = ref<string | null>(null)
  const endingDetail = ref<string | null>(null)
  const chatLog = ref<ChatMessage[]>([])

  const isDelinquent = ref(false)
  const kogumaEncountered = ref(false)

  const counts = ref({
    nightGuard: 0,
    tavern: 0,
    farm: 0,
    mine: 0,
    jog: 0,
    library: 0,
    etiquette: 0,
    arts: 0,
    church: 0,
    street: 0,
    totalWork: 0,
  })

  const rainEvents = ref(0)
  const leaniEvents = ref(0)
  const rustleEvents = ref(0)

  let msgId = 0
  let activityTimer: ReturnType<typeof setTimeout> | null = null

  // ── 유틸 ─────────────────────────────────────────────────────
  function pick<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)]
  }

  function clamp(v: number, min = 0, max = 999) {
    return Math.max(min, Math.min(max, v))
  }

  function deltaText(delta: Partial<Stats>, moneyChange?: number): string {
    const parts = (Object.entries(delta) as [keyof Stats, number][])
      .filter(([, v]) => v !== 0)
      .map(([k, v]) => `${STAT_LABELS[k]}${v > 0 ? '+' : ''}${v}`)
    const moneyStr = moneyChange ? `💰${moneyChange > 0 ? '+' : ''}${moneyChange}원` : ''
    const statStr  = parts.length ? `📊 ${parts.join('  ')}` : ''
    return [moneyStr, statStr].filter(Boolean).join('  |  ')
  }

  function addMsg(
    text: string,
    type: ChatMessage['type'] = 'normal',
    choices?: ChatChoice[],
  ) {
    chatLog.value.push({
      id: msgId++,
      text,
      day: day.value,
      type,
      choices,
      choiceResolved: !choices,
    })
  }

  function applyStats(delta: Partial<Stats>) {
    const s = stats.value
    if (delta.constitution !== undefined) s.constitution = clamp(s.constitution + delta.constitution)
    if (delta.intelligence !== undefined) s.intelligence = clamp(s.intelligence + delta.intelligence)
    if (delta.grace        !== undefined) s.grace        = clamp(s.grace        + delta.grace)
    if (delta.charm        !== undefined) s.charm        = clamp(s.charm        + delta.charm)
    if (delta.sensitivity  !== undefined) s.sensitivity  = clamp(s.sensitivity  + delta.sensitivity)
    if (delta.morality     !== undefined) s.morality     = clamp(s.morality     + delta.morality, 0, 100)
    if (delta.mental       !== undefined) s.mental       = clamp(s.mental       + delta.mental, 0, 100)
    if (delta.stress       !== undefined) s.stress       = clamp(s.stress       + delta.stress, 0, 100)
  }

  function canAfford(hpCost: number, moneyCost = 0): boolean {
    return phase.value === 'day' && dailyHp.value >= hpCost && money.value >= moneyCost
  }

  function setActivity(act: GameActivity) {
    currentActivity.value = act
    if (activityTimer) clearTimeout(activityTimer)
    if (act !== 'idle' && act !== 'delinquent') {
      activityTimer = setTimeout(() => {
        currentActivity.value = isDelinquent.value ? 'delinquent' : 'idle'
      }, 1800)
    }
  }

  // ── 선택지 해결 (채팅 인터랙션) ──────────────────────────────
  function resolveChoice(msgId: number, choiceKey: string) {
    const msg = chatLog.value.find(m => m.id === msgId)
    if (!msg || msg.choiceResolved) return
    msg.choiceResolved = true

    // 산책 목적지 선택
    if (choiceKey === 'loc_park') {
      _walkPark()
    } else if (choiceKey === 'loc_shop') {
      _openShop()
    } else if (choiceKey === 'loc_plaza') {
      _walkPlaza()
    // 상점 구매
    } else if (choiceKey.startsWith('buy_')) {
      _buyItem(choiceKey)
    } else if (choiceKey === 'shop_exit') {
      addMsg('상점을 나왔어요. 다음에 또 올게요! 🏪')
    }
  }

  function _walkPark() {
    const baseDelta: Partial<Stats> = { stress: -15, mental: 3 }

    // 고구마 이벤트 (20% 확률, 최초 1회)
    if (!kogumaEncountered.value && Math.random() < 0.2) {
      kogumaEncountered.value = true
      isDelinquent.value = true
      const kogumaDelta: Partial<Stats> = { morality: -20, charm: 5, stress: -5 }
      applyStats({ ...baseDelta, ...kogumaDelta })
      addMsg(
        `공원에서 고구마를 만났어요! "감자야, 우리랑 놀자~" 🍠\n고구마 무리들과 어울리기 시작했어요...\n${deltaText({ ...baseDelta, ...kogumaDelta })}`,
        'event',
      )
      setTimeout(() => { currentActivity.value = 'delinquent' }, 100)
      return
    }

    if (isDelinquent.value) {
      const delinqDelta: Partial<Stats> = { morality: -5, stress: -10 }
      applyStats({ ...baseDelta, ...delinqDelta })
      addMsg(
        `${pick(['불량 감자들과 공원에서 어울렸어요. 점점 어두운 곳으로...', '고구마 패거리와 어울렸어요. 도덕성이 낮아지는 느낌이에요.'])}\n${deltaText({ ...baseDelta, ...delinqDelta })}`,
        'warning',
      )
    } else {
      applyStats(baseDelta)
      addMsg(
        `${pick(['공원에서 산책했어요. 기분이 좋아요 🌸', '공원을 걸었어요. 꽃이 예뻐요!', '공원 벤치에서 쉬었어요. 상쾌해요!'])}\n${deltaText(baseDelta)}`,
      )
    }

    // 기대기 이벤트 (5% 확률)
    if (Math.random() < 0.05) {
      leaniEvents.value++
      const leaniDelta: Partial<Stats> = { sensitivity: 15, mental: 10 }
      applyStats(leaniDelta)
      addMsg(`공원 벤치에서 옆에 있는 누군가에게 기댔어요. 따뜻해요... 💕\n${deltaText(leaniDelta)}`, 'event')
    }
    saveToDB().catch(console.error)
  }

  function _openShop() {
    addMsg(
      '상점에 왔어요! 뭘 살까요? 🏪\n(현재 보유: ' + money.value + '원)',
      'choice',
      [
        ...SHOP_ITEMS.map(item => ({ label: item.label, key: item.key })),
        { label: '← 나가기', key: 'shop_exit' },
      ],
    )
  }

  function _buyItem(choiceKey: string) {
    const item = SHOP_ITEMS.find(i => i.key === choiceKey)
    if (!item) return

    if (money.value < item.price) {
      addMsg(`💸 돈이 부족해요! ${item.price}원이 필요한데 ${money.value}원밖에 없어요.`, 'warning')
      return
    }

    money.value -= item.price
    applyStats(item.delta)
    addMsg(
      `${item.label.split(' (')[0]}을(를) 샀어요! ${item.desc}\n${deltaText(item.delta, -item.price)}`,
      'event',
    )
    saveToDB().catch(console.error)
  }

  function _walkPlaza() {
    const delta: Partial<Stats> = { charm: 8, sensitivity: 5, stress: -10 }
    applyStats(delta)
    addMsg(
      `${pick(['마을 광장에서 사람들과 어울렸어요! 사교성이 올라요 🎭', '광장에서 공연을 구경했어요! 즐거워요.', '광장에서 새로운 감자 친구를 사귀었어요!'])}\n${deltaText(delta)}`,
    )
    saveToDB().catch(console.error)
  }

  // ── 고강도 알바 (HP 4 소모, +40원) ──────────────────────────
  function doHighWork(job: 'nightGuard' | 'tavern' | 'farm' | 'mine') {
    if (!canAfford(4)) return
    dailyHp.value -= 4
    money.value += 30
    counts.value.totalWork++
    setActivity('working')

    if (job === 'nightGuard') {
      counts.value.nightGuard++
      const delta: Partial<Stats> = { charm: 10, mental: 5, stress: 20 }
      applyStats(delta)
      addMsg(
        `${pick(['야간 경비 알바! 밤새 감자밭을 지켰어요 🌙', '무섭지만 야간 경비 완료! 뭔가 멋있어요.', '야간 경비... 밤이 길었지만 해냈어요!'])}\n${deltaText(delta, 40)}`,
      )
    } else if (job === 'tavern') {
      counts.value.tavern++
      const delta: Partial<Stats> = { charm: isDelinquent.value ? 20 : 12, morality: -10, grace: -5, stress: 25 }
      applyStats(delta)
      addMsg(
        `${pick(['주점 바텐더 알바! 기품이... 어디 갔지? 🍺', '주점 알바. 이상한 사람들이 많아요...', '주점에서 온갖 사람 다 봤어요. 뭔가 타락하는 기분.'])}\n${deltaText(delta, 40)}`,
        'warning',
      )
    } else if (job === 'farm') {
      counts.value.farm++
      const delta: Partial<Stats> = { constitution: 12, morality: 5, stress: 18 }
      applyStats(delta)
      addMsg(
        `${pick(['농장 알바! 흙 냄새가 좋아요 🌾', '밭에서 열심히 일했어요. 몸이 튼튼해져요!', '농장 아저씨가 칭찬해줬어요. 뿌듯해요!'])}\n${deltaText(delta, 40)}`,
      )
    } else if (job === 'mine') {
      counts.value.mine++
      const delta: Partial<Stats> = { constitution: 18, grace: -5, stress: 30 }
      applyStats(delta)
      addMsg(
        `${pick(['광산 노동... 엄청 힘들어요 ⛏️', '광산 일은 고되지만 몸은 단단해져요.', '온몸이 흙투성이. 근데 뭔가 씩씩해진 느낌?'])}\n${deltaText(delta, 40)}`,
      )
    }
    saveToDB().catch(console.error)
  }

  // ── 저강도 알바 (HP 3 소모, +25원) ──────────────────────────
  function doLowWork(job: 'cafe' | 'jog') {
    if (!canAfford(3)) return
    dailyHp.value -= 3
    money.value += 25
    counts.value.totalWork++
    setActivity('working')

    if (job === 'cafe') {
      const delta: Partial<Stats> = { charm: 8, sensitivity: 5, stress: 12 }
      applyStats(delta)
      addMsg(
        `${pick(['카페 알바! 커피향이 좋아요 ☕', '카페에서 손님들한테 친절하게 대했어요!', '라떼 아트 배웠어요! 매력이 올라요.'])}\n${deltaText(delta, 25)}`,
      )
    } else if (job === 'jog') {
      counts.value.jog++
      const delta: Partial<Stats> = { constitution: 8, mental: 8, stress: -10 }
      applyStats(delta)
      addMsg(
        `${pick(['아침 조깅! 상쾌해요 🏃', '달리기는 스트레스 해소가 최고예요!', '오늘도 달렸어요. 폐활량이 좋아져요!'])}\n${deltaText(delta, 25)}`,
      )
    }
    saveToDB().catch(console.error)
  }

  // ── 교육 (HP 2 소모, -20원) ──────────────────────────────────
  function doEducation(edu: 'library' | 'etiquette' | 'arts' | 'church') {
    if (!canAfford(2, 20)) {
      if (money.value < 20) addMsg('💸 교육비가 부족해요! 20원이 필요해요. 알바를 먼저 해보세요.', 'warning')
      return
    }
    dailyHp.value -= 2
    money.value -= 20
    setActivity('studying')

    if (edu === 'library') {
      counts.value.library++
      const delta: Partial<Stats> = { intelligence: 15, grace: 3, stress: 5 }
      applyStats(delta)
      addMsg(
        `${pick(['도서관에서 열심히 공부했어요 📚', '책을 세 권이나 읽었어요!', '도서관 사서 선생님이 칭찬해줬어요!'])}\n${deltaText(delta, -20)}`,
      )
    } else if (edu === 'etiquette') {
      counts.value.etiquette++
      const delta: Partial<Stats> = { morality: 15, grace: 12 }
      applyStats(delta)
      if (isDelinquent.value && stats.value.morality >= 35) {
        isDelinquent.value = false
        currentActivity.value = 'idle'
        addMsg(`예절 교육을 받으면서 마음을 고쳐먹었어요! 다시 올바르게 살기로 했어요! ✨\n${deltaText(delta, -20)}`, 'event')
      } else {
        addMsg(
          `${pick(['예절 교육! 인사하는 법부터 배웠어요 🙏', '예절 선생님이 엄격하지만 배우는 게 많아요.', '말투가 고와지는 것 같아요!'])}\n${deltaText(delta, -20)}`,
        )
      }
    } else if (edu === 'arts') {
      counts.value.arts++
      const delta: Partial<Stats> = { sensitivity: 15, grace: 5, stress: -5 }
      applyStats(delta)
      if (Math.random() < 0.2) {
        rainEvents.value++
        const rainDelta: Partial<Stats> = { sensitivity: 10 }
        applyStats(rainDelta)
        addMsg(
          `예술 수업 가는 길에 비가 내렸어요. 빗소리가 너무 아름다워서 한참 서 있었어요... 🌧️\n${deltaText({ ...delta, ...rainDelta }, -20)}`,
          'event',
        )
      } else {
        addMsg(
          `${pick(['예술 교육! 그림 그리는 게 재밌어요 🎨', '음악 수업이었어요. 감성이 풍부해져요!', '예술이 이렇게 깊은 거였구나...'])}\n${deltaText(delta, -20)}`,
        )
      }
    } else if (edu === 'church') {
      counts.value.church++
      const delta: Partial<Stats> = { morality: 10, mental: 10, stress: -10 }
      applyStats(delta)
      addMsg(
        `${pick(['성당에서 미사를 드렸어요. 마음이 평온해요 ⛪', '성당 교육! 좋은 사람이 되어야겠다고 생각했어요.', '신부님의 말씀이 마음에 와닿았어요.'])}\n${deltaText(delta, -20)}`,
      )
    }
    saveToDB().catch(console.error)
  }

  // ── 휴식 (HP 0 소모) ─────────────────────────────────────────
  function doRest(restType: 'home' | 'walk' | 'street') {
    if (phase.value !== 'day') return
    if (!canAfford(1)) return
    dailyHp.value -= 1
    setActivity('resting')

    if (restType === 'home') {
      const delta: Partial<Stats> = { stress: -25, mental: 5 }
      applyStats(delta)
      addMsg(
        `${pick(['집에서 푹 쉬었어요 😴', '낮잠을 실컷 잤어요. 스트레스가 풀렸어요!', '뒹굴뒹굴... 행복해요.'])}\n${deltaText(delta)}`,
      )
    } else if (restType === 'walk') {
      // 목적지 선택 (채팅 인터랙션)
      addMsg(
        '산책을 나갈 거예요! 어디로 갈까요? 🚶',
        'choice',
        [
          { label: '🌳 공원',    key: 'loc_park'  },
          { label: '🏪 상점',    key: 'loc_shop'  },
          { label: '🎭 마을 광장', key: 'loc_plaza' },
        ],
      )
    } else if (restType === 'street') {
      counts.value.street++
      const delta: Partial<Stats> = { sensitivity: 10, stress: -10 }
      applyStats(delta)
      if (Math.random() < 0.15) {
        rustleEvents.value++
        const rustleDelta: Partial<Stats> = { sensitivity: 15 }
        applyStats(rustleDelta)
        addMsg(
          `거리 공연 중에 봉지 하나가 바스락거렸어요. 갑자기 영감이 떠올랐어요! 🎵\n${deltaText({ ...delta, ...rustleDelta })}`,
          'event',
        )
      } else {
        addMsg(
          `${pick(['거리 공연! 사람들이 박수를 쳐줬어요 🎸', '버스킹을 했어요. 감성이 터지는 것 같아요.', '지나가던 사람이 동전을 던져줬어요.'])}\n${deltaText(delta)}`,
        )
      }
    }
    saveToDB().catch(console.error)
  }

  // ── 다음 날로 ────────────────────────────────────────────────
  function nextDay() {
    if (phase.value !== 'day') return

    if (stats.value.stress >= 80) {
      const delta: Partial<Stats> = { mental: -10 }
      applyStats(delta)
      addMsg(`스트레스가 너무 높아서 멘탈이 깎였어요... 😵\n${deltaText(delta)}`, 'warning')
    }

    if (isDelinquent.value) {
      const delta: Partial<Stats> = { morality: -3 }
      applyStats(delta)
    }

    if (stats.value.morality <= 0 && stats.value.stress >= 90) {
      triggerEnding()
      return
    }

    day.value++
    if (day.value > maxDay) {
      triggerEnding()
      return
    }

    dailyHp.value = maxDailyHp
    addMsg(`☀️ ${day.value}일째 아침이 밝았어요!`)
    saveToDB().catch(console.error)
  }

  function triggerEnding() {
    phase.value = 'ended'
    const result = calcEnding()
    ending.value = result.name
    endingDetail.value = result.detail
    addMsg(`🎬 ${result.name}`, 'ending')
    addMsg(result.detail, 'ending')
    saveToDB().catch(console.error)
  }

  function calcEnding(): { name: string; detail: string } {
    const s = stats.value
    const c = counts.value

    if (s.morality <= 5 && s.stress >= 90) {
      return { name: '썩은 감자 🥀 [F 엔딩]', detail: '도덕성 0, 스트레스 MAX... 버려진 불량 감자가 되었어요.' }
    }
    if (s.grace >= 150 && s.intelligence >= 150 && c.totalWork === 0) {
      return { name: '느끼 - 청담동 갤러리 도슨트 🎨 [S 엔딩]', detail: '알바 한 번 없는 순수 혈통! 왕공 무도회에 초청받았어요.' }
    }
    if ((s.intelligence + s.grace + s.morality + s.charm) >= 280 && c.library >= 10) {
      return { name: '감자샐러드 - 두 얼굴의 학생회장 🥗 [S 엔딩]', detail: '도서관 공부와 높은 복합 스탯으로 전교 학생회장이 됐어요!' }
    }
    if (c.jog >= 15 && s.stress < 50 && s.morality >= 40) {
      return { name: '해쉬브라운 - 아침 7시 조깅러 🥞 [A 엔딩]', detail: '철저한 자기관리! 스트레스 낮게 유지하며 건강하게 살아요.' }
    }
    if (c.nightGuard >= 8 && s.grace >= 60 && s.intelligence >= 60) {
      return { name: '알감자 조림 - K-직장인 대리 👔 [A 엔딩]', detail: '야간 경비 베테랑! 커피 없이는 출근 못 해요.' }
    }
    if (s.charm >= 150 && s.morality <= 20) {
      return { name: '로디드 프라이 - 뒷골목의 타락한 자 🍟 [B 엔딩]', detail: '주점 알바와 불량 생활... 천박하고 화려한 삶이에요.' }
    }
    if (s.charm >= 120 && s.grace < 50) {
      return { name: '감자튀김 - 동네 최고의 인싸 🍟 [B 엔딩]', detail: '마을 광장의 인기스타! 케첩 마요 없이는 못 살아요.' }
    }
    if (s.sensitivity >= 120 && c.street >= 5) {
      return { name: '감자집 - 유리멘탈 INFP 감자 🎸 [C 엔딩]', detail: '거리 공연과 감성... 봉지 바스락 소리에 영감을 받아요.' }
    }
    if (c.farm >= 8 && c.church >= 3 && s.morality >= 60) {
      return { name: '옹심이 - 시골집 투박한 막둥이 🍲 [C 엔딩]', detail: '농장과 성당을 오가는 순박하고 따뜻한 삶이에요.' }
    }
    if (s.constitution >= 120 && s.grace <= 20 && c.mine >= 5) {
      return { name: '푸틴 - 비 오는 날의 거친 감자 🍲 [C 엔딩]', detail: '광산에서 단련된 억세고 거친 근력의 소유자예요.' }
    }
    if (s.sensitivity >= 150 && leaniEvents.value >= 1) {
      return { name: '매쉬드 포테이토 - 정 많은 로맨티스트 🫕 [H 엔딩]', detail: '기대기 이벤트 발생! 따뜻한 감성 충만 감자예요.' }
    }
    if (s.sensitivity >= 100 && c.arts >= 8 && rainEvents.value >= 1) {
      return { name: '감자전 - 비 오는 날의 예술가 🥞 [H 엔딩]', detail: '비 오는 날에 영감을 받는 예술 감자예요.' }
    }
    return { name: '그냥 삶은 감자 😢 [기본 엔딩]', detail: '특별한 건 없지만... 그냥 평범하게 살아요.' }
  }

  function resetGame() {
    stats.value = { constitution: 30, intelligence: 20, grace: 20, charm: 20, sensitivity: 20, morality: 50, mental: 50, stress: 0 }
    day.value = 1
    dailyHp.value = maxDailyHp
    money.value = 300
    currentActivity.value = 'idle'
    phase.value = 'day'
    ending.value = null
    endingDetail.value = null
    chatLog.value = []
    isDelinquent.value = false
    kogumaEncountered.value = false
    counts.value = { nightGuard: 0, tavern: 0, farm: 0, mine: 0, jog: 0, library: 0, etiquette: 0, arts: 0, church: 0, street: 0, totalWork: 0 }
    rainEvents.value = 0
    leaniEvents.value = 0
    rustleEvents.value = 0
    msgId = 0
    addMsg(`안녕하세요! 저는 ${potatoName.value || '감자'}예요. 잘 키워주세요! 🥔`)
    addMsg('💰 시작 용돈 300원을 받았어요! 교육비는 회당 20원이에요.')
  }

  // DB에서 불러와서 상태 복원
  function loadFromDb(potato: any) {
    potatoName.value = potato.name
    birthday.value = potato.birthday
    day.value = potato.day
    dailyHp.value = potato.dailyHp
    phase.value = potato.phase as 'day' | 'ended'
    ending.value = potato.ending ?? null
    endingDetail.value = potato.endingDetail ?? null
    stats.value = {
      constitution: potato.constitution,
      intelligence: potato.intelligence,
      grace: potato.grace,
      charm: potato.charm,
      sensitivity: potato.sensitivity,
      morality: potato.morality,
      mental: potato.mental,
      stress: potato.stress,
    }
    money.value = potato.money
    isDelinquent.value = potato.isDelinquent
    kogumaEncountered.value = potato.kogumaEncountered
    counts.value = potato.counts ?? { nightGuard: 0, tavern: 0, farm: 0, mine: 0, jog: 0, library: 0, etiquette: 0, arts: 0, church: 0, street: 0, totalWork: 0 }
    rainEvents.value = potato.rainEvents ?? 0
    leaniEvents.value = potato.leaniEvents ?? 0
    rustleEvents.value = potato.rustleEvents ?? 0
    chatLog.value = []
    msgId = 0
    currentActivity.value = isDelinquent.value ? 'delinquent' : 'idle'
    addMsg(`다시 돌아왔어요! ${potatoName.value}의 ${day.value}일째를 시작해요! ☀️`)
  }

  // 새 게임 시작 (이름/생일 설정 후)
  function newGame(name: string, bday: string) {
    potatoName.value = name
    birthday.value = bday
    resetGame()
  }

  // DB에 현재 상태 저장
  async function saveToDB() {
    await updatePotato({
      day: day.value,
      dailyHp: dailyHp.value,
      phase: phase.value,
      ending: ending.value,
      endingDetail: endingDetail.value,
      constitution: stats.value.constitution,
      intelligence: stats.value.intelligence,
      grace: stats.value.grace,
      charm: stats.value.charm,
      sensitivity: stats.value.sensitivity,
      morality: stats.value.morality,
      mental: stats.value.mental,
      stress: stats.value.stress,
      money: money.value,
      isDelinquent: isDelinquent.value,
      kogumaEncountered: kogumaEncountered.value,
      counts: counts.value,
      rainEvents: rainEvents.value,
      leaniEvents: leaniEvents.value,
      rustleEvents: rustleEvents.value,
    })
  }

  return {
    potatoName, birthday,
    stats, day, maxDay, dailyHp, maxDailyHp, money,
    currentActivity, phase, ending, endingDetail, chatLog,
    isDelinquent, kogumaEncountered, counts,
    rainEvents, leaniEvents, rustleEvents,
    doHighWork, doLowWork, doEducation, doRest,
    nextDay, resetGame, newGame, loadFromDb, saveToDB, resolveChoice, canAfford,
  }
})
