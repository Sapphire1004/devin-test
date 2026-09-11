import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { Root } from './Root'

function navigate(path: string) {
  window.history.replaceState(null, '', path)
  fireEvent.popState(window)
}

describe('comparison shell', () => {
  it('loads both implementations and preserves their independent participation records', async () => {
    const user = userEvent.setup()
    navigate('/astra')
    const view = render(<Root />)
    await user.click(await screen.findByRole('button', { name: '참여하기' }))
    const astra = localStorage.getItem('stamprally:astra:v1')
    expect(astra).not.toBeNull()
    expect(localStorage.getItem('stamprally:claude:v1')).toBeNull()

    navigate('/claude')
    await user.click(await screen.findByRole('button', { name: '참여하기' }))
    const claude = localStorage.getItem('stamprally:claude:v1')
    expect(claude).not.toBeNull()
    expect(localStorage.getItem('stamprally:astra:v1')).toBe(astra)
    expect(document.querySelector('.claude-shell')).not.toBeNull()

    navigate('/astra/')
    await screen.findByRole('button', { name: 'QR 스캔하기' })
    expect(document.querySelector('.claude-shell')).toBeNull()
    expect(screen.queryByRole('button', { name: '참여하기' })).not.toBeInTheDocument()
    expect(localStorage.getItem('stamprally:claude:v1')).toBe(claude)

    view.unmount()
    navigate('/claude/')
    render(<Root />)
    expect(await screen.findByTestId('claude-progress')).toHaveTextContent('0/5')
    expect(screen.queryByRole('button', { name: '참여하기' })).not.toBeInTheDocument()
  })

  it('links both implementations and handles unknown paths', async () => {
    navigate('/')
    render(<Root />)
    expect(screen.getByRole('link', { name: /GPT Astra/ })).toHaveAttribute('href', '/astra')
    expect(screen.getByRole('link', { name: /Claude/ })).toHaveAttribute('href', '/claude')

    navigate('/missing')
    expect(await screen.findByRole('heading', { name: '페이지를 찾을 수 없습니다' })).toBeInTheDocument()
  })
})
