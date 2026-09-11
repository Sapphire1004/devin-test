import { useCallback, useEffect, useRef, useState, type ChangeEvent } from 'react'
import styles from './App.module.css'
import { decodeQrFromFile } from './decode'
import { describeCameraError, useCameraScanner } from './useCameraScanner'
import type { StampOutcome } from './useRally'

interface Props {
  onDecoded: (text: string) => StampOutcome
  headingId: string
  completed: boolean
}

type UploadState =
  | { phase: 'idle' }
  | { phase: 'decoding'; name: string }
  | { phase: 'failed'; name: string; reason: 'no-qr' | 'unreadable-file' }

export function ScanPanel({ onDecoded, headingId, completed }: Props) {
  const [scannerOpen, setScannerOpen] = useState(false)
  const [upload, setUpload] = useState<UploadState>({ phase: 'idle' })
  const [flash, setFlash] = useState<'ok' | 'bad' | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const flashTimer = useRef<number | null>(null)

  const showFlash = useCallback((kind: 'ok' | 'bad') => {
    setFlash(kind)
    if (flashTimer.current !== null) window.clearTimeout(flashTimer.current)
    flashTimer.current = window.setTimeout(() => setFlash(null), 900)
  }, [])

  useEffect(
    () => () => {
      if (flashTimer.current !== null) window.clearTimeout(flashTimer.current)
    },
    [],
  )

  const handleCameraDecode = useCallback(
    (text: string) => {
      const outcome = onDecoded(text)
      showFlash(outcome.status === 'added' || outcome.status === 'duplicate' ? 'ok' : 'bad')
    },
    [onDecoded, showFlash],
  )

  const { videoRef, status: cameraStatus, start: startCamera, stop: stopCamera } = useCameraScanner({
    onDecode: handleCameraDecode,
  })

  const openScanner = () => {
    setScannerOpen(true)
  }

  const closeScanner = useCallback(() => {
    stopCamera()
    setScannerOpen(false)
  }, [stopCamera])

  useEffect(() => {
    if (scannerOpen) void startCamera()
  }, [scannerOpen, startCamera])

  useEffect(() => {
    if (!scannerOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeScanner()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [scannerOpen, closeScanner])

  const handleFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    setUpload({ phase: 'decoding', name: file.name })
    const result = await decodeQrFromFile(file)
    if (result.status === 'decoded') {
      setUpload({ phase: 'idle' })
      onDecoded(result.text)
    } else {
      setUpload({ phase: 'failed', name: file.name, reason: result.status })
    }
  }

  const cameraError = cameraStatus.phase === 'error' ? describeCameraError(cameraStatus.kind) : null

  return (
    <div className={styles.card}>
      <p className={styles.eyebrow}>스탬프 등록</p>
      <h2 id={headingId} className={styles.cardTitle}>
        QR 스캔
      </h2>
      <p className={styles.cardHint}>
        {completed
          ? '모든 스탬프를 모았습니다. 다시 스캔해도 기록은 바뀌지 않습니다.'
          : '장소 안내판의 QR을 카메라에 비추거나, QR 이미지를 업로드하세요.'}
      </p>

      {!scannerOpen ? (
        <button type="button" className={styles.primaryButton} onClick={openScanner}>
          <span aria-hidden="true">📷 </span>카메라로 QR 스캔
        </button>
      ) : (
        <div className={styles.scanner} data-testid="claude-scanner">
          <div
            className={`${styles.viewport} ${flash === 'ok' ? styles.viewportOk : ''} ${flash === 'bad' ? styles.viewportBad : ''}`}
          >
            <video
              ref={videoRef}
              className={styles.video}
              playsInline
              muted
              autoPlay
              aria-label="카메라 미리보기"
              hidden={cameraStatus.phase !== 'scanning'}
            />
            {cameraStatus.phase === 'scanning' && (
              <div className={styles.reticle} aria-hidden="true">
                <span />
                <span />
                <span />
                <span />
              </div>
            )}
            {cameraStatus.phase === 'starting' && (
              <p className={styles.viewportMessage} role="status">
                카메라를 여는 중…
              </p>
            )}
            {cameraError && (
              <div className={styles.viewportError} role="alert">
                <p className={styles.viewportErrorTitle}>{cameraError.title}</p>
                <p className={styles.viewportErrorDetail}>{cameraError.detail}</p>
                <button type="button" className={styles.secondaryButton} onClick={() => void startCamera()}>
                  다시 시도
                </button>
              </div>
            )}
          </div>
          <div className={styles.scannerActions}>
            <p className={styles.scannerStatus} role="status">
              {cameraStatus.phase === 'scanning' && 'QR을 사각형 안에 맞춰 주세요.'}
            </p>
            <button type="button" className={styles.secondaryButton} onClick={closeScanner}>
              스캐너 닫기
            </button>
          </div>
        </div>
      )}

      <div className={styles.divider} role="separator">
        <span>또는</span>
      </div>

      <div className={styles.upload}>
        <label htmlFor="claude-qr-file" className={styles.uploadLabel}>
          QR 이미지 업로드
        </label>
        <p className={styles.uploadHint}>카메라를 쓸 수 없을 때 QR이 담긴 사진이나 이미지 파일을 선택하세요.</p>
        <input
          ref={fileInputRef}
          id="claude-qr-file"
          className={styles.fileInput}
          type="file"
          accept="image/*"
          onChange={handleFile}
          disabled={upload.phase === 'decoding'}
          data-testid="claude-file-input"
        />
        <button
          type="button"
          className={styles.secondaryButton}
          onClick={() => fileInputRef.current?.click()}
          disabled={upload.phase === 'decoding'}
        >
          {upload.phase === 'decoding' ? '이미지 판독 중…' : '이미지 선택'}
        </button>
        {upload.phase === 'failed' && (
          <p className={styles.uploadError} role="alert">
            {upload.reason === 'no-qr'
              ? `‘${upload.name}’에서 QR을 찾지 못했습니다. QR이 크고 선명하게 보이는 이미지로 다시 시도해 주세요.`
              : `‘${upload.name}’은(는) 열 수 없는 이미지입니다. PNG·JPG 등 이미지 파일을 선택해 주세요.`}
          </p>
        )}
      </div>
    </div>
  )
}
