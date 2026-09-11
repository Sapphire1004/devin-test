import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { Scanner } from './Scanner';
import { startCamera } from './qr';
import { emptyCard, scanCard } from './rally';

vi.mock('./qr', () => ({ startCamera: vi.fn().mockResolvedValue(undefined), decodeImage: vi.fn(), cameraError: () => '카메라 권한이 필요해요. 이미지 업로드를 이용해 주세요.' }));

beforeEach(() => {
  vi.stubGlobal('isSecureContext', true);
  Object.defineProperty(navigator, 'mediaDevices', { configurable: true, value: { getUserMedia: vi.fn() } });
});
afterEach(() => { vi.useRealTimers(); });

const onScan = (payload: string) => scanCard({ ...emptyCard(), joinedAt: '2026-09-11T10:00:00Z' }, payload, '2026-09-11T10:05:00Z');

it('aborts camera scanning on tab change, page hiding and unmount', async () => {
  const user = userEvent.setup();
  const view = render(<Scanner onScan={onScan} onClose={vi.fn()} />);
  await user.click(screen.getByRole('button', { name: '카메라 켜기' }));
  const first = vi.mocked(startCamera).mock.calls.at(-1)![2];
  await user.click(screen.getByRole('button', { name: '이미지 업로드' }));
  expect(first.aborted).toBe(true);
  await user.click(screen.getByRole('button', { name: '카메라 스캔' }));
  await user.click(screen.getByRole('button', { name: '카메라 켜기' }));
  const second = vi.mocked(startCamera).mock.calls.at(-1)![2];
  fireEvent(window, new Event('pagehide'));
  expect(second.aborted).toBe(true);
  view.unmount();
  const next = render(<Scanner onScan={onScan} onClose={vi.fn()} />);
  await user.click(screen.getByRole('button', { name: '카메라 켜기' }));
  const third = vi.mocked(startCamera).mock.calls.at(-1)![2];
  next.unmount();
  expect(third.aborted).toBe(true);
});

it('provides camera failure guidance and keeps image upload available', async () => {
  const user = userEvent.setup();
  vi.mocked(startCamera).mockRejectedValueOnce(new DOMException('denied', 'NotAllowedError'));
  render(<Scanner onScan={onScan} onClose={vi.fn()} />);
  await user.click(screen.getByRole('button', { name: '카메라 켜기' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('카메라 권한이 필요해요');
  await user.click(screen.getByRole('button', { name: '이미지 업로드' }));
  expect(screen.getByLabelText('QR 이미지 선택')).toBeEnabled();
});

it('stops after one decoded result and does not double-register frames', async () => {
  const user = userEvent.setup();
  const scan = vi.fn(onScan);
  render(<Scanner onScan={scan} onClose={vi.fn()} />);
  await user.click(screen.getByRole('button', { name: '카메라 켜기' }));
  const [, callback, signal] = vi.mocked(startCamera).mock.calls.at(-1)!;
  act(() => { callback('stamprally:v1:spot-1'); callback('stamprally:v1:spot-1'); });
  expect(scan).toHaveBeenCalledTimes(1);
  expect(signal.aborted).toBe(true);
  expect(screen.getByRole('status')).toHaveTextContent('시작 광장 스탬프를 모았어요');
});

it('shows retry guidance when no QR has been found', async () => {
  vi.useFakeTimers();
  render(<Scanner onScan={onScan} onClose={vi.fn()} />);
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: '카메라 켜기' })); });
  act(() => { vi.advanceTimersByTime(15000); });
  expect(screen.getByRole('alert')).toHaveTextContent('아직 QR을 찾지 못했어요');
});
