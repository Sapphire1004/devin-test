import { readFileSync } from 'node:fs';
import { BinaryBitmap, HybridBinarizer, QRCodeReader, RGBLuminanceSource } from '@zxing/library';
import { PNG } from 'pngjs';
import { expect, it } from 'vitest';
import { emptyCard, scanCard } from './rally';

it.each([
  ['spot-1', 'stamprally:v1:spot-1', 'added'],
  ['spot-2', 'stamprally:v1:spot-2', 'added'],
  ['spot-3', 'stamprally:v1:spot-3', 'added'],
  ['spot-4', 'stamprally:v1:spot-4', 'added'],
  ['spot-5', 'stamprally:v1:spot-5', 'added'],
  ['invalid', 'hello', 'invalid'],
  ['unknown', 'stamprally:v1:spot-99', 'invalid'],
  ['other-event', 'other-rally:v1:spot-1', 'invalid'],
  ['extra-whitespace', 'stamprally:v1:spot-1 ', 'invalid'],
])('decodes actual PNG pixels and validates %s', (filename, payload, kind) => {
  const png = PNG.sync.read(readFileSync(new URL(`../../fixtures/qr/${filename}.png`, import.meta.url)));
  const pixels = new Uint8ClampedArray(png.width * png.height);
  for (let i = 0; i < pixels.length; i += 1) {
    const offset = i * 4;
    pixels[i] = (png.data[offset] + png.data[offset + 1] * 2 + png.data[offset + 2]) / 4;
  }
  const bitmap = new BinaryBitmap(new HybridBinarizer(new RGBLuminanceSource(pixels, png.width, png.height)));
  const decoded = new QRCodeReader().decode(bitmap).getText();
  expect(decoded).toBe(payload);
  const now = '2026-09-11T10:00:00Z';
  expect(scanCard({ ...emptyCard(), joinedAt: now }, decoded, now).kind).toBe(kind);
});
