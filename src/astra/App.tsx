import { lazy, Suspense, useEffect, useState } from 'react';
import { Dialog } from './Dialog';
import { Icon } from './Icon';
import { Neighborhood } from './Neighborhood';
import { AstraLanguageProvider, LANGUAGE_KEY, Language, useAstraTranslation } from './i18n';
import { SPOTS, visitTime } from './rally';
import { useCard } from './useCard';
import styles from './App.module.css';

const Scanner = lazy(() => import('./Scanner').then((module) => ({ default: module.Scanner })));

export default function App() {
  return <AstraLanguageProvider><AstraApp /></AstraLanguageProvider>;
}

function AstraApp() {
  const { t, i18n, language } = useAstraTranslation();
  const { card, warning, join, scan, reset } = useCard();
  const [scannerOpen, setScannerOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [languageSaveFailed, setLanguageSaveFailed] = useState(false);
  const count = Object.keys(card.visits).length;
  const complete = count === SPOTS.length;
  const joined = card.joinedAt !== null;

  useEffect(() => {
    const previousLanguage = document.documentElement.lang;
    const previousTitle = document.title;
    const description = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    const previousDescription = description?.content;
    document.documentElement.lang = language;
    document.title = t('pageTitle');
    if (description) description.content = t('pageDescription');
    return () => {
      document.documentElement.lang = previousLanguage;
      document.title = previousTitle;
      if (description && previousDescription !== undefined) description.content = previousDescription;
    };
  }, [language, t]);

  const changeLanguage = (next: Language) => {
    void i18n.changeLanguage(next);
    try {
      localStorage.setItem(LANGUAGE_KEY, next);
      setLanguageSaveFailed(false);
    } catch {
      setLanguageSaveFailed(true);
    }
  };

  return <div className={styles.app} lang={language}>
    <a className={styles.skipLink} href="#stamp-card">{t('skipToCard')}</a>
    <header className={styles.header}>
      <a href="/astra" className={styles.brand} aria-label={t('homeLabel')}><span className={styles.brandMark}><Icon name="flag" /></span><span>{t('brand')}<span>STAMP RALLY</span></span></a>
      <div className={styles.headerRight}>
        <span className={styles.edition}><span />ASTRA EDITION</span>
        <select className={styles.languageSelect} aria-label={t('languageLabel')} value={language} onChange={(event) => changeLanguage(event.target.value === 'ja' ? 'ja' : 'ko')}>
          <option value="ko" lang="ko">한국어</option>
          <option value="ja" lang="ja">日本語</option>
        </select>
        <a href="/">{t('compare')}<Icon name="arrow" /></a>
      </div>
    </header>

    <main>
      <section className={styles.hero} aria-labelledby="hero-title">
        <div className={styles.heroCopy}>
          <span className={styles.heroKicker}><span />{t('heroKicker')}</span>
          <h1 id="hero-title">{t('heroTitle')}<br /><span>{t('heroAccent')}</span><svg viewBox="0 0 40 42" aria-hidden="true"><path d="m8 25 5-19m4 23 17-16M21 36l17-1" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" /></svg></h1>
          <p>{t('rallyName')}<br />{t('heroDescription')}</p>
          <div className={styles.heroFacts}><span><Icon name="pin" />{t('placesFact')}</span><span><Icon name="scan" />{t('qrFact')}</span><span>{t('freeFact')}</span></div>
        </div>
        <Neighborhood />
      </section>

      <section className={styles.instructions} aria-label={t('instructionsLabel')}>
        <div><span>01</span><p><strong>{t('joinStep')}</strong>{t('joinInstruction')}</p></div>
        <Icon name="arrow" />
        <div><span>02</span><p><strong>{t('scanStep')}</strong>{t('scanInstruction')}</p></div>
        <Icon name="arrow" />
        <div><span>03</span><p><strong>{t('finishStep')}</strong>{t('finishInstruction')}</p></div>
      </section>

      {languageSaveFailed && <div className={styles.storageWarning} role="alert">{t('languageSaveFailed')}</div>}
      {warning && <div className={styles.storageWarning} role="alert">{warning}</div>}

      <div className={styles.collectionLayout}>
        <section id="stamp-card" className={styles.collection} aria-labelledby="card-title" tabIndex={-1}>
          <div className={styles.sectionHeading}><div><span className={styles.eyebrow}>{t('collectEyebrow')}</span><h2 id="card-title">{t('cardTitle')}<span>05</span></h2></div><span className={styles.collectionCaption}>{t('collectionCaption')}</span></div>
          <div className={styles.stampGrid}>
            {SPOTS.map((spot, index) => {
              const visited = card.visits[spot.id];
              return <article key={spot.id} className={`${styles.stampCard} ${visited ? styles.collected : ''}`} aria-label={t('spotStatus', { spot: t(`${spot.id}Name`), status: t(visited ? 'visited' : 'unvisited') })}>
                <div className={styles.stampTop}><span>{t('spotLabel', { number: `0${index + 1}` })}</span>{visited ? <span className={styles.doneLabel}><Icon name="check" />{t('visited')}</span> : <Icon name="lock" />}</div>
                <div className={`${styles.stampArt} ${styles[spot.color]} ${visited ? styles.stamped : ''}`}>
                  <div><Icon name={spot.icon} /></div>
                  {visited && <span className={styles.stampSeal}>{t('visitedSeal')}</span>}
                </div>
                <h3>{t(`${spot.id}Name`)}</h3><p>{t(`${spot.id}Caption`)}</p>
                <div className={styles.stampBottom}>{visited ? <time dateTime={visited}>{visitTime(visited, language)}</time> : <><span className={styles.emptyDot} />{t('waitingForVisit')}</>}</div>
              </article>;
            })}
            <div className={`${styles.finishCard} ${complete ? styles.finished : ''}`}><Icon name="sparkle" /><span>{t('achievementEyebrow')}</span><h3>{t(complete ? 'achievementCompleteTitle' : 'achievementTitle')}</h3><p>{t(complete ? 'achievementCompleteDescription' : 'achievementDescription')}</p><div>{t(complete ? 'explorer' : 'collectAll')}<Icon name={complete ? 'check' : 'arrow'} /></div></div>
          </div>
        </section>

        <aside className={styles.passportColumn} aria-label={t('progressSection')}>
          <div className={styles.passport}>
            <div className={styles.passportHeading}><span>{t('passportEyebrow')}</span><Icon name="sparkle" /></div>
            <div className={styles.passportStatus}><span className={styles.statusDot} />{t(complete ? 'statusComplete' : joined ? 'statusJoined' : 'statusReady')}</div>
            <h2>{t(complete ? 'passportTitleComplete' : joined ? 'passportTitleJoined' : 'passportTitleReady')}</h2>
            <p>{t(complete ? 'passportDescriptionComplete' : joined ? 'passportDescriptionJoined' : 'passportDescriptionReady')}</p>
            <div className={styles.progressNumbers} aria-live="polite"><span>{t('progressTitle')}</span><strong>{count}<span> / 5</span></strong></div>
            <div className={styles.progressBar} role="progressbar" aria-label={t('progressLabel')} aria-valuenow={count} aria-valuemin={0} aria-valuemax={5} aria-valuetext={t('progressValue', { count })}><span style={{ width: `${count * 20}%` }} /></div>
            <div className={styles.progressCaption}><span>{complete ? t('allVisited') : t('remaining', { count: 5 - count })}</span><span>{count * 20}%</span></div>
            {complete && <div className={styles.completionNotice} role="status"><Icon name="check" />{t('congratulations')}</div>}
            <button type="button" className={styles.primary} onClick={() => joined ? setScannerOpen(true) : join()}><Icon name={joined ? 'scan' : 'flag'} />{t(joined ? 'scan' : 'join')}<Icon name="arrow" /></button>
            <span className={styles.passportNote}>{t(joined ? 'passportNoteJoined' : 'passportNoteReady')}</span>
            <div className={styles.passportPerforation} />
            <div className={styles.passportFooter}><span>{t('passportFooter')}</span><span>ASTRA / 001</span></div>
          </div>
          <div className={styles.localNote}><Icon name="shield" /><div><strong>{t('localTitle')}</strong><p>{t('localDescription')}</p></div></div>
          {(joined || warning) && <button type="button" className={styles.resetButton} onClick={() => setResetOpen(true)}><Icon name="refresh" />{t('reset')}</button>}
        </aside>
      </div>
      <div className={styles.bottomNote}><span>{t('bottomEyebrow')}</span><p>{t('bottomNote')}</p><Icon name="sparkle" /></div>
    </main>
    <footer className={styles.footer}><span>{t('rallyName')}</span><span>{t('footerDescription')}</span><span>{t('footerEyebrow')}</span></footer>
    {scannerOpen && <Suspense fallback={<Dialog title={t('scannerLoadingTitle')} onClose={() => setScannerOpen(false)}><p role="status">{t('scannerLoading')}</p></Dialog>}><Scanner onScan={scan} onClose={() => setScannerOpen(false)} /></Suspense>}
    {resetOpen && <Dialog title={t('resetTitle')} onClose={() => setResetOpen(false)}>
      <p className={styles.dialogIntro}>{t('resetDescription', { count })}</p>
      <div className={styles.resetActions}><button type="button" className={styles.secondary} onClick={() => setResetOpen(false)}>{t('cancel')}</button><button type="button" className={styles.danger} onClick={() => { if (reset()) setResetOpen(false); }}>{t('confirmReset')}</button></div>
      {warning && <p role="alert" className={styles.error}>{warning}</p>}
    </Dialog>}
  </div>;
}
