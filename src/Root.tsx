import { lazy, Suspense, useEffect, useState, type ComponentType } from 'react'

type ImplId = 'astra' | 'claude'

interface Impl {
  id: ImplId
  label: string
  path: string
}

const IMPLS: readonly Impl[] = [
  { id: 'astra', label: 'GPT Astra 구현', path: '/astra' },
  { id: 'claude', label: 'Claude 구현', path: '/claude' },
]

const modules = import.meta.glob<{ default: ComponentType }>('./{astra,claude}/App.tsx')

function loadImpl(id: ImplId): ComponentType | null {
  const loader = modules[`./${id}/App.tsx`]
  if (!loader) return null
  return lazy(loader)
}

const IMPL_COMPONENTS: Record<ImplId, ComponentType | null> = {
  astra: loadImpl('astra'),
  claude: loadImpl('claude'),
}

function matchImpl(pathname: string): Impl | null {
  return IMPLS.find((impl) => pathname === impl.path || pathname.startsWith(`${impl.path}/`)) ?? null
}

function usePathname(): string {
  const [pathname, setPathname] = useState(() => window.location.pathname)
  useEffect(() => {
    const onPop = () => setPathname(window.location.pathname)
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])
  return pathname
}

function Landing() {
  return (
    <main className="root-landing">
      <h1>QR 스탬프 랠리 — 구현 비교</h1>
      <p>아래 링크에서 각 구현으로 이동합니다.</p>
      <nav aria-label="구현 목록">
        <ul>
          {IMPLS.map((impl) => (
            <li key={impl.id}>
              <a href={impl.path}>
                {impl.label} <code>{impl.path}</code>
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </main>
  )
}

function NotImplemented({ impl }: { impl: Impl }) {
  return (
    <main className="root-landing">
      <h1>{impl.label}</h1>
      <p>
        이 경로의 구현(<code>src/{impl.id}/App.tsx</code>)이 아직 없습니다.
      </p>
      <p>
        <a href="/">비교 페이지로 돌아가기</a>
      </p>
    </main>
  )
}

function NotFound() {
  return (
    <main className="root-landing">
      <h1>페이지를 찾을 수 없습니다</h1>
      <p>
        <a href="/">비교 페이지로 돌아가기</a>
      </p>
    </main>
  )
}

export function Root() {
  const pathname = usePathname()
  if (pathname === '/' || pathname === '') return <Landing />

  const impl = matchImpl(pathname)
  if (!impl) return <NotFound />

  const App = IMPL_COMPONENTS[impl.id]
  if (!App) return <NotImplemented impl={impl} />

  return (
    <Suspense fallback={<main className="root-landing">불러오는 중…</main>}>
      <App key={impl.id} />
    </Suspense>
  )
}
