import { BrowserQRCodeReader, IScannerControls } from '@zxing/browser';

export function cameraError(error: unknown): string {
  if (error instanceof Error) {
    if (['NotAllowedError', 'PermissionDeniedError', 'SecurityError'].includes(error.name)) {
      return '카메라 권한이 필요해요. 브라우저 설정에서 허용한 뒤 다시 시도하거나 QR 이미지를 업로드해 주세요.';
    }
    if (['NotFoundError', 'DevicesNotFoundError'].includes(error.name)) {
      return '카메라를 찾을 수 없어요. QR 이미지 업로드로 스탬프를 모을 수 있어요.';
    }
    if (['NotReadableError', 'TrackStartError'].includes(error.name)) {
      return '카메라를 사용할 수 없어요. 다른 앱에서 사용 중인지 확인하고 다시 시도해 주세요.';
    }
  }
  return '카메라를 시작하지 못했어요. 다시 시도하거나 QR 이미지를 업로드해 주세요.';
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

export async function decodeImage(file: File): Promise<string> {
  if (!file.type.startsWith('image/')) throw new Error('이미지 파일을 선택해 주세요. PNG, JPG, WebP를 권장합니다.');
  if (file.size > 12 * 1024 * 1024) throw new Error('12MB 이하의 이미지를 선택해 주세요.');
  const url = URL.createObjectURL(file);
  try {
    const result = await new BrowserQRCodeReader().decodeFromImageUrl(url);
    return result.getText();
  } catch {
    throw new Error('QR을 읽지 못했어요. 코드 전체가 선명하게 보이는 이미지로 다시 시도해 주세요.');
  } finally {
    URL.revokeObjectURL(url);
  }
}
