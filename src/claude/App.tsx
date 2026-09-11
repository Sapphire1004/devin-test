import { useCallback, useEffect, useState } from 'react'
import styles from './App.module.css'
import { EVENT_NAME } from './data'
import { Feedback, type FeedbackMessage } from './Feedback'
import { formatVisitedAt } from './format'
import { Intro } from './Intro'
import { ResetDialog } from './ResetDialog'
import { ScanPanel } from './ScanPanel'
import { StampCard } from './StampCard'
import { useRally, type StampOutcome } from './useRally'

function feedbackFromOutcome(outcome: StampOutcome): FeedbackMessage {
  switch (outcome.status) {
    case 'added':
      return {
        tone: 'success',
        title: `${outcome.spot.name} 스탬프를 찍었습니다!`,
        detail: `방문 시각 ${formatVisitedAt(outcome.visitedAt)}`,
      }
    case 'duplicate':
      return {
        tone: 'info',
        title: `${outcome.spot.name}은(는) 이미 방문한 장소입니다`,
        detail: `최초 방문 ${formatVisitedAt(outcome.visitedAt)} 기록이 그대로 유지됩니다.`,
      }
    case 'rejected':
      return { tone: 'error', title: '등록할 수 없는 QR입니다', detail: outcome.message, code: outcome.code }
    case 'not-joined':
      return { tone: 'error', title: '먼저 참여하기를 눌러 스탬프 카드를 발급받아 주세요' }
  }
}

export default function App() {
  const rally = useRally()
  const [feedback, setFeedback] = useState<FeedbackMessage | null>(null)
  const [resetOpen, setResetOpen] = useState(false)

  useEffect(() => {
    const previous = document.title
    document.title = `${EVENT_NAME} · Claude`
    return () => {
      document.title = previous
    }
  }, [])

  const handleDecoded = useCallback(
    (text: string) => {
      const outcome = rally.registerCode(text)
      setFeedback(feedbackFromOutcome(outcome))
      return outcome
    },
    [rally],
  )

  const handleReset = () => {
    rally.reset()
    setFeedback(null)
    setResetOpen(false)
  }

  return (
    <div className={styles.app}>
      <a className={styles.skipLink} href="#claude-main">
        본문으로 건너뛰기
      </a>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <a className={styles.backLink} href="/" aria-label="구현 비교 페이지로 이동">
            ← 비교 페이지
          </a>
          <div className={styles.brand}>
            <span className={styles.brandMark} aria-hidden="true">
              ✦
            </span>
            <span className={styles.brandName}>{EVENT_NAME}</span>
          </div>
          {rally.state.joined && (
            <span className={styles.headerProgress} aria-label={`진행도 ${rally.count}/${rally.total}`}>
              {rally.count}/{rally.total}
            </span>
          )}
        </div>
      </header>

      <main id="claude-main" className={styles.main}>
        {!rally.state.joined ? (
          <Intro onJoin={rally.join} />
        ) : (
          <div className={styles.layout}>
            <section className={styles.column} aria-labelledby="claude-card-heading">
              <StampCard rally={rally} headingId="claude-card-heading" />
            </section>
            <section className={styles.column} aria-labelledby="claude-scan-heading">
              <ScanPanel onDecoded={handleDecoded} headingId="claude-scan-heading" completed={rally.completed} />
              <Feedback message={feedback} onDismiss={() => setFeedback(null)} />
            </section>
          </div>
        )}
      </main>

      <footer className={styles.footer}>
        {rally.state.joined && (
          <button type="button" className={styles.dangerLink} onClick={() => setResetOpen(true)}>
            기록 초기화
          </button>
        )}
        <p className={styles.footerNote}>이 구현의 기록은 이 브라우저에만 저장됩니다.</p>
      </footer>

      <ResetDialog open={resetOpen} onCancel={() => setResetOpen(false)} onConfirm={handleReset} count={rally.count} />
    </div>
  )
}
