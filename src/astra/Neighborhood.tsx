import { Icon } from './Icon';
import { useAstraTranslation } from './i18n';
import styles from './App.module.css';

export function Neighborhood() {
  const { t } = useAstraTranslation();
  return <div className={styles.neighborhood} aria-hidden="true">
    <div className={styles.mapGrid} />
    <div className={styles.mapHeading}>{t('mapHeading')} <span>↗</span></div>
    <svg className={styles.route} viewBox="0 0 560 330" fill="none">
      <path d="M58 250C-10 125 170 260 192 157S296 90 295 180 378 235 444 117 520 60 505 47" stroke="#999e89" strokeWidth="2" strokeDasharray="5 7" />
      <circle cx="58" cy="250" r="7" fill="#c7e759" stroke="#273b36" strokeWidth="2" />
      <path d="m496 46 11-7 4 13" stroke="#273b36" strokeWidth="2" />
    </svg>
    <div className={`${styles.mapPlace} ${styles.mapBook}`}><Icon name="book" /><span>{t('mapBook')}</span></div>
    <div className={`${styles.mapPlace} ${styles.mapCoffee}`}><Icon name="coffee" /><span>{t('mapCoffee')}</span></div>
    <div className={`${styles.mapPlace} ${styles.mapTree}`}><Icon name="tree" /><span>{t('mapTree')}</span></div>
    <div className={styles.mapStar}><Icon name="sparkle" /></div>
    <div className={styles.postmark}>{t('mapLocal')}<br /><strong>{t('mapSpots')}</strong><br />{t('mapMoments')}</div>
    <div className={styles.mapTicket}><Icon name="pin" /><div>{t('mapTicket')}<span>{t('mapTicketNote')}</span></div><strong>01—05</strong></div>
    <span className={styles.mapCaption}>{t('mapCaption')}</span>
  </div>;
}
