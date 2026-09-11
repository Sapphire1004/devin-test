import { BrowserQRCodeReader, IScannerControls } from '@zxing/browser';
import { Translate, translateKorean } from './i18n';

export function cameraError(error: unknown, t: Translate = translateKorean): string {
  if (error instanceof Error || error instanceof DOMException) {
    if (['NotAllowedError', 'PermissionDeniedError', 'SecurityError'].includes(error.name)) {
      return t('cameraDenied');
    }
    if (['NotFoundError', 'DevicesNotFoundError'].includes(error.name)) {
      return t('cameraNotFound');
    }
    if (['NotReadableError', 'TrackStartError'].includes(error.name)) {
      return t('cameraNotReadable');
    }
  }
  return t('cameraFailed');
}

export async function startCamera(
  video: HTMLVideoElement,
  onDecode: (payload: string) => void,
  signal: AbortSignal,
): Promise<void> {
  if (signal.aborted) return;
  let stream: MediaStream | undefined;
  let controls: IScannerControls | undefined;
  const source = document.createElement('video');
  const stop = () => {
    controls?.stop();
    stream?.getTracks().forEach((track) => track.stop());
    if (stream && video.srcObject === stream) video.srcObject = null;
  };
  signal.addEventListener('abort', stop, { once: true });
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      audio: false, video: { facingMode: { ideal: 'environment' } },
    });
    if (signal.aborted) {
      stop();
      return;
    }
    video.srcObject = stream;
    await video.play();
    if (signal.aborted) {
      stop();
      return;
    }
    controls = await new BrowserQRCodeReader(undefined, {
      delayBetweenScanAttempts: 250, delayBetweenScanSuccess: 1000,
    }).decodeFromStream(stream, source, (result) => {
      if (result && !signal.aborted) onDecode(result.getText());
    });
    if (signal.aborted) stop();
  } catch (error) {
    stop();
    signal.removeEventListener('abort', stop);
    if (!signal.aborted) throw error;
  }
}

export async function decodeImage(file: File, t: Translate = translateKorean): Promise<string> {
  if (!file.type.startsWith('image/')) throw new Error(t('imageInvalidType'));
  if (file.size > 12 * 1024 * 1024) throw new Error(t('imageTooLarge'));
  const url = URL.createObjectURL(file);
  try {
    const result = await new BrowserQRCodeReader().decodeFromImageUrl(url);
    return result.getText();
  } catch {
    throw new Error(t('imageNoQR'));
  } finally {
    URL.revokeObjectURL(url);
  }
}
