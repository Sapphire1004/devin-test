import { ReactNode, useEffect, useRef } from 'react';
import { Icon } from './Icon';
import { useAstraTranslation } from './i18n';
import styles from './App.module.css';

export function Dialog({ title, onClose, children }: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const { t } = useAstraTranslation();
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    const previous = document.activeElement;
    dialog?.showModal();
    return () => {
      dialog?.close();
      if (previous instanceof HTMLElement) previous.focus();
    };
  }, []);

  return <dialog ref={ref} className={styles.dialog} aria-label={title}
    onCancel={(event) => { event.preventDefault(); onClose(); }}>
    <div className={styles.dialogHeading}>
      <div><span className={styles.eyebrow}>{t('dialogEyebrow')}</span><h2>{title}</h2></div>
      <button type="button" className={styles.iconButton} onClick={onClose} aria-label={t('close')}><Icon name="close" /></button>
    </div>
    {children}
  </dialog>;
}
