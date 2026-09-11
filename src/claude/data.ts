export const EVENT_NAME = '우리 동네 스탬프 랠리'

export const QR_PREFIX = 'stamprally:v1:'

export interface Spot {
  id: string
  name: string
  code: string
  emoji: string
  hint: string
}

export const SPOTS: readonly Spot[] = [
  { id: 'spot-1', name: '시작 광장', code: 'stamprally:v1:spot-1', emoji: '⛲', hint: '랠리의 출발점, 안내 부스 옆' },
  { id: 'spot-2', name: '동네 책방', code: 'stamprally:v1:spot-2', emoji: '📚', hint: '계산대 앞 스탠드' },
  { id: 'spot-3', name: '골목 카페', code: 'stamprally:v1:spot-3', emoji: '☕', hint: '입구 메뉴판 아래' },
  { id: 'spot-4', name: '작은 공원', code: 'stamprally:v1:spot-4', emoji: '🌳', hint: '벤치 옆 안내판' },
  { id: 'spot-5', name: '전망대', code: 'stamprally:v1:spot-5', emoji: '🔭', hint: '전망대 난간 안내판' },
]

export const TOTAL_SPOTS = SPOTS.length

export function findSpotByCode(code: string): Spot | undefined {
  return SPOTS.find((spot) => spot.code === code)
}

export function findSpotById(id: string): Spot | undefined {
  return SPOTS.find((spot) => spot.id === id)
}
