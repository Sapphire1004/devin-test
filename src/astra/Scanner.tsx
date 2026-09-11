import { ChangeEvent, useCallback, useEffect, useRef, useState } from 'react';
import { Dialog } from './Dialog';
import { Icon } from './Icon';
import { useAstraTranslation } from './i18n';
import { cameraError, decodeImage, startCamera } from './qr';
import { ScanResult } from './rally';
import styles from './App.module.css';

export function Scanner({ onScan, onClose }: {
  onScan: (payload: string) => ScanResult;
  onClose: () => void;
}) {
  const { t } = useAstraTranslation();
  const [tab, setTab] = useState<'camera' | 'image'>('camera');
  const [camera, setCamera] = useState<'off' | 'starting' | 'on'>('off');
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<{ text: string; success: boolean } | null>(null);
  const video = useRef<HTMLVideoElement>(null);
  const controller = useRef<AbortController>();
  const generation = useRef(0);
  const handled = useRef(false);
  const hintTimer = useRef<ReturnType<typeof setTimeout>>();

  const stop = useCallback(() => {
    controller.current?.abort();
    controller.current = undefined;
    generation.current += 1;
    clearTimeout(hintTimer.current);
  }, []);

  useEffect(() => {
    const pause = () => {
      if (document.visibilityState === 'hidden') {
        stop();
        setCamera('off');
        setBusy(false);
      }
    };
    const leave = () => stop();
    document.addEventListener('visibilitychange', pause);
    window.addEventListener('pagehide', leave);
    return () => {
      stop();
      document.removeEventListener('visibilitychange', pause);
      window.removeEventListener('pagehide', leave);
    };
  }, [stop]);

  const accept = (payload: string) => {
    if (handled.current) return;
    handled.current = true;
    stop();
    setCamera('off');
    setBusy(false);
    const result = onScan(payload);
    const spot = result.spot ? t(`${result.spot.id}Name`) : '';
    const text = result.kind === 'added'
      ? t('scanAdded', { spot })
      : result.kind === 'duplicate'
        ? t('scanDuplicate', { spot })
        : result.kind === 'not-joined'
          ? t('scanNotJoined')
          : t('scanInvalid');
    setFeedback({ text, success: result.kind === 'added' || result.kind === 'duplicate' });
  };

  const enableCamera = async () => {
    stop();
    handled.current = false;
    setFeedback(null);
    if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
      setFeedback({ text: t('cameraUnavailable'), success: false });
      return;
    }
    const element = video.current;
    if (!element) return;
    const active = new AbortController();
    controller.current = active;
    setCamera('starting');
    try {
      await startCamera(element, accept, active.signal);
      if (active.signal.aborted) return;
      setCamera('on');
      hintTimer.current = setTimeout(() => {
        setFeedback({ text: t('cameraNoResult'), success: false });
      }, 15000);
    } catch (error) {
      if (active.signal.aborted) return;
      stop();
      setCamera('off');
      setFeedback({ text: cameraError(error, t), success: false });
    }
  };

  const upload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    stop();
    const request = generation.current;
    handled.current = false;
    setBusy(true);
    setFeedback(null);
    try {
      const payload = await decodeImage(file, t);
      if (request === generation.current) accept(payload);
    } catch (error) {
      if (request === generation.current) {
        setFeedback({ text: error instanceof Error ? error.message : t('imageFailed'), success: false });
      }
    } finally {
      if (request === generation.current) setBusy(false);
    }
  };

  const changeTab = (next: typeof tab) => {
    stop();
    setCamera('off');
    setBusy(false);
    setFeedback(null);
    setTab(next);
  };

  return <Dialog title={t('scannerTitle')} onClose={onClose}>
    <p className={styles.dialogIntro}>{t('scannerDescription')}</p>
    <div className={styles.tabs} aria-label={t('inputMethod')}>
      <button type="button" aria-pressed={tab === 'camera'} onClick={() => changeTab('camera')}><Icon name="camera" />{t('cameraTab')}</button>
      <button type="button" aria-pressed={tab === 'image'} onClick={() => changeTab('image')}><Icon name="upload" />{t('imageTab')}</button>
    </div>
    {tab === 'camera' ? <>
      <div className={styles.viewfinder}>
        <video ref={video} muted playsInline aria-label={t('cameraPreview')} className={camera === 'off' ? styles.hiddenVideo : ''} />
        <div className={styles.scanCorners} />
        {camera === 'off' && <div className={styles.cameraPlaceholder}><Icon name="scan" /><span>{t('cameraFrame')}</span></div>}
        {camera !== 'off' && <span className={styles.cameraBadge}>{t(camera === 'starting' ? 'cameraConnecting' : 'cameraSearching')}</span>}
      </div>
      <button type="button" className={styles.primary} onClick={() => {
        if (camera === 'off') void enableCamera();
        else { stop(); setCamera('off'); }
      }}><Icon name="camera" />{t(camera === 'off' ? 'cameraOn' : 'cameraOff')}</button>
      <p className={styles.finePrint}>{t('cameraPermissionNote')}</p>
    </> : <div className={styles.uploadArea}>
      <span className={styles.uploadIcon}><Icon name="upload" /></span>
      <h3>{t('uploadTitle')}</h3>
      <p>{t('uploadDescription')}</p>
      <label className={`${styles.primary} ${styles.fileButton}`}>
        <Icon name="upload" />{t(busy ? 'imageReading' : 'chooseImage')}
        <input type="file" accept="image/*" aria-label={t('chooseImage')} disabled={busy} onChange={(event) => void upload(event)} />
      </label>
      <span className={styles.finePrint}>{t('imageFormats')}</span>
    </div>}
    {feedback && <div role={feedback.success ? 'status' : 'alert'} className={`${styles.feedback} ${feedback.success ? styles.success : styles.error}`}>{feedback.success && <Icon name="check" />}<p>{feedback.text}</p></div>}
    {feedback?.success && <button type="button" className={styles.secondary} onClick={onClose}>{t('viewCard')}<Icon name="arrow" /></button>}
    <p className={styles.privateNote}><Icon name="shield" />{t('scannerPrivacy')}</p>
  </Dialog>;
}
