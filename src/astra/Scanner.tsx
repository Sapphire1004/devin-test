import { ChangeEvent, useCallback, useEffect, useRef, useState } from 'react';
import { Dialog } from './Dialog';
import { Icon } from './Icon';
import { cameraError, decodeImage, startCamera } from './qr';
import { ScanResult } from './rally';
import styles from './App.module.css';

export function Scanner({ onScan, onClose }: {
  onScan: (payload: string) => ScanResult;
  onClose: () => void;
}) {
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
    const text = result.kind === 'added'
      ? `${result.spot?.name} 스탬프를 모았어요! 카드에 방문 시각을 기록했습니다.`
      : result.kind === 'duplicate'
        ? `이미 방문한 ${result.spot?.name}이에요. 최초 방문 시각과 스탬프 수는 그대로 유지됩니다.`
        : result.kind === 'not-joined'
          ? '먼저 참여하기를 눌러 스탬프 카드를 발급받아 주세요.'
          : '이 랠리의 QR이 아니에요. 우리 동네 스탬프 랠리의 장소 QR인지 확인해 주세요.';
    setFeedback({ text, success: result.kind === 'added' || result.kind === 'duplicate' });
  };

  const enableCamera = async () => {
    stop();
    handled.current = false;
    setFeedback(null);
    if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
      setFeedback({ text: '이 환경에서 카메라를 사용할 수 없어요. HTTPS 또는 localhost에서 열거나 QR 이미지를 업로드해 주세요.', success: false });
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
        setFeedback({ text: '아직 QR을 찾지 못했어요. 밝은 곳에서 코드 전체를 비추거나 이미지 업로드를 이용해 주세요.', success: false });
      }, 15000);
    } catch (error) {
      if (active.signal.aborted) return;
      stop();
      setCamera('off');
      setFeedback({ text: cameraError(error), success: false });
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
      const payload = await decodeImage(file);
      if (request === generation.current) accept(payload);
    } catch (error) {
      if (request === generation.current) {
        setFeedback({ text: error instanceof Error ? error.message : '이미지를 읽지 못했어요. 다시 시도해 주세요.', success: false });
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

  return <Dialog title="새로운 스탬프 모으기" onClose={onClose}>
    <p className={styles.dialogIntro}>방문한 장소의 QR 코드를 스캔해 주세요.</p>
    <div className={styles.tabs} aria-label="QR 입력 방법">
      <button type="button" aria-pressed={tab === 'camera'} onClick={() => changeTab('camera')}><Icon name="camera" />카메라 스캔</button>
      <button type="button" aria-pressed={tab === 'image'} onClick={() => changeTab('image')}><Icon name="upload" />이미지 업로드</button>
    </div>
    {tab === 'camera' ? <>
      <div className={styles.viewfinder}>
        <video ref={video} muted playsInline aria-label="QR 카메라 미리보기" className={camera === 'off' ? styles.hiddenVideo : ''} />
        <div className={styles.scanCorners} />
        {camera === 'off' && <div className={styles.cameraPlaceholder}><Icon name="scan" /><span>QR 코드를 프레임 안에 맞춰 주세요</span></div>}
        {camera !== 'off' && <span className={styles.cameraBadge}>{camera === 'starting' ? '카메라 연결 중…' : 'QR 코드를 찾고 있어요'}</span>}
      </div>
      <button type="button" className={styles.primary} onClick={() => {
        if (camera === 'off') void enableCamera();
        else { stop(); setCamera('off'); }
      }}><Icon name="camera" />{camera === 'off' ? '카메라 켜기' : '카메라 끄기'}</button>
      <p className={styles.finePrint}>권한을 허용해 주세요. 화면을 닫으면 카메라가 꺼집니다.</p>
    </> : <div className={styles.uploadArea}>
      <span className={styles.uploadIcon}><Icon name="upload" /></span>
      <h3>사진 속 QR도 괜찮아요</h3>
      <p>코드 전체가 선명하게 보이는 이미지를 선택하세요.</p>
      <label className={`${styles.primary} ${styles.fileButton}`}>
        <Icon name="upload" />{busy ? 'QR을 읽고 있어요…' : 'QR 이미지 선택'}
        <input type="file" accept="image/*" aria-label="QR 이미지 선택" disabled={busy} onChange={(event) => void upload(event)} />
      </label>
      <span className={styles.finePrint}>PNG, JPG, WebP 권장 · 최대 12MB</span>
    </div>}
    {feedback && <div role={feedback.success ? 'status' : 'alert'} className={`${styles.feedback} ${feedback.success ? styles.success : styles.error}`}>{feedback.success && <Icon name="check" />}<p>{feedback.text}</p></div>}
    {feedback?.success && <button type="button" className={styles.secondary} onClick={onClose}>내 스탬프 카드 보기<Icon name="arrow" /></button>}
    <p className={styles.privateNote}><Icon name="shield" />카메라 영상과 이미지는 서버로 전송되지 않습니다.</p>
  </Dialog>;
}
