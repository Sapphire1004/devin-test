import QRCode from 'qrcode'
import { describe, expect, it } from 'vitest'
import { decodeQrFromPixels, type PixelData } from './decode'

function renderQrToPixels(text: string, scale = 6, margin = 4): PixelData {
  const qr = QRCode.create(text, { errorCorrectionLevel: 'M' })
  const size = qr.modules.size
  const dim = (size + margin * 2) * scale
  const data = new Uint8ClampedArray(dim * dim * 4).fill(255)
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (!qr.modules.get(y, x)) continue
      for (let dy = 0; dy < scale; dy++) {
        for (let dx = 0; dx < scale; dx++) {
          const px = (x + margin) * scale + dx
          const py = (y + margin) * scale + dy
          const idx = (py * dim + px) * 4
          data[idx] = 0
          data[idx + 1] = 0
          data[idx + 2] = 0
        }
      }
    }
  }
  return { data, width: dim, height: dim }
}

describe('decodeQrFromPixels', () => {
  it('decodes each official spot QR', () => {
    for (let i = 1; i <= 5; i++) {
      const text = `stamprally:v1:spot-${i}`
      expect(decodeQrFromPixels(renderQrToPixels(text))).toBe(text)
    }
  })

  it('decodes the negative-case QR payloads verbatim', () => {
    for (const text of ['hello', 'stamprally:v1:spot-99', 'other-rally:v1:spot-1']) {
      expect(decodeQrFromPixels(renderQrToPixels(text))).toBe(text)
    }
  })

  it('returns null when no QR is present', () => {
    const blank: PixelData = { data: new Uint8ClampedArray(64 * 64 * 4).fill(255), width: 64, height: 64 }
    expect(decodeQrFromPixels(blank)).toBeNull()
  })
})
