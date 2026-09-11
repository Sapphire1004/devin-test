import { mkdir } from 'node:fs/promises';
import QRCode from 'qrcode';

const directory = new URL('../fixtures/qr/', import.meta.url);
await mkdir(directory, { recursive: true });
const payloads = {
  'spot-1': 'stamprally:v1:spot-1',
  'spot-2': 'stamprally:v1:spot-2',
  'spot-3': 'stamprally:v1:spot-3',
  'spot-4': 'stamprally:v1:spot-4',
  'spot-5': 'stamprally:v1:spot-5',
  invalid: 'hello',
  unknown: 'stamprally:v1:spot-99',
  'other-event': 'other-rally:v1:spot-1',
  'extra-whitespace': 'stamprally:v1:spot-1 ',
  'invalid-hello': 'hello',
  'unknown-spot-99': 'stamprally:v1:spot-99',
  'other-rally-spot-1': 'other-rally:v1:spot-1',
};
await Promise.all(Object.entries(payloads).map(([name, text]) =>
  QRCode.toFile(new URL(`${name}.png`, directory).pathname, text, {
    width: 600, margin: 4, errorCorrectionLevel: 'M',
  }),
));
console.log(`Generated ${Object.keys(payloads).length} QR images in fixtures/qr.`);
