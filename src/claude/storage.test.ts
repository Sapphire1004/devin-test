import { describe, expect, it } from 'vitest'
import { clearState, INITIAL_STATE, loadState, saveState, STORAGE_KEY } from './storage'

describe('storage', () => {
  it('uses the isolated Claude storage key', () => {
    expect(STORAGE_KEY).toBe('stamprally:claude:v1')
  })

  it('starts unjoined with zero stamps', () => {
    expect(loadState()).toEqual(INITIAL_STATE)
  })

  it('round-trips a joined state with stamps', () => {
    const state = {
      joined: true,
      joinedAt: '2026-09-11T05:00:00.000Z',
      stamps: [{ spotId: 'spot-2', visitedAt: '2026-09-11T05:01:00.000Z' }],
    }
    saveState(state)
    expect(loadState()).toEqual(state)
  })

  it('ignores corrupt or foreign data', () => {
    window.localStorage.setItem(STORAGE_KEY, '{not json')
    expect(loadState()).toEqual(INITIAL_STATE)

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 99, joined: true, stamps: [] }))
    expect(loadState()).toEqual(INITIAL_STATE)
  })

  it('drops unknown spots, duplicates and bad timestamps', () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        version: 1,
        joined: true,
        joinedAt: 'nope',
        stamps: [
          { spotId: 'spot-1', visitedAt: '2026-09-11T05:01:00.000Z' },
          { spotId: 'spot-1', visitedAt: '2026-09-11T06:01:00.000Z' },
          { spotId: 'spot-99', visitedAt: '2026-09-11T05:01:00.000Z' },
          { spotId: 'spot-3', visitedAt: 'invalid' },
          'garbage',
        ],
      }),
    )
    expect(loadState()).toEqual({
      joined: true,
      joinedAt: null,
      stamps: [{ spotId: 'spot-1', visitedAt: '2026-09-11T05:01:00.000Z' }],
    })
  })

  it('does not touch other implementations’ keys', () => {
    window.localStorage.setItem('stamprally:astra:v1', 'keep-me')
    saveState({ joined: true, joinedAt: null, stamps: [] })
    clearState()
    expect(window.localStorage.getItem(STORAGE_KEY)).toBeNull()
    expect(window.localStorage.getItem('stamprally:astra:v1')).toBe('keep-me')
  })
})
