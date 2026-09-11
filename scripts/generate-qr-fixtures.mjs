// Generates QR PNG fixtures used for image-upload testing.
// Usage: npm run qr:fixtures
import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import QRCode from 'qrcode'

const outDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../fixtures/qr')

const fixtures = [
  ['spot-1', 'stamprally:v1:spot-1'],
  ['spot-2', 'stamprally:v1:spot-2'],
  ['spot-3', 'stamprally:v1:spot-3'],
  ['spot-4', 'stamprally:v1:spot-4'],
  ['spot-5', 'stamprally:v1:spot-5'],
  ['invalid-hello', 'hello'],
  ['unknown-spot-99', 'stamprally:v1:spot-99'],
  ['other-rally-spot-1', 'other-rally:v1:spot-1'],
]

await mkdir(outDir, { recursive: true })
for (const [name, text] of fixtures) {
  const file = path.join(outDir, `${name}.png`)
  await QRCode.toFile(file, text, { width: 512, margin: 4, errorCorrectionLevel: 'M' })
  console.log(`${file} <- ${text}`)
}
