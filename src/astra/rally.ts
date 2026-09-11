export const STORAGE_KEY = 'stamprally:astra:v1';

export const SPOTS = [
  { id: 'spot-1', name: '시작 광장', caption: '오늘의 산책이 시작되는 곳', icon: 'flag', color: 'peach' },
  { id: 'spot-2', name: '동네 책방', caption: '책장 사이에서 찾는 작은 쉼', icon: 'book', color: 'lavender' },
  { id: 'spot-3', name: '골목 카페', caption: '커피 향을 따라 잠깐의 여유', icon: 'coffee', color: 'yellow' },
  { id: 'spot-4', name: '작은 공원', caption: '초록빛 나무 아래 깊은 숨', icon: 'tree', color: 'green' },
  { id: 'spot-5', name: '전망대', caption: '한눈에 담는 우리 동네', icon: 'mountain', color: 'blue' },
] as const;

export type Spot = typeof SPOTS[number];
export type SpotId = Spot['id'];
export type Card = {
  version: 1;
  joinedAt: string | null;
  visits: Partial<Record<SpotId, string>>;
};
export type ScanResult = {
  kind: 'added' | 'duplicate' | 'invalid' | 'not-joined';
  card: Card;
  spot?: Spot;
};

export const emptyCard = (): Card => ({ version: 1, joinedAt: null, visits: {} });

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isDate(value: unknown): value is string {
  return typeof value === 'string' && Number.isFinite(Date.parse(value));
}

export function parseCard(raw: string): Card | null {
  try {
    const value: unknown = JSON.parse(raw);
    if (!isObject(value) || value.version !== 1 ||
      !(value.joinedAt === null || isDate(value.joinedAt)) || !isObject(value.visits)) return null;
    const visits: Card['visits'] = {};
    for (const [id, date] of Object.entries(value.visits)) {
      const spot = SPOTS.find((item) => item.id === id);
      if (!spot || !isDate(date) || value.joinedAt === null) return null;
      visits[spot.id] = date;
    }
    return { version: 1, joinedAt: value.joinedAt, visits };
  } catch {
    return null;
  }
}

export function scanCard(card: Card, payload: string, now: string): ScanResult {
  if (!card.joinedAt) return { kind: 'not-joined', card };
  const spot = SPOTS.find((item) => payload === `stamprally:v1:${item.id}`);
  if (!spot) return { kind: 'invalid', card };
  if (card.visits[spot.id]) return { kind: 'duplicate', card, spot };
  return { kind: 'added', card: { ...card, visits: { ...card.visits, [spot.id]: now } }, spot };
}

export function visitTime(value: string, locale = 'ko-KR'): string {
  return new Intl.DateTimeFormat(locale, {
    month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false,
  }).format(new Date(value));
}
