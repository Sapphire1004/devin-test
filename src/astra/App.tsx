import { lazy, Suspense, useState } from 'react';
import { Dialog } from './Dialog';
import { Icon } from './Icon';
import { Neighborhood } from './Neighborhood';
import { SPOTS, visitTime } from './rally';
import { useCard } from './useCard';
import styles from './App.module.css';

const Scanner = lazy(() => import('./Scanner').then((module) => ({ default: module.Scanner })));

export default function App() {
  const { card, warning, join, scan, reset } = useCard();
  const [scannerOpen, setScannerOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const count = Object.keys(card.visits).length;
  const complete = count === SPOTS.length;
  const joined = card.joinedAt !== null;

  return <div className={styles.app}>
    <a className={styles.skipLink} href="#stamp-card">스탬프 카드로 건너뛰기</a>
    <header className={styles.header}>
      <a href="/astra" className={styles.brand} aria-label="우리 동네 스탬프 랠리 홈"><span className={styles.brandMark}><Icon name="flag" /></span><span>우리 동네<span>STAMP RALLY</span></span></a>
      <div className={styles.headerRight}><span className={styles.edition}><span />ASTRA EDITION</span><a href="/">구현 비교<Icon name="arrow" /></a></div>
    </header>

    <main>
      <section className={styles.hero} aria-labelledby="hero-title">
        <div className={styles.heroCopy}>
          <span className={styles.heroKicker}><span />가까운 곳에서 시작하는 작은 여행</span>
          <h1 id="hero-title">익숙한 동네,<br /><span>새로운 발견.</span><svg viewBox="0 0 40 42" aria-hidden="true"><path d="m8 25 5-19m4 23 17-16M21 36l17-1" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" /></svg></h1>
          <p>우리 동네 스탬프 랠리<br />다섯 곳의 이야기를 만나고, 나만의 산책을 완성해 보세요.</p>
          <div className={styles.heroFacts}><span><Icon name="pin" />5개의 특별한 장소</span><span><Icon name="scan" />QR로 간편하게</span><span>참가비 무료</span></div>
        </div>
        <Neighborhood />
      </section>

      <section className={styles.instructions} aria-label="참여 방법">
        <div><span>01</span><p><strong>참여하고</strong>나만의 스탬프 카드 받기</p></div>
        <Icon name="arrow" />
        <div><span>02</span><p><strong>발견하고</strong>장소에서 QR 스캔하기</p></div>
        <Icon name="arrow" />
        <div><span>03</span><p><strong>완성해요</strong>스탬프 5개로 산책 완주</p></div>
      </section>

      {warning && <div className={styles.storageWarning} role="alert">{warning}</div>}

      <div className={styles.collectionLayout}>
        <section id="stamp-card" className={styles.collection} aria-labelledby="card-title" tabIndex={-1}>
          <div className={styles.sectionHeading}><div><span className={styles.eyebrow}>COLLECT YOUR MOMENTS</span><h2 id="card-title">나의 스탬프 카드<span>05</span></h2></div><span className={styles.collectionCaption}>순서 없이, 발길 닿는 대로</span></div>
          <div className={styles.stampGrid}>
            {SPOTS.map((spot, index) => {
              const visited = card.visits[spot.id];
              return <article key={spot.id} className={`${styles.stampCard} ${visited ? styles.collected : ''}`} aria-label={`${spot.name}: ${visited ? '방문 완료' : '미방문'}`}>
                <div className={styles.stampTop}><span>SPOT 0{index + 1}</span>{visited ? <span className={styles.doneLabel}><Icon name="check" />방문 완료</span> : <Icon name="lock" />}</div>
                <div className={`${styles.stampArt} ${styles[spot.color]} ${visited ? styles.stamped : ''}`}>
                  <div><Icon name={spot.icon} /></div>
                  {visited && <span className={styles.stampSeal}>VISITED</span>}
                </div>
                <h3>{spot.name}</h3><p>{spot.caption}</p>
                <div className={styles.stampBottom}>{visited ? <time dateTime={visited}>{visitTime(visited)}</time> : <><span className={styles.emptyDot} />방문을 기다리고 있어요</>}</div>
              </article>;
            })}
            <div className={`${styles.finishCard} ${complete ? styles.finished : ''}`}><Icon name="sparkle" /><span>YOUR LITTLE ACHIEVEMENT</span><h3>{complete ? '산책을 완성했어요!' : '다섯 번의 발견,\n하나의 완주.'}</h3><p>{complete ? '우리 동네의 모든 순간을 모았어요.' : '마지막 스탬프를 모으면\n우리 동네 탐험가가 됩니다.'}</p><div>{complete ? '동네 탐험가' : '모든 순간을 모아 보세요'}<Icon name={complete ? 'check' : 'arrow'} /></div></div>
          </div>
        </section>

        <aside className={styles.passportColumn} aria-label="참여 및 진행도">
          <div className={styles.passport}>
            <div className={styles.passportHeading}><span>MY WALK PASSPORT</span><Icon name="sparkle" /></div>
            <div className={styles.passportStatus}><span className={styles.statusDot} />{complete ? '산책 완주' : joined ? '산책 진행 중' : '새로운 산책을 준비 중'}</div>
            <h2>{complete ? <>동네 탐험가가<br />되었어요!</> : joined ? <>좋은 발견을<br />이어가 볼까요?</> : <>오늘의 산책을<br />시작해 볼까요?</>}</h2>
            <p>{complete ? '다섯 곳의 소중한 순간이\n나만의 카드에 모두 담겼어요.' : joined ? '다음 장소에서 QR을 스캔하고\n새로운 순간을 카드에 담아 보세요.' : '가벼운 발걸음으로 동네를 걷고,\n스탬프를 하나씩 모아 보세요.'}</p>
            <div className={styles.progressNumbers} aria-live="polite"><span>나의 탐험 진행도</span><strong>{count}<span> / 5</span></strong></div>
            <div className={styles.progressBar} role="progressbar" aria-label="스탬프 수집 진행도" aria-valuenow={count} aria-valuemin={0} aria-valuemax={5} aria-valuetext={`${count}/5 스탬프`}><span style={{ width: `${count * 20}%` }} /></div>
            <div className={styles.progressCaption}><span>{complete ? '모든 장소 방문 완료' : `완주까지 ${5 - count}개의 발견`}</span><span>{count * 20}%</span></div>
            {complete && <div className={styles.completionNotice} role="status"><Icon name="check" />축하해요! 스탬프 5개를 모두 모았어요.</div>}
            <button type="button" className={styles.primary} onClick={() => joined ? setScannerOpen(true) : join()}><Icon name={joined ? 'scan' : 'flag'} />{joined ? 'QR 스캔하기' : '참여하기'}<Icon name="arrow" /></button>
            <span className={styles.passportNote}>{joined ? '카메라 또는 QR 이미지로 등록할 수 있어요' : '가입 없이, 지금 바로 시작하세요'}</span>
            <div className={styles.passportPerforation} />
            <div className={styles.passportFooter}><span>NEIGHBORHOOD EXPLORER</span><span>ASTRA / 001</span></div>
          </div>
          <div className={styles.localNote}><Icon name="shield" /><div><strong>나의 기록은 이 브라우저에</strong><p>참여와 방문 기록은 자동으로 저장돼요.<br />같은 브라우저에서 산책을 이어가세요.</p></div></div>
          {(joined || warning) && <button type="button" className={styles.resetButton} onClick={() => setResetOpen(true)}><Icon name="refresh" />기록 초기화</button>}
        </aside>
      </div>
      <div className={styles.bottomNote}><span>TAKE A WALK. MAKE A MEMORY.</span><p>멀리 가지 않아도, 발견은 늘 가까이에.</p><Icon name="sparkle" /></div>
    </main>
    <footer className={styles.footer}><span>우리 동네 스탬프 랠리</span><span>작은 산책이 만드는 다섯 번의 발견</span><span>MADE FOR YOUR NEIGHBORHOOD</span></footer>
    {scannerOpen && <Suspense fallback={<Dialog title="스캐너 준비 중" onClose={() => setScannerOpen(false)}><p role="status">QR 스캐너를 불러오고 있어요…</p></Dialog>}><Scanner onScan={scan} onClose={() => setScannerOpen(false)} /></Suspense>}
    {resetOpen && <Dialog title="산책 기록을 초기화할까요?" onClose={() => setResetOpen(false)}>
      <p className={styles.dialogIntro}>Astra의 참여 기록과 스탬프 {count}개가 삭제됩니다. 삭제한 기록은 되돌릴 수 없어요.</p>
      <div className={styles.resetActions}><button type="button" className={styles.secondary} onClick={() => setResetOpen(false)}>취소</button><button type="button" className={styles.danger} onClick={() => { if (reset()) setResetOpen(false); }}>초기화하기</button></div>
      {warning && <p role="alert" className={styles.error}>{warning}</p>}
    </Dialog>}
  </div>;
}
