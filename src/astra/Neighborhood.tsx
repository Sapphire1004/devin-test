import { Icon } from './Icon';
import styles from './App.module.css';

export function Neighborhood() {
  return <div className={styles.neighborhood} aria-hidden="true">
    <div className={styles.mapGrid} />
    <div className={styles.mapHeading}>A LITTLE WALK, A NEW DISCOVERY <span>↗</span></div>
    <svg className={styles.route} viewBox="0 0 560 330" fill="none">
      <path d="M58 250C-10 125 170 260 192 157S296 90 295 180 378 235 444 117 520 60 505 47" stroke="#999e89" strokeWidth="2" strokeDasharray="5 7" />
      <circle cx="58" cy="250" r="7" fill="#c7e759" stroke="#273b36" strokeWidth="2" />
      <path d="m496 46 11-7 4 13" stroke="#273b36" strokeWidth="2" />
    </svg>
    <div className={`${styles.mapPlace} ${styles.mapBook}`}><Icon name="book" /><span>한 페이지의 쉼</span></div>
    <div className={`${styles.mapPlace} ${styles.mapCoffee}`}><Icon name="coffee" /><span>골목의 커피 향</span></div>
    <div className={`${styles.mapPlace} ${styles.mapTree}`}><Icon name="tree" /><span>초록빛 발견</span></div>
    <div className={styles.mapStar}><Icon name="sparkle" /></div>
    <div className={styles.postmark}>LOCAL<br /><strong>5 SPOTS</strong><br />GOOD MOMENTS</div>
    <div className={styles.mapTicket}><Icon name="pin" /><div>우리 동네 산책권<span>어디서 시작해도 좋아요</span></div><strong>01—05</strong></div>
    <span className={styles.mapCaption}>발걸음이 닿는 곳마다, 하나의 스탬프.</span>
  </div>;
}
