import api from './index'

export interface PotatoData {
  id?: number
  userId?: number
  name: string
  birthday: string
  day: number
  dailyHp: number
  phase: string
  ending: string | null
  endingDetail: string | null
  constitution: number
  intelligence: number
  grace: number
  charm: number
  sensitivity: number
  morality: number
  mental: number
  stress: number
  money: number
  isDelinquent: boolean
  kogumaEncountered: boolean
  counts: Record<string, number>
  rainEvents: number
  leaniEvents: number
  rustleEvents: number
}

export async function getMyPotato(): Promise<PotatoData | null> {
  try {
    const res = await api.get('/potato')
    return res.data
  } catch {
    return null
  }
}

export async function createPotato(name: string, birthday: string): Promise<PotatoData> {
  const res = await api.post('/potato', { name, birthday })
  return res.data
}

export async function updatePotato(data: Partial<PotatoData>): Promise<void> {
  await api.put('/potato', data)
}
