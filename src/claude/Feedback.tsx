import styles from './App.module.css'

export interface FeedbackMessage {
  tone: 'success' | 'info' | 'error'
  title: string
  detail?: string
  code?: string
}

interface Props {
  message: FeedbackMessage | null
  onDismiss: () => void
}

const toneClass = {
  success: styles.feedbackSuccess,
  info: styles.feedbackInfo,
  error: styles.feedbackError,
} as const

export function Feedback({ message, onDismiss }: Props) {
  return (
    <div className={styles.feedbackRegion} role={message?.tone === 'error' ? 'alert' : 'status'} aria-live="polite">
      {message && (
        <div className={`${styles.feedback} ${toneClass[message.tone]}`} data-testid="claude-feedback">
          <div className={styles.feedbackBody}>
            <p className={styles.feedbackTitle}>{message.title}</p>
            {message.detail && <p className={styles.feedbackDetail}>{message.detail}</p>}
            {message.code && (
              <p className={styles.feedbackCode}>
                읽은 내용: <code>{message.code}</code>
              </p>
            )}
          </div>
          <button type="button" className={styles.iconButton} onClick={onDismiss} aria-label="알림 닫기">
            ×
          </button>
        </div>
      )}
    </div>
  )
}
