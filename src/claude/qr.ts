import { findSpotByCode, QR_PREFIX, type Spot } from './data'

export type QrParseResult =
  | { kind: 'spot'; spot: Spot }
  | { kind: 'unknown-spot'; code: string }
  | { kind: 'other-event'; code: string }
  | { kind: 'invalid'; code: string }

const OTHER_EVENT_PATTERN = /^[a-z0-9-]+:v\d+:[a-z0-9-]+$/i

export function parseQrPayload(raw: string): QrParseResult {
  const code = raw.trim()
  const spot = findSpotByCode(code)
  if (spot) return { kind: 'spot', spot }
  if (code.startsWith(QR_PREFIX)) return { kind: 'unknown-spot', code }
  if (OTHER_EVENT_PATTERN.test(code)) return { kind: 'other-event', code }
  return { kind: 'invalid', code }
}

export function describeParseFailure(result: Exclude<QrParseResult, { kind: 'spot' }>): string {
  switch (result.kind) {
    case 'unknown-spot':
      return '이 랠리에 등록되지 않은 장소 QR입니다. 안내판의 공식 QR인지 확인해 주세요.'
    case 'other-event':
      return '다른 행사의 QR입니다. 우리 동네 스탬프 랠리 QR을 스캔해 주세요.'
    case 'invalid':
      return '스탬프 랠리 QR이 아닙니다. 장소에 있는 QR을 다시 스캔해 주세요.'
  }
}
