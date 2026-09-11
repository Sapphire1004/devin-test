import { BrowserQRCodeReader } from '@zxing/browser';
import { Result } from '@zxing/library';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App';
import { createAstraI18n, LANGUAGE_KEY, Translate } from './i18n';
import { cameraError, decodeImage } from './qr';
import { STORAGE_KEY, visitTime } from './rally';

beforeEach(() => {
  Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: vi.fn().mockReturnValue('blob:qr') });
  Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: vi.fn() });
});

describe('Korean and Japanese locale state', () => {
  it('switches the complete rally to Japanese, restores it and preserves stamps across languages', async () => {
    const user = userEvent.setup();
    const view = render(<App />);
    const otherKey = 'stamprally:claude:v1';
    localStorage.setItem(otherKey, 'independent-sentinel');
    expect(screen.getByRole('combobox', { name: '언어' })).toHaveValue('ko');
    await user.click(screen.getByRole('button', { name: '참여하기' }));
    const joined = localStorage.getItem(STORAGE_KEY);

    await user.selectOptions(screen.getByRole('combobox'), 'ja');
    expect(document.documentElement.lang).toBe('ja');
    expect(document.title).toBe('まち歩きスタンプラリー | Astra');
    expect(screen.getByRole('combobox', { name: '言語' })).toHaveValue('ja');
    expect(localStorage.getItem(LANGUAGE_KEY)).toBe('ja');
    expect(localStorage.getItem(STORAGE_KEY)).toBe(joined);
    expect(view.container.textContent?.replace('한국어', '')).not.toMatch(/[가-힣]/);

    await user.click(screen.getByRole('button', { name: 'QRを読み取る' }));
    await user.click(await screen.findByRole('button', { name: '画像をアップロード' }));
    const decoder = vi.spyOn(BrowserQRCodeReader.prototype, 'decodeFromImageUrl');
    const upload = async (payload: string) => {
      decoder.mockResolvedValueOnce({ getText: () => payload } as Result);
      await user.upload(screen.getByLabelText('QR画像を選ぶ'), new File(['qr'], 'qr.png', { type: 'image/png' }));
    };
    await upload('stamprally:v1:spot-1');
    expect(await screen.findByRole('status')).toHaveTextContent('はじまりの広場のスタンプを獲得しました');
    const firstVisit = localStorage.getItem(STORAGE_KEY);
    await upload('stamprally:v1:spot-1');
    expect(await screen.findByRole('status')).toHaveTextContent('はじまりの広場は訪問済みです');
    expect(localStorage.getItem(STORAGE_KEY)).toBe(firstVisit);
    await upload('stamprally:v1:spot-1 ');
    expect(await screen.findByRole('alert')).toHaveTextContent('このラリーのQRではありません');
    expect(localStorage.getItem(STORAGE_KEY)).toBe(firstVisit);
    await user.click(screen.getByRole('button', { name: '閉じる' }));

    const time = screen.getByRole('article', { name: 'はじまりの広場：訪問済み' }).querySelector('time')!;
    const timestamp = time.dateTime;
    expect(time).toHaveTextContent(visitTime(timestamp, 'ja'));
    await user.selectOptions(screen.getByRole('combobox'), 'ko');
    expect(document.documentElement.lang).toBe('ko');
    expect(time).toHaveTextContent(visitTime(timestamp, 'ko'));
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuetext', '1/5 스탬프');
    expect(localStorage.getItem(STORAGE_KEY)).toBe(firstVisit);

    await user.selectOptions(screen.getByRole('combobox'), 'ja');
    view.unmount();
    render(<App />);
    expect(screen.getByRole('combobox')).toHaveValue('ja');
    expect(screen.getByRole('progressbar', { name: 'スタンプ収集の進み具合' })).toHaveAttribute('aria-valuenow', '1');
    expect(screen.getByRole('article', { name: 'はじまりの広場：訪問済み' }).querySelector('time')).toHaveAttribute('datetime', timestamp);
    await user.click(screen.getByRole('button', { name: 'QRを読み取る' }));
    await user.click(await screen.findByRole('button', { name: '画像をアップロード' }));
    for (let number = 2; number <= 5; number += 1) await upload(`stamprally:v1:spot-${number}`);
    await user.click(screen.getByRole('button', { name: 'スタンプカードを見る' }));
    expect(screen.getByRole('status')).toHaveTextContent('おめでとうございます！スタンプ5個がそろいました。');
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuetext', 'スタンプ 5/5');
    expect(screen.getByRole('heading', { name: '展望台' })).toBeInTheDocument();
    expect(document.body.textContent?.replace('한국어', '')).not.toMatch(/[가-힣]/);

    const completedCard = localStorage.getItem(STORAGE_KEY);
    await user.click(screen.getByRole('button', { name: '記録をリセット' }));
    const dialog = screen.getByRole('dialog', { name: '散歩の記録をリセットしますか？' });
    expect(dialog).toHaveTextContent('スタンプ5個を削除します');
    await user.click(within(dialog).getByRole('button', { name: 'キャンセル' }));
    expect(localStorage.getItem(STORAGE_KEY)).toBe(completedCard);
    await user.click(screen.getByRole('button', { name: '記録をリセット' }));
    await user.click(screen.getByRole('button', { name: 'リセットする' }));
    expect(screen.getByRole('button', { name: '参加する' })).toBeInTheDocument();
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    expect(localStorage.getItem(LANGUAGE_KEY)).toBe('ja');
    expect(localStorage.getItem(otherKey)).toBe('independent-sentinel');
  });

  it.each(['en', 'ja-JP', '{broken'])('falls back to Korean for unsupported saved language %s', (language) => {
    localStorage.setItem(LANGUAGE_KEY, language);
    render(<App />);
    expect(screen.getByRole('combobox')).toHaveValue('ko');
    expect(screen.getByRole('button', { name: '참여하기' })).toBeInTheDocument();
  });

  it('keeps the selected language usable and translates existing warnings when storage is blocked', async () => {
    const user = userEvent.setup();
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new DOMException('blocked', 'SecurityError'); });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new DOMException('blocked', 'SecurityError'); });
    render(<App />);
    expect(screen.getByRole('alert')).toHaveTextContent('브라우저 저장소를 사용할 수 없어요');
    await user.selectOptions(screen.getByRole('combobox'), 'ja');
    expect(screen.getAllByRole('alert').map((alert) => alert.textContent).join(' ')).toContain('ブラウザのストレージを利用できません');
    expect(screen.getAllByRole('alert').map((alert) => alert.textContent).join(' ')).toContain('言語設定を保存できませんでした');
    await user.click(screen.getByRole('button', { name: '参加する' }));
    expect(screen.getByRole('button', { name: 'QRを読み取る' })).toBeInTheDocument();
    expect(screen.getAllByRole('alert').map((alert) => alert.textContent).join(' ')).toContain('記録を保存できませんでした');
    await user.selectOptions(screen.getByRole('combobox'), 'ko');
    expect(screen.getAllByRole('alert').map((alert) => alert.textContent).join(' ')).toContain('기록을 저장하지 못했어요');
  });

  it('restores shared document metadata when leaving Astra', async () => {
    const language = document.documentElement.lang;
    const title = document.title;
    const meta = document.createElement('meta');
    meta.name = 'description';
    meta.content = 'Comparison page';
    document.head.append(meta);
    const view = render(<App />);
    await userEvent.setup().selectOptions(screen.getByRole('combobox'), 'ja');
    expect(meta.content).toContain('5か所のQRスタンプ');
    view.unmount();
    expect(document.documentElement.lang).toBe(language);
    expect(document.title).toBe(title);
    expect(meta.content).toBe('Comparison page');
    meta.remove();
  });

  it('does not change another i18next instance when switching Astra', async () => {
    const korean = createAstraI18n('ko');
    const japanese = createAstraI18n('ja');
    await korean.changeLanguage('ja');
    await japanese.changeLanguage('ko');
    expect(korean.t('join')).toBe('参加する');
    expect(japanese.t('join')).toBe('참여하기');
  });
});

