import styles from './App.module.css'
import { EVENT_NAME, SPOTS } from './data'

interface Props {
  onJoin: () => void
}

export function Intro({ onJoin }: Props) {
  return (
    <div className={styles.intro}>
      <section className={styles.hero} aria-labelledby="claude-intro-heading">
        <p className={styles.eyebrow}>QR 스탬프 랠리</p>
        <h1 id="claude-intro-heading" className={styles.heroTitle}>
          {EVENT_NAME}
        </h1>
        <p className={styles.heroLead}>
          동네의 다섯 장소를 돌며 각 장소에 붙어 있는 QR을 스캔하세요. 다섯 개의 스탬프를 모두 모으면 완주입니다.
        </p>
        <ol className={styles.howto}>
          <li>‘참여하기’를 눌러 스탬프 카드를 발급받습니다.</li>
          <li>장소에 도착하면 카메라로 QR을 스캔합니다.</li>
          <li>카메라가 없다면 QR 이미지를 업로드해도 됩니다.</li>
        </ol>
        <button type="button" className={styles.primaryButton} onClick={onJoin}>
          참여하기
        </button>
        <p className={styles.heroNote}>기록은 이 브라우저에만 저장되며, 언제든 초기화할 수 있습니다.</p>
      </section>

      <section className={styles.spotIntro} aria-labelledby="claude-spots-heading">
        <h2 id="claude-spots-heading" className={styles.sectionTitle}>
          방문 장소 {SPOTS.length}곳
        </h2>
        <ol className={styles.spotIntroList}>
          {SPOTS.map((spot, index) => (
            <li key={spot.id} className={styles.spotIntroItem}>
              <span className={styles.spotIntroIndex} aria-hidden="true">
                {index + 1}
              </span>
              <span className={styles.spotIntroEmoji} aria-hidden="true">
                {spot.emoji}
              </span>
              <span className={styles.spotIntroText}>
                <span className={styles.spotIntroName}>{spot.name}</span>
                <span className={styles.spotIntroHint}>{spot.hint}</span>
              </span>
            </li>
          ))}
        </ol>
      </section>
    </div>
  )
}
