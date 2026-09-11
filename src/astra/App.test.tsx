import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App';
import { decodeImage } from './qr';
import { SPOTS, STORAGE_KEY } from './rally';

vi.mock('./qr', () => ({ decodeImage: vi.fn(), startCamera: vi.fn(), cameraError: vi.fn() }));

const user = userEvent.setup();

async function openUpload() {
  await user.click(screen.getByRole('button', { name: 'QR 스캔하기' }));
  await user.click(await screen.findByRole('button', { name: '이미지 업로드' }));
}

async function upload(payload: string) {
  vi.mocked(decodeImage).mockResolvedValueOnce(payload);
  await user.upload(screen.getByLabelText('QR 이미지 선택'), new File(['pixels'], 'qr.png', { type: 'image/png' }));
}

beforeEach(() => { vi.mocked(decodeImage).mockReset(); });

describe('Astra participation and collection', () => {
  it('shows all five places, requires joining, and persists a zero-stamp card', async () => {
    render(<App />);
    for (const spot of SPOTS) expect(screen.getByRole('heading', { name: spot.name })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'QR 스캔하기' })).not.toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0');
    await user.click(screen.getByRole('button', { name: '참여하기' }));
    expect(screen.getByRole('button', { name: 'QR 스캔하기' })).toBeInTheDocument();
    expect(localStorage.getItem(STORAGE_KEY)).toContain('"visits":{}');
  });

  it('registers images, rejects duplicates and invalid payloads, restores and completes', async () => {
    const view = render(<App />);
    await user.click(screen.getByRole('button', { name: '참여하기' }));
    await openUpload();
    await upload('stamprally:v1:spot-1');
    expect(await screen.findByText(/시작 광장 스탬프를 모았어요/)).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '1');
    const stored = localStorage.getItem(STORAGE_KEY);
    await upload('stamprally:v1:spot-1');
    expect(await screen.findByText(/이미 방문한 시작 광장/)).toBeInTheDocument();
    expect(localStorage.getItem(STORAGE_KEY)).toBe(stored);
    await upload('hello');
    expect(await screen.findByRole('alert')).toHaveTextContent('이 랠리의 QR이 아니에요');
    expect(localStorage.getItem(STORAGE_KEY)).toBe(stored);
    await user.click(screen.getByRole('button', { name: '닫기' }));
    view.unmount();
    render(<App />);
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '1');
    expect(screen.getByRole('article', { name: '시작 광장: 방문 완료' }).querySelector('time')).not.toBeNull();
    await openUpload();
    for (const spot of SPOTS.slice(1)) {
      await upload(`stamprally:v1:${spot.id}`);
      await screen.findByText(new RegExp(`${spot.name} 스탬프를 모았어요`));
    }
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '5');
    expect(screen.getByText('축하해요! 스탬프 5개를 모두 모았어요.')).toBeInTheDocument();
    expect(screen.getAllByRole('article', { name: /방문 완료/ })).toHaveLength(5);
  });

  it('allows retry of the same file after a decoding failure', async () => {
    render(<App />);
    await user.click(screen.getByRole('button', { name: '참여하기' }));
    await openUpload();
    vi.mocked(decodeImage).mockRejectedValueOnce(new Error('QR을 읽지 못했어요.'));
    await user.upload(screen.getByLabelText('QR 이미지 선택'), new File(['bad'], 'qr.png', { type: 'image/png' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('QR을 읽지 못했어요');
    await upload('stamprally:v1:spot-2');
    expect(await screen.findByText(/동네 책방 스탬프를 모았어요/)).toBeInTheDocument();
  });

  it('requires confirmation to reset and supports cancel and Escape', async () => {
    localStorage.setItem('stamprally:claude:v1', 'separate-sentinel');
    render(<App />);
    await user.click(screen.getByRole('button', { name: '참여하기' }));
    await user.click(screen.getByRole('button', { name: '기록 초기화' }));
    await user.click(screen.getByRole('button', { name: '취소' }));
    expect(screen.getByRole('button', { name: 'QR 스캔하기' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '기록 초기화' }));
    fireEvent(screen.getByRole('dialog'), new Event('cancel', { cancelable: true }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '기록 초기화' }));
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: '초기화하기' }));
    expect(screen.getByRole('button', { name: '참여하기' })).toBeInTheDocument();
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    expect(localStorage.getItem('stamprally:claude:v1')).toBe('separate-sentinel');
  });

  it('does not register an image whose decoding finishes after closing the scanner', async () => {
    render(<App />);
    await user.click(screen.getByRole('button', { name: '참여하기' }));
    await openUpload();
    let resolve!: (payload: string) => void;
    vi.mocked(decodeImage).mockReturnValueOnce(new Promise((done) => { resolve = done; }));
    await user.upload(screen.getByLabelText('QR 이미지 선택'), new File(['qr'], 'qr.png', { type: 'image/png' }));
    await user.click(screen.getByRole('button', { name: '닫기' }));
    resolve('stamprally:v1:spot-1');
    await waitFor(() => expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0'));
  });
});
