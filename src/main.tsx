import React, { Suspense, lazy } from 'react';
import ReactDOM from 'react-dom/client';

const Astra = lazy(() => import('./astra/App'));
const path = window.location.pathname.replace(/\/+$/, '') || '/';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {path === '/astra' ? (
      <Suspense fallback={<p role="status">스탬프 카드를 준비하고 있어요…</p>}>
        <Astra />
      </Suspense>
    ) : (
      <main style={{ padding: '48px', fontFamily: 'sans-serif', lineHeight: 2 }}>
        {path !== '/' && <p>{path === '/claude' ? '이 브랜치에는 Claude 구현이 없습니다.' : '페이지를 찾을 수 없습니다.'}</p>}
        <nav aria-label="구현 비교">
          <a href="/astra">Astra</a>
          {' · '}
          <a href="/claude">Claude</a>
        </nav>
      </main>
    )}
  </React.StrictMode>,
);
