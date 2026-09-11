import { BrowserQRCodeReader, IScannerControls } from '@zxing/browser';
import { Result } from '@zxing/library';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { cameraError, decodeImage, startCamera } from './qr';

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => { resolve = done; });
  return { promise, resolve };
}

function setupCamera() {
  const stop = vi.fn();
  const stream = { getTracks: () => [{ stop }] } as unknown as MediaStream;
  const getUserMedia = vi.fn().mockResolvedValue(stream);
  Object.defineProperty(navigator, 'mediaDevices', { configurable: true, value: { getUserMedia } });
  vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue();
  const video = document.createElement('video');
  const controller = new AbortController();
  const decoderStop = vi.fn();
  const decode = vi.spyOn(BrowserQRCodeReader.prototype, 'decodeFromStream').mockResolvedValue({ stop: decoderStop });
  return { stop, stream, getUserMedia, video, controller, decoderStop, decode };
}

describe('camera lifecycle', () => {
  it('requests the rear camera without audio and releases streams on abort', async () => {
    const { stop, getUserMedia, video, controller, decoderStop } = setupCamera();
    await startCamera(video, vi.fn(), controller.signal);
    expect(getUserMedia).toHaveBeenCalledWith({ audio: false, video: { facingMode: { ideal: 'environment' } } });
    controller.abort();
    expect(stop).toHaveBeenCalled();
    expect(decoderStop).toHaveBeenCalled();
    expect(video.srcObject).toBeNull();
  });

  it('releases late permission grants after the scanner has closed', async () => {
    const { stop, stream, getUserMedia, video, controller, decode } = setupCamera();
    const permission = deferred<MediaStream>();
    getUserMedia.mockReturnValue(permission.promise);
    const pending = startCamera(video, vi.fn(), controller.signal);
    controller.abort();
    permission.resolve(stream);
    await pending;
    expect(stop).toHaveBeenCalled();
    expect(decode).not.toHaveBeenCalled();
  });

  it('releases decoder controls that arrive after cancellation', async () => {
    const { video, controller, decode, decoderStop } = setupCamera();
    const controls = deferred<IScannerControls>();
    decode.mockReturnValue(controls.promise);
    const pending = startCamera(video, vi.fn(), controller.signal);
    await vi.waitFor(() => expect(decode).toHaveBeenCalled());
    controller.abort();
    controls.resolve({ stop: decoderStop });
    await pending;
    expect(decoderStop).toHaveBeenCalled();
  });

  it('does not detach a newer preview when an older permission request resolves', async () => {
    const { stream, getUserMedia, video, controller } = setupCamera();
    const permission = deferred<MediaStream>();
    getUserMedia.mockReturnValueOnce(permission.promise);
    const pending = startCamera(video, vi.fn(), controller.signal);
    controller.abort();
    const newer = { getTracks: () => [] } as unknown as MediaStream;
    video.srcObject = newer;
    permission.resolve(stream);
    await pending;
    expect(video.srcObject).toBe(newer);
  });

  it('stops the stream on decoder startup failure', async () => {
    const { video, controller, decode, stop } = setupCamera();
    decode.mockRejectedValue(new Error('video failed'));
    await expect(startCamera(video, vi.fn(), controller.signal)).rejects.toThrow('video failed');
    expect(stop).toHaveBeenCalled();
    expect(video.srcObject).toBeNull();
  });

  it('ignores frames received after abort', async () => {
    const { video, controller, decode } = setupCamera();
    const onDecode = vi.fn();
    await startCamera(video, onDecode, controller.signal);
    controller.abort();
    const callback = decode.mock.calls[0][2];
    callback({ getText: () => 'stamprally:v1:spot-1' } as Result, undefined, { stop: vi.fn() });
    expect(onDecode).not.toHaveBeenCalled();
  });

  it.each([
    ['NotAllowedError', '권한이 필요해요'],
    ['NotFoundError', '카메라를 찾을 수 없어요'],
    ['NotReadableError', '다른 앱에서'],
    ['UnknownError', '다시 시도'],
  ])('provides recoverable guidance for %s', (name, message) => {
    expect(cameraError(new DOMException('error', name))).toContain(message);
  });
});

describe('image decoding', () => {
  beforeEach(() => {
    Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: vi.fn().mockReturnValue('blob:test-image') });
    Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: vi.fn() });
  });

  it('returns the unmodified decoded payload and releases the image URL', async () => {
    vi.spyOn(BrowserQRCodeReader.prototype, 'decodeFromImageUrl').mockResolvedValue({ getText: () => 'stamprally:v1:spot-1 ' } as Result);
    expect(await decodeImage(new File(['qr'], 'qr.png', { type: 'image/png' }))).toBe('stamprally:v1:spot-1 ');
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:test-image');
  });

  it('releases the URL and provides a retry message for unreadable images', async () => {
    vi.spyOn(BrowserQRCodeReader.prototype, 'decodeFromImageUrl').mockRejectedValue(new Error('not found'));
    await expect(decodeImage(new File(['qr'], 'qr.png', { type: 'image/png' }))).rejects.toThrow('QR을 읽지 못했어요');
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:test-image');
  });

  it('rejects non-images and oversized files before decoding', async () => {
    await expect(decodeImage(new File(['hello'], 'test.txt', { type: 'text/plain' }))).rejects.toThrow('이미지 파일');
    const large = new File([new Uint8Array(12 * 1024 * 1024 + 1)], 'large.png', { type: 'image/png' });
    await expect(decodeImage(large)).rejects.toThrow('12MB');
    expect(URL.createObjectURL).not.toHaveBeenCalled();
  });
});
