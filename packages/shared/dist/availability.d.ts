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
export declare function mergeOverlaps(intervals: Interval[]): Interval[];
export declare function subtractIntervals(avail: Interval[], blocked: Interval[]): Interval[];
export interface FreeSlotsInput {
    /** recurring slots mapped to absolute times for the queried window */
    recurring: Interval[];
    overrides: Override[];
    /** confirmed/in-progress/pending-payment bookings */
    bookings: Interval[];
    /** minimum chunk size in minutes */
    durationMinutes: number;
}
export declare function computeFreeSlots({ recurring, overrides, bookings, durationMinutes, }: FreeSlotsInput): Interval[];
/** True if a requested [start,end) fits inside any free slot. */
export declare function isWindowBookable(free: Interval[], start: Date, end: Date): boolean;