describe('Japanese scanner error translations', () => {
  const instance = createAstraI18n('ja');
  const t: Translate = (key, options) => instance.t(key, options);

  it.each([
    ['NotAllowedError', 'アクセス許可が必要'],
    ['NotFoundError', 'カメラが見つかりません'],
    ['NotReadableError', '他のアプリで使用中'],
    ['UnknownError', 'カメラを起動できませんでした'],
  ])('explains camera error %s', (name, expected) => {
    expect(cameraError(new DOMException('error', name), t)).toContain(expected);
  });

  it('uses Japanese for invalid, oversized, and unreadable images', async () => {
    await expect(decodeImage(new File(['text'], 'qr.txt', { type: 'text/plain' }), t)).rejects.toThrow('画像ファイルを選んでください');
    const large = new File([new Uint8Array(12 * 1024 * 1024 + 1)], 'large.png', { type: 'image/png' });
    await expect(decodeImage(large, t)).rejects.toThrow('12MB以下の画像');
    vi.spyOn(BrowserQRCodeReader.prototype, 'decodeFromImageUrl').mockRejectedValue(new Error('unreadable'));
    await expect(decodeImage(new File(['bad'], 'bad.png', { type: 'image/png' }), t)).rejects.toThrow('QRを読み取れませんでした');
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:qr');
  });
});
