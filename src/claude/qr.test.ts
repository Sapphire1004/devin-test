import { describe, expect, it } from 'vitest'
import { parseQrPayload } from './qr'

describe('parseQrPayload', () => {
  it('accepts the five official spot codes', () => {
    for (let i = 1; i <= 5; i++) {
      const result = parseQrPayload(`stamprally:v1:spot-${i}`)
      expect(result.kind).toBe('spot')
      if (result.kind === 'spot') expect(result.spot.id).toBe(`spot-${i}`)
    }
  })

  it('rejects unregistered spot codes from this rally', () => {
    expect(parseQrPayload('stamprally:v1:spot-99').kind).toBe('unknown-spot')
  })

  it('rejects codes from other events', () => {
    expect(parseQrPayload('other-rally:v1:spot-1').kind).toBe('other-event')
  })

  it('rejects arbitrary text', () => {
    expect(parseQrPayload('hello').kind).toBe('invalid')
    expect(parseQrPayload('').kind).toBe('invalid')
  })

  it('requires exact match (case and prefix)', () => {
    expect(parseQrPayload('STAMPRALLY:V1:SPOT-1').kind).not.toBe('spot')
    expect(parseQrPayload('stamprally:v1:spot-1-extra').kind).toBe('unknown-spot')
    expect(parseQrPayload('stamprally:v2:spot-1').kind).toBe('other-event')
  })
})
