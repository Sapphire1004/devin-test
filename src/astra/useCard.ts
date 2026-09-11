import { useCallback, useRef, useState } from 'react';
import { MessageKey, useAstraTranslation } from './i18n';
import { Card, STORAGE_KEY, emptyCard, parseCard, scanCard } from './rally';

function loadCard(): { card: Card; warning: MessageKey | '' } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { card: emptyCard(), warning: '' };
    const card = parseCard(raw);
    return card
      ? { card, warning: '' }
      : { card: emptyCard(), warning: 'storageCorrupt' };
  } catch {
    return { card: emptyCard(), warning: 'storageUnavailable' };
  }
}

export function useCard() {
  const { t } = useAstraTranslation();
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
      setWarning('storageSaveFailed');
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
      setWarning('storageResetFailed');
      return false;
    }
  };

  return { card, warning: warning ? t(warning) : '', join, scan, reset };
}
