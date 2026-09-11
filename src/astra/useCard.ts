import { useCallback, useRef, useState } from 'react';
import { Card, STORAGE_KEY, emptyCard, parseCard, scanCard } from './rally';

function loadCard(): { card: Card; warning: string } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { card: emptyCard(), warning: '' };
    const card = parseCard(raw);
    return card
      ? { card, warning: '' }
      : { card: emptyCard(), warning: '저장된 기록을 읽을 수 없어요. 참여하기를 누르면 새 카드로 시작합니다.' };
  } catch {
    return { card: emptyCard(), warning: '브라우저 저장소를 사용할 수 없어요. 현재 화면에서만 기록이 유지됩니다.' };
  }
}

export function useCard() {
  const [initial] = useState(loadCard);
  const [card, setCard] = useState(initial.card);
  const [warning, setWarning] = useState(initial.warning);
  const current = useRef(card);

  const save = useCallback((next: Card) => {
    current.current = next;
    setCard(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      setWarning('');
    } catch {
      setWarning('기록을 저장하지 못했어요. 저장 공간과 브라우저 설정을 확인해 주세요. 새로고침하면 새 기록이 사라질 수 있습니다.');
    }
  }, []);

  const join = () => {
    if (!current.current.joinedAt) save({ ...emptyCard(), joinedAt: new Date().toISOString() });
  };

  const scan = useCallback((payload: string) => {
    const result = scanCard(current.current, payload, new Date().toISOString());
    if (result.kind === 'added') save(result.card);
    return result;
  }, [save]);

  const reset = () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      current.current = emptyCard();
      setCard(current.current);
      setWarning('');
      return true;
    } catch {
      setWarning('기록을 삭제하지 못했어요. 브라우저 저장소 설정을 확인한 뒤 다시 시도해 주세요.');
      return false;
    }
  };

  return { card, warning, join, scan, reset };
}
