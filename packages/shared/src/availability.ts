/**
 * Availability math (pure, timezone-agnostic — callers convert weekly
 * HH:MM slots into absolute Date intervals in the companion's timezone).
 *
 * Free slots = recurring availability
 *              + AVAILABLE overrides
 *              − BLOCKED / BREAK overrides
 *              − confirmed/active bookings
 * then clipped to minimum-duration chunks.
 *
 * The database ALSO enforces no double-booking via an EXCLUDE constraint;
 * this function is for display + pre-validation, the constraint is authoritative.
 */

export interface Interval {
  start: Date;
  end: Date;
}

export type OverrideKind = 'AVAILABLE' | 'BLOCKED' | 'BREAK';
export interface Override extends Interval {
  kind: OverrideKind;
}

export function mergeOverlaps(intervals: Interval[]): Interval[] {
  const sorted = [...intervals].sort((a, b) => a.start.getTime() - b.start.getTime());
  const out: Interval[] = [];
  for (const iv of sorted) {
    const last = out[out.length - 1];
    if (last && iv.start.getTime() <= last.end.getTime()) {
      last.end = new Date(Math.max(last.end.getTime(), iv.end.getTime()));
    } else {
      out.push({ start: iv.start, end: iv.end });
    }
  }
  return out;
}

function subtractOne(a: Interval, b: Interval): Interval[] {
  if (b.end <= a.start || b.start >= a.end) return [a]; // no overlap
  const pieces: Interval[] = [];
  if (b.start > a.start) pieces.push({ start: a.start, end: new Date(Math.min(b.start.getTime(), a.end.getTime())) });
  if (b.end < a.end) pieces.push({ start: new Date(Math.max(b.end.getTime(), a.start.getTime())), end: a.end });
  return pieces;
}

export function subtractIntervals(avail: Interval[], blocked: Interval[]): Interval[] {
  let result = mergeOverlaps(avail);
  for (const b of mergeOverlaps(blocked)) {
    result = result.flatMap((a) => subtractOne(a, b));
  }
  return result.filter((i) => i.end.getTime() > i.start.getTime());
}

export interface FreeSlotsInput {
  /** recurring slots mapped to absolute times for the queried window */
  recurring: Interval[];
  overrides: Override[];
  /** confirmed/in-progress/pending-payment bookings */
  bookings: Interval[];
  /** minimum chunk size in minutes */
  durationMinutes: number;
}

export function computeFreeSlots({
  recurring,
  overrides,
  bookings,
  durationMinutes,
}: FreeSlotsInput): Interval[] {
  const additions = overrides
    .filter((o) => o.kind === 'AVAILABLE')
    .map((o) => ({ start: o.start, end: o.end }));
  const blocks = [
    ...overrides
      .filter((o) => o.kind === 'BLOCKED' || o.kind === 'BREAK')
      .map((o) => ({ start: o.start, end: o.end })),
    ...bookings,
  ];

  const merged = mergeOverlaps([...recurring, ...additions]);
  const free = subtractIntervals(merged, blocks);
  const minMs = durationMinutes * 60_000;
  return free
    .filter((i) => i.end.getTime() - i.start.getTime() >= minMs)
    .sort((a, b) => a.start.getTime() - b.start.getTime());
}

/** True if a requested [start,end) fits inside any free slot. */
export function isWindowBookable(free: Interval[], start: Date, end: Date): boolean {
  return free.some((i) => start.getTime() >= i.start.getTime() && end.getTime() <= i.end.getTime());
}
