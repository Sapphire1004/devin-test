import jsQR from 'jsqr'

export interface PixelData {
  data: Uint8ClampedArray
  width: number
  height: number
}

export function decodeQrFromPixels(pixels: PixelData): string | null {
  const result = jsQR(pixels.data, pixels.width, pixels.height, { inversionAttempts: 'attemptBoth' })
  return result && result.data ? result.data : null
}

export type ImageDecodeResult =
  | { status: 'decoded'; text: string }
  | { status: 'no-qr' }
  | { status: 'unreadable-file' }

const MAX_DIMENSION = 1600

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve(img)
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('image load failed'))
    }
    img.src = url
  })
}

function drawScaled(img: HTMLImageElement, scale: number): PixelData | null {
  const width = Math.max(1, Math.round(img.naturalWidth * scale))
  const height = Math.max(1, Math.round(img.naturalHeight * scale))
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) return null
  ctx.fillStyle = '#fff'
  ctx.fillRect(0, 0, width, height)
  ctx.drawImage(img, 0, 0, width, height)
  return ctx.getImageData(0, 0, width, height)
}

export async function decodeQrFromFile(file: File): Promise<ImageDecodeResult> {
  if (!file.type.startsWith('image/')) return { status: 'unreadable-file' }

  let img: HTMLImageElement
  try {
    img = await loadImage(file)
  } catch {
    return { status: 'unreadable-file' }
  }
  if (!img.naturalWidth || !img.naturalHeight) return { status: 'unreadable-file' }

  const largest = Math.max(img.naturalWidth, img.naturalHeight)
  const baseScale = largest > MAX_DIMENSION ? MAX_DIMENSION / largest : 1
  // Try a few sizes: very large or very small codes decode better after resampling.
  const scales = [baseScale, baseScale * 0.5, Math.min(1, baseScale * 2)]

  for (const scale of scales) {
    const pixels = drawScaled(img, scale)
    if (!pixels) return { status: 'unreadable-file' }
    const text = decodeQrFromPixels(pixels)
    if (text) return { status: 'decoded', text }
  }
  return { status: 'no-qr' }
}
