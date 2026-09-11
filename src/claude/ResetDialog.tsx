import { useEffect, useRef } from 'react'
import styles from './App.module.css'

interface Props {
  open: boolean
  count: number
  onCancel: () => void
  onConfirm: () => void
}

export function ResetDialog({ open, count, onCancel, onConfirm }: Props) {
  const dialogRef = useRef<HTMLDialogElement | null>(null)
  const cancelRef = useRef<HTMLButtonElement | null>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (open && !dialog.open) {
      if (typeof dialog.showModal === 'function') dialog.showModal()
      else dialog.setAttribute('open', '')
      cancelRef.current?.focus()
    } else if (!open && dialog.open) {
      if (typeof dialog.close === 'function') dialog.close()
      else dialog.removeAttribute('open')
    }
  }, [open])

  return (
    <dialog
      ref={dialogRef}
      className={styles.dialog}
      aria-labelledby="claude-reset-title"
      aria-describedby="claude-reset-desc"
      onCancel={(e) => {
        e.preventDefault()
        onCancel()
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel()
      }}
      data-testid="claude-reset-dialog"
    >
      <div className={styles.dialogBody}>
        <h2 id="claude-reset-title" className={styles.dialogTitle}>
          기록을 초기화할까요?
        </h2>
        <p id="claude-reset-desc" className={styles.dialogText}>
          참여 정보와 스탬프 {count}개가 이 브라우저에서 삭제됩니다. 다른 구현의 기록은 영향을 받지 않습니다. 이 작업은 되돌릴 수
          없습니다.
        </p>
        <div className={styles.dialogActions}>
          <button ref={cancelRef} type="button" className={styles.secondaryButton} onClick={onCancel}>
            취소
          </button>
          <button type="button" className={styles.dangerButton} onClick={onConfirm}>
            초기화
          </button>
        </div>
      </div>
    </dialog>
  )
}
