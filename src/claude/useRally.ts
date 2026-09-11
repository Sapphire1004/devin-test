import { useCallback, useEffect, useMemo, useReducer } from 'react'
import { SPOTS, TOTAL_SPOTS, type Spot } from './data'
import { describeParseFailure, parseQrPayload } from './qr'
import { clearState, INITIAL_STATE, loadState, saveState, type RallyState, type StampRecord } from './storage'

type Action =
  | { type: 'join'; at: string }
  | { type: 'stamp'; spotId: string; at: string }
  | { type: 'reset' }

function reducer(state: RallyState, action: Action): RallyState {
  switch (action.type) {
    case 'join':
      if (state.joined) return state
      return { joined: true, joinedAt: action.at, stamps: [] }
    case 'stamp': {
      if (!state.joined) return state
      if (state.stamps.some((s) => s.spotId === action.spotId)) return state
      return { ...state, stamps: [...state.stamps, { spotId: action.spotId, visitedAt: action.at }] }
    }
    case 'reset':
      return INITIAL_STATE
  }
}

export type StampOutcome =
  | { status: 'added'; spot: Spot; visitedAt: string }
  | { status: 'duplicate'; spot: Spot; visitedAt: string }
  | { status: 'not-joined' }
  | { status: 'rejected'; message: string; code: string }

export interface SpotProgress {
  spot: Spot
  stamp: StampRecord | null
}

export function useRally(now: () => string = () => new Date().toISOString()) {
  const [state, dispatch] = useReducer(reducer, undefined, loadState)

  useEffect(() => {
    if (state.joined) saveState(state)
    else clearState()
  }, [state])

  const join = useCallback(() => dispatch({ type: 'join', at: now() }), [now])

  const reset = useCallback(() => dispatch({ type: 'reset' }), [])

  const registerCode = useCallback(
    (raw: string): StampOutcome => {
      if (!state.joined) return { status: 'not-joined' }
      const parsed = parseQrPayload(raw)
      if (parsed.kind !== 'spot') {
        return { status: 'rejected', message: describeParseFailure(parsed), code: parsed.code }
      }
      const existing = state.stamps.find((s) => s.spotId === parsed.spot.id)
      if (existing) return { status: 'duplicate', spot: parsed.spot, visitedAt: existing.visitedAt }
      const at = now()
      dispatch({ type: 'stamp', spotId: parsed.spot.id, at })
      return { status: 'added', spot: parsed.spot, visitedAt: at }
    },
    [state.joined, state.stamps, now],
  )

  const progress = useMemo<SpotProgress[]>(
    () =>
      SPOTS.map((spot) => ({
        spot,
        stamp: state.stamps.find((s) => s.spotId === spot.id) ?? null,
      })),
    [state.stamps],
  )

  const count = state.stamps.length
  const completed = state.joined && count >= TOTAL_SPOTS
  const completedAt = completed
    ? state.stamps.reduce<string | null>((latest, s) => (latest && latest > s.visitedAt ? latest : s.visitedAt), null)
    : null

  return {
    state,
    progress,
    count,
    total: TOTAL_SPOTS,
    completed,
    completedAt,
    join,
    reset,
    registerCode,
  }
}

export type Rally = ReturnType<typeof useRally>
