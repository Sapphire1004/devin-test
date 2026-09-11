import { findSpotById } from './data'

export const STORAGE_KEY = 'stamprally:claude:v1'

export interface StampRecord {
  spotId: string
  visitedAt: string
}

export interface RallyState {
  joined: boolean
  joinedAt: string | null
  stamps: StampRecord[]
}

export const INITIAL_STATE: RallyState = {
  joined: false,
  joinedAt: null,
  stamps: [],
}

interface Persisted {
  version: 1
  joined: boolean
  joinedAt: string | null
  stamps: StampRecord[]
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isValidIsoDate(value: unknown): value is string {
  return typeof value === 'string' && !Number.isNaN(Date.parse(value))
}

function sanitizeStamps(value: unknown): StampRecord[] {
  if (!Array.isArray(value)) return []
  const seen = new Set<string>()
  const stamps: StampRecord[] = []
  for (const item of value) {
    if (!isRecord(item)) continue
    const { spotId, visitedAt } = item
    if (typeof spotId !== 'string' || !findSpotById(spotId)) continue
    if (!isValidIsoDate(visitedAt)) continue
    if (seen.has(spotId)) continue
    seen.add(spotId)
    stamps.push({ spotId, visitedAt })
  }
  return stamps
}

export function loadState(storage: Storage = window.localStorage): RallyState {
  let raw: string | null
  try {
    raw = storage.getItem(STORAGE_KEY)
  } catch {
    return INITIAL_STATE
  }
  if (!raw) return INITIAL_STATE

  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return INITIAL_STATE
  }
  if (!isRecord(parsed) || parsed.version !== 1) return INITIAL_STATE

  const joined = parsed.joined === true
  if (!joined) return INITIAL_STATE

  return {
    joined: true,
    joinedAt: isValidIsoDate(parsed.joinedAt) ? parsed.joinedAt : null,
    stamps: sanitizeStamps(parsed.stamps),
  }
}

export function saveState(state: RallyState, storage: Storage = window.localStorage): void {
  const payload: Persisted = {
    version: 1,
    joined: state.joined,
    joinedAt: state.joinedAt,
    stamps: state.stamps,
  }
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(payload))
  } catch {
    // Storage may be unavailable (private mode / quota); the in-memory state still works.
  }
}

export function clearState(storage: Storage = window.localStorage): void {
  try {
    storage.removeItem(STORAGE_KEY)
  } catch {
    // ignore
  }
}
