import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { STORAGE_KEY, emptyCard } from './rally';
import { useCard } from './useCard';

describe('isolated persistence', () => {
  it('restores participation, stamps and initial timestamps after remount', () => {
    const first = renderHook(useCard);
    expect(first.result.current.card).toEqual(emptyCard());
    act(() => first.result.current.join());
    act(() => first.result.current.scan('stamprally:v1:spot-1'));
    const initial = first.result.current.card;
    act(() => first.result.current.scan('stamprally:v1:spot-1'));
    expect(first.result.current.card).toBe(initial);
    first.unmount();
    const second = renderHook(useCard);
    expect(second.result.current.card).toEqual(initial);
    expect(localStorage.getItem(STORAGE_KEY)).toBe(JSON.stringify(initial));
  });

  it('clears only Astra state and returns to nonparticipation', () => {
    localStorage.setItem('stamprally:claude:v1', 'independent-test-sentinel');
    const { result } = renderHook(useCard);
    act(() => result.current.join());
    act(() => result.current.scan('stamprally:v1:spot-3'));
    act(() => { expect(result.current.reset()).toBe(true); });
    expect(result.current.card).toEqual(emptyCard());
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    expect(localStorage.getItem('stamprally:claude:v1')).toBe('independent-test-sentinel');
  });

  it('handles corrupt data without crashing or inventing stamps', () => {
    localStorage.setItem(STORAGE_KEY, '{bad');
    const { result } = renderHook(useCard);
    expect(result.current.card).toEqual(emptyCard());
    expect(result.current.warning).toContain('읽을 수 없어요');
    act(() => result.current.join());
    expect(result.current.warning).toBe('');
  });

  it('remains usable in memory when storage is unavailable', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new DOMException('blocked', 'SecurityError'); });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new DOMException('full', 'QuotaExceededError'); });
    const { result } = renderHook(useCard);
    expect(result.current.warning).toContain('저장소를 사용할 수 없어요');
    act(() => result.current.join());
    act(() => result.current.scan('stamprally:v1:spot-5'));
    expect(Object.keys(result.current.card.visits)).toEqual(['spot-5']);
    expect(result.current.warning).toContain('저장하지 못했어요');
  });

  it('keeps the current card if persistent reset fails', () => {
    const { result } = renderHook(useCard);
    act(() => result.current.join());
    const before = result.current.card;
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => { throw new DOMException('blocked', 'SecurityError'); });
    act(() => { expect(result.current.reset()).toBe(false); });
    expect(result.current.card).toBe(before);
    expect(result.current.warning).toContain('삭제하지 못했어요');
  });
});
