import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'
import { STORAGE_KEY } from './storage'

const decodeMock = vi.hoisted(() => vi.fn<(file: File) => Promise<unknown>>())

vi.mock('./decode', async () => {
  const actual = await vi.importActual<typeof import('./decode')>('./decode')
  return { ...actual, decodeQrFromFile: decodeMock }
})

function fileNamed(name: string): File {
  return new File(['x'], name, { type: 'image/png' })
}

async function uploadPayload(user: ReturnType<typeof userEvent.setup>, text: string | null) {
  decodeMock.mockResolvedValueOnce(text === null ? { status: 'no-qr' } : { status: 'decoded', text })
  const input = screen.getByTestId('claude-file-input')
  await user.upload(input, fileNamed(`${text ?? 'blank'}.png`))
}

async function join(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: '참여하기' }))
  expect(screen.getByTestId('claude-progress')).toHaveTextContent('0/5')
}

describe('Claude stamp rally app', () => {
  beforeEach(() => {
    decodeMock.mockReset()
  })

  it('shows the intro with five spots and lets the user join', async () => {
    const user = userEvent.setup()
    render(<App />)
    expect(screen.getByRole('heading', { name: '우리 동네 스탬프 랠리' })).toBeInTheDocument()
    for (const name of ['시작 광장', '동네 책방', '골목 카페', '작은 공원', '전망대']) {
      expect(screen.getByText(name)).toBeInTheDocument()
    }
    await join(user)
    expect(window.localStorage.getItem(STORAGE_KEY)).toContain('"joined":true')
  })

  it('registers a stamp via image upload and ignores duplicates', async () => {
    const user = userEvent.setup()
    render(<App />)
    await join(user)

    await uploadPayload(user, 'stamprally:v1:spot-1')
    await waitFor(() => expect(screen.getByTestId('claude-progress')).toHaveTextContent('1/5'))
    const stamp = screen.getByTestId('claude-stamp-spot-1')
    expect(stamp).toHaveAttribute('data-state', 'done')
    const firstTime = within(stamp).getByRole('time').getAttribute('datetime')
    expect(screen.getByTestId('claude-feedback')).toHaveTextContent('시작 광장 스탬프를 찍었습니다!')

    await uploadPayload(user, 'stamprally:v1:spot-1')
    await waitFor(() => expect(screen.getByTestId('claude-feedback')).toHaveTextContent('이미 방문한 장소'))
    expect(screen.getByTestId('claude-progress')).toHaveTextContent('1/5')
    expect(within(screen.getByTestId('claude-stamp-spot-1')).getByRole('time').getAttribute('datetime')).toBe(firstTime)
  })

  it('explains invalid, unknown-spot, other-event and unreadable inputs', async () => {
    const user = userEvent.setup()
    render(<App />)
    await join(user)

    await uploadPayload(user, 'hello')
    await waitFor(() => expect(screen.getByTestId('claude-feedback')).toHaveTextContent('스탬프 랠리 QR이 아닙니다'))

    await uploadPayload(user, 'stamprally:v1:spot-99')
    await waitFor(() => expect(screen.getByTestId('claude-feedback')).toHaveTextContent('등록되지 않은 장소'))

    await uploadPayload(user, 'other-rally:v1:spot-1')
    await waitFor(() => expect(screen.getByTestId('claude-feedback')).toHaveTextContent('다른 행사의 QR'))

    await uploadPayload(user, null)
    await waitFor(() => expect(screen.getByText(/QR을 찾지 못했습니다/)).toBeInTheDocument())

    expect(screen.getByTestId('claude-progress')).toHaveTextContent('0/5')
  })

  it('persists across remount and shows completion after five stamps', async () => {
    const user = userEvent.setup()
    const first = render(<App />)
    await join(user)
    for (const i of [1, 2, 3]) {
      await uploadPayload(user, `stamprally:v1:spot-${i}`)
      await waitFor(() => expect(screen.getByTestId('claude-progress')).toHaveTextContent(`${i}/5`))
    }
    first.unmount()

    render(<App />)
    expect(screen.getByTestId('claude-progress')).toHaveTextContent('3/5')
    expect(screen.queryByTestId('claude-complete')).not.toBeInTheDocument()

    for (const i of [4, 5]) {
      await uploadPayload(user, `stamprally:v1:spot-${i}`)
      await waitFor(() => expect(screen.getByTestId('claude-progress')).toHaveTextContent(`${i}/5`))
    }
    expect(screen.getByTestId('claude-complete')).toHaveTextContent('완주를 축하합니다!')
  })

  it('resets only after confirmation and leaves other implementations’ data alone', async () => {
    const user = userEvent.setup()
    window.localStorage.setItem('stamprally:astra:v1', 'untouched')
    render(<App />)
    await join(user)
    await uploadPayload(user, 'stamprally:v1:spot-2')
    await waitFor(() => expect(screen.getByTestId('claude-progress')).toHaveTextContent('1/5'))

    await user.click(screen.getByRole('button', { name: '기록 초기화' }))
    const dialog = screen.getByTestId('claude-reset-dialog')
    await user.click(within(dialog).getByRole('button', { name: '취소' }))
    expect(screen.getByTestId('claude-progress')).toHaveTextContent('1/5')

    await user.click(screen.getByRole('button', { name: '기록 초기화' }))
    await user.click(within(dialog).getByRole('button', { name: '초기화' }))

    expect(screen.getByRole('button', { name: '참여하기' })).toBeInTheDocument()
    expect(window.localStorage.getItem(STORAGE_KEY)).toBeNull()
    expect(window.localStorage.getItem('stamprally:astra:v1')).toBe('untouched')
  })
})
