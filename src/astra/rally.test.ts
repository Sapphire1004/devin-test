import { describe, expect, it } from 'vitest';
import { Card, SPOTS, emptyCard, parseCard, scanCard } from './rally';

const joinedAt = '2026-09-11T07:00:00.000Z';
const visitedAt = '2026-09-11T08:00:00.000Z';
const joined = { ...emptyCard(), joinedAt };

describe('rally rules', () => {
  it('requires participation before accepting a QR', () => {
    expect(scanCard(emptyCard(), 'stamprally:v1:spot-1', visitedAt).kind).toBe('not-joined');
  });

  it('accepts all five exact payloads in any order and preserves first visits', () => {
    let card: Card = joined;
    for (const spot of [...SPOTS].reverse()) {
      const result = scanCard(card, `stamprally:v1:${spot.id}`, visitedAt);
      expect(result.kind).toBe('added');
      card = result.card;
    }
    expect(Object.keys(card.visits)).toHaveLength(5);
    expect(scanCard(card, 'stamprally:v1:spot-1', '2026-09-12T12:00:00Z')).toMatchObject({
      kind: 'duplicate', card,
    });
    expect(card.visits['spot-1']).toBe(visitedAt);
    expect(joined.visits).toEqual({});
  });

  it.each([
    'hello', 'stamprally:v1:spot-99', 'other-rally:v1:spot-1',
    'stamprally:v1:spot-1 ', ' stamprally:v1:spot-1', 'stamprally:v1:spot-1\n',
    'STAMPRALLY:v1:spot-1', 'stamprally:v2:spot-1', 'stamprally:v1:spot-01',
    'https://example.com/stamprally:v1:spot-1', '',
  ])('rejects the entire nonmatching payload: %j', (payload) => {
    const result = scanCard(joined, payload, visitedAt);
    expect(result.kind).toBe('invalid');
    expect(result.card).toBe(joined);
  });

  it('round-trips a partially completed card', () => {
    const card = scanCard(joined, 'stamprally:v1:spot-2', visitedAt).card;
    expect(parseCard(JSON.stringify(card))).toEqual(card);
    expect(parseCard(JSON.stringify(emptyCard()))).toEqual(emptyCard());
  });

  it.each([
    '{broken', 'null', '[]', 'true',
    JSON.stringify({ ...joined, version: 2 }),
    JSON.stringify({ ...joined, joinedAt: 'yesterday' }),
    JSON.stringify({ ...joined, visits: [] }),
    JSON.stringify({ ...joined, visits: { 'spot-99': visitedAt } }),
    JSON.stringify({ ...joined, visits: { 'spot-1': 'not a date' } }),
    JSON.stringify({ ...emptyCard(), visits: { 'spot-1': visitedAt } }),
  ])('rejects malformed persisted state: %j', (raw) => {
    expect(parseCard(raw)).toBeNull();
  });
});
