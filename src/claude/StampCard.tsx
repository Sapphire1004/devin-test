import styles from './App.module.css'
import { EVENT_NAME } from './data'
import { formatVisitedAt } from './format'
import type { Rally } from './useRally'

interface Props {
  rally: Rally
  headingId: string
}

export function StampCard({ rally, headingId }: Props) {
  const percent = Math.round((rally.count / rally.total) * 100)

  return (
    <div className={styles.card}>
      <div className={styles.cardHead}>
        <div>
          <p className={styles.eyebrow}>스탬프 카드</p>
          <h2 id={headingId} className={styles.cardTitle}>
            {EVENT_NAME}
          </h2>
          {rally.state.joinedAt && (
            <p className={styles.cardMeta}>참여 {formatVisitedAt(rally.state.joinedAt)}</p>
          )}
        </div>
        <p className={styles.progressCount} data-testid="claude-progress">
          <span className={styles.progressNumber}>{rally.count}</span>
          <span className={styles.progressTotal}>/{rally.total}</span>
        </p>
      </div>

      <div
        className={styles.progressBar}
        role="progressbar"
        aria-label="스탬프 진행도"
        aria-valuemin={0}
        aria-valuemax={rally.total}
        aria-valuenow={rally.count}
        aria-valuetext={`${rally.count}/${rally.total}`}
      >
        <div className={styles.progressFill} style={{ width: `${percent}%` }} />
      </div>

      {rally.completed ? (
        <div className={styles.completeBanner} role="status" data-testid="claude-complete">
          <span className={styles.completeMark} aria-hidden="true">
            🏅
          </span>
          <div>
            <p className={styles.completeTitle}>완주를 축하합니다!</p>
            <p className={styles.completeDetail}>
              다섯 장소를 모두 방문했습니다.
              {rally.completedAt && ` 완주 ${formatVisitedAt(rally.completedAt)}`}
            </p>
          </div>
        </div>
      ) : (
        <p className={styles.cardHint}>
          {rally.count === 0
            ? '첫 장소의 QR을 스캔해 스탬프를 찍어 보세요.'
            : `${rally.total - rally.count}곳 더 방문하면 완주입니다.`}
        </p>
      )}

      <ul className={styles.stampGrid} aria-label="장소별 스탬프">
        {rally.progress.map(({ spot, stamp }, index) => (
          <li
            key={spot.id}
            className={`${styles.stamp} ${stamp ? styles.stampDone : ''}`}
            data-testid={`claude-stamp-${spot.id}`}
            data-state={stamp ? 'done' : 'pending'}
          >
            <div className={styles.stampSeal} aria-hidden="true">
              <span className={styles.stampEmoji}>{spot.emoji}</span>
              {stamp && <span className={styles.stampInk}>방문</span>}
            </div>
            <div className={styles.stampText}>
              <span className={styles.stampIndex}>{index + 1}</span>
              <span className={styles.stampName}>{spot.name}</span>
              <span className={styles.stampTime}>
                {stamp ? (
                  <>
                    <span className={styles.srOnly}>방문 시각 </span>
                    <time dateTime={stamp.visitedAt}>{formatVisitedAt(stamp.visitedAt)}</time>
                  </>
                ) : (
                  '아직 방문 전'
                )}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
