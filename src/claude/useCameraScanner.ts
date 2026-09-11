import { useCallback, useEffect, useRef, useState } from 'react'
import { decodeQrFromPixels } from './decode'

export type CameraErrorKind = 'unsupported' | 'insecure' | 'denied' | 'not-found' | 'in-use' | 'unknown'

export type CameraStatus =
  | { phase: 'idle' }
  | { phase: 'starting' }
  | { phase: 'scanning' }
  | { phase: 'error'; kind: CameraErrorKind }

export function describeCameraError(kind: CameraErrorKind): { title: string; detail: string } {
  switch (kind) {
    case 'unsupported':
      return {
        title: '이 브라우저는 카메라를 지원하지 않습니다',
        detail: '아래의 QR 이미지 업로드로 스탬프를 등록할 수 있습니다.',
      }
    case 'insecure':
      return {
        title: '보안 연결에서만 카메라를 사용할 수 있습니다',
        detail: 'HTTPS 또는 localhost 주소로 접속하거나, QR 이미지 업로드를 이용해 주세요.',
      }
    case 'denied':
      return {
        title: '카메라 권한이 거부되었습니다',
        detail: '브라우저 주소창의 사이트 설정에서 카메라를 허용한 뒤 다시 시도하거나, QR 이미지 업로드를 이용해 주세요.',
      }
    case 'not-found':
      return {
        title: '사용할 수 있는 카메라가 없습니다',
        detail: '카메라가 연결되어 있는지 확인하거나, QR 이미지 업로드를 이용해 주세요.',
      }
    case 'in-use':
      return {
        title: '카메라를 시작할 수 없습니다',
        detail: '다른 앱이나 탭에서 카메라를 사용 중일 수 있습니다. 종료 후 다시 시도해 주세요.',
      }
    case 'unknown':
      return {
        title: '카메라를 열지 못했습니다',
        detail: '잠시 후 다시 시도하거나, QR 이미지 업로드를 이용해 주세요.',
      }
  }
}

function classifyError(err: unknown): CameraErrorKind {
  if (!(err instanceof Error)) return 'unknown'
  switch (err.name) {
    case 'NotAllowedError':
    case 'PermissionDeniedError':
    case 'SecurityError':
      return 'denied'
    case 'NotFoundError':
    case 'DevicesNotFoundError':
    case 'OverconstrainedError':
      return 'not-found'
    case 'NotReadableError':
    case 'TrackStartError':
    case 'AbortError':
      return 'in-use'
    default:
      return 'unknown'
  }
}

const SCAN_INTERVAL_MS = 120

interface Options {
  onDecode: (text: string) => void
  /** Milliseconds to ignore repeated reads of the same payload. */
  cooldownMs?: number
}

export function useCameraScanner({ onDecode, cooldownMs = 2500 }: Options) {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const frameRef = useRef<number | null>(null)
  const lastReadRef = useRef<{ text: string; at: number } | null>(null)
  const onDecodeRef = useRef(onDecode)
  const [status, setStatus] = useState<CameraStatus>({ phase: 'idle' })

  useEffect(() => {
    onDecodeRef.current = onDecode
  }, [onDecode])

  const stop = useCallback(() => {
    if (frameRef.current !== null) {
      cancelAnimationFrame(frameRef.current)
      frameRef.current = null
    }
    const stream = streamRef.current
    if (stream) {
      for (const track of stream.getTracks()) track.stop()
      streamRef.current = null
    }
    const video = videoRef.current
    if (video) {
      video.pause()
      video.srcObject = null
    }
    lastReadRef.current = null
    setStatus({ phase: 'idle' })
  }, [])

  const start = useCallback(async () => {
    stop()

    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setStatus({ phase: 'error', kind: typeof window !== 'undefined' && !window.isSecureContext ? 'insecure' : 'unsupported' })
      return
    }

    setStatus({ phase: 'starting' })
    let stream: MediaStream
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } },
      })
    } catch (err) {
      setStatus({ phase: 'error', kind: classifyError(err) })
      return
    }

    const video = videoRef.current
    if (!video) {
      for (const track of stream.getTracks()) track.stop()
      setStatus({ phase: 'idle' })
      return
    }

    streamRef.current = stream
    video.srcObject = stream
    try {
      await video.play()
    } catch (err) {
      for (const track of stream.getTracks()) track.stop()
      streamRef.current = null
      video.srcObject = null
      setStatus({ phase: 'error', kind: classifyError(err) })
      return
    }

    setStatus({ phase: 'scanning' })

    const canvas = canvasRef.current ?? document.createElement('canvas')
    canvasRef.current = canvas
    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    if (!ctx) {
      setStatus({ phase: 'error', kind: 'unknown' })
      return
    }

    let lastTick = 0
    const tick = (time: number) => {
      frameRef.current = requestAnimationFrame(tick)
      if (time - lastTick < SCAN_INTERVAL_MS) return
      lastTick = time
      if (video.readyState < video.HAVE_ENOUGH_DATA || !video.videoWidth) return

      // Downscale big frames to keep decoding cheap on phones.
      const scale = Math.min(1, 800 / Math.max(video.videoWidth, video.videoHeight))
      const w = Math.round(video.videoWidth * scale)
      const h = Math.round(video.videoHeight * scale)
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w
        canvas.height = h
      }
      ctx.drawImage(video, 0, 0, w, h)
      const text = decodeQrFromPixels(ctx.getImageData(0, 0, w, h))
      if (!text) return

      const now = performance.now()
      const last = lastReadRef.current
      if (last && last.text === text && now - last.at < cooldownMs) return
      lastReadRef.current = { text, at: now }
      onDecodeRef.current(text)
    }
    frameRef.current = requestAnimationFrame(tick)
  }, [stop, cooldownMs])

  useEffect(() => {
    const onPageHide = () => stop()
    window.addEventListener('pagehide', onPageHide)
    return () => {
      window.removeEventListener('pagehide', onPageHide)
      stop()
    }
  }, [stop])

  return { videoRef, status, start, stop }
}
