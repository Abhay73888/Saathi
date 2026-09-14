import { computeFreeSlots, isWindowBookable, mergeOverlaps, type Interval } from '@saath/shared';
import { AvailabilityKind, BookingStatus } from '@saath/shared';
import { prisma } from '../lib/prisma.js';

/**
 * Convert a wall-clock time ("HH:MM" on a given date) in a given IANA
 * timezone to a UTC instant. Intl gives us tz data without extra deps.
 *
 * We anchor at the wall instant, measure the offset of that anchor in the
 * target tz (rounded to the minute) via Intl longOffset format, then shift.
 */
function wallToUtc(isoDate: string, hhmm: string, tz: string): Date {
  const wallMs = Date.UTC(
    Number(isoDate.slice(0, 4)),
    Number(isoDate.slice(5, 7)) - 1,
    Number(isoDate.slice(8, 10)),
    Number(hhmm.slice(0, 2)),
    Number(hhmm.slice(3, 5)),
    0,
  );
  const offsetMin = getOffsetMinutes(wallMs, tz);
  return new Date(wallMs - offsetMin * 60_000);
}

function getOffsetMinutes(utcMs: number, tz: string): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    timeZoneName: 'longOffset',
  }).formatToParts(new Date(utcMs));
  const tzName = parts.find((p) => p.type === 'timeZoneName')?.value ?? '';
  const m = /GMT(?:([+-])(\d{1,2})(?::(\d{2}))?)?/.exec(tzName);
  if (!m || m[1] === undefined) return 0;
  const sign = m[1] === '-' ? -1 : 1;
  const hours = Number(m[2] ?? 0);
  const mins = Number(m[3] ?? 0);
  return sign * (hours * 60 + mins);
}

function dayOfWeekInTz(utcMs: number, tz: string): number {
  const name = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    weekday: 'short',
  }).format(new Date(utcMs));
  // ISO-style indexing: Monday = 0 … Sunday = 6.
  const map: Record<string, number> = { Mon: 0, Tue: 1, Wed: 2, Thu: 3, Fri: 4, Sat: 5, Sun: 6 };
  const v = map[name];
  return v === undefined ? 0 : v;
}

/**
 * Compute free intervals for a companion on a given calendar date (companion tz).
 * Slots/overrides are stored as wall-clock HH:MM in the companion tz;
 * we convert to UTC instants for interval math.
 */
export async function getFreeSlotsForDate(
  companionProfileId: string,
  dateIso: string, // YYYY-MM-DD
  durationMinutes: number,
  excludeBookingId?: string,
): Promise<Interval[]> {
  const profile = await prisma.companionProfile.findUniqueOrThrow({
    where: { id: companionProfileId },
    include: {
      slots: true,
      overrides: { where: { date: dateIso } },
    },
  });

  // Anchor at noon WALL time in the companion's tz (≈06:30 UTC for IST) so
  // the weekday derived in-tz always matches the date being queried.
  const dayOfWeek = dayOfWeekInTz(
    wallToUtc(dateIso, '12:00', profile.timezone).getTime(),
    profile.timezone,
  );

  const recurring: Interval[] = profile.slots
    .filter((s) => s.dayOfWeek === dayOfWeek)
    .map((s) => ({
      start: wallToUtc(dateIso, s.startTime, profile.timezone),
      end: wallToUtc(dateIso, s.endTime, profile.timezone),
    }));

  const overrides = profile.overrides.map((o) => ({
    kind: o.kind as 'AVAILABLE' | 'BLOCKED' | 'BREAK',
    start: wallToUtc(dateIso, o.startTime ?? '00:00', profile.timezone),
    end: wallToUtc(dateIso, o.endTime ?? '23:59', profile.timezone),
  }));

  const fullyBlocked = overrides.some((o) => o.kind === AvailabilityKind.BLOCKED);

  const dayStart = wallToUtc(dateIso, '00:00', profile.timezone);
  const dayEnd = wallToUtc(dateIso, '23:59', profile.timezone);

  const bookings = await prisma.booking.findMany({
    where: {
      companionProfileId,
      status: {
        in: [
          BookingStatus.CONFIRMED,
          BookingStatus.IN_PROGRESS,
          BookingStatus.PENDING_PAYMENT,
        ],
      },
      startAt: { lt: dayEnd },
      endAt: { gt: dayStart },
      ...(excludeBookingId ? { NOT: { id: excludeBookingId } } : {}),
    },
    select: { startAt: true, endAt: true },
  });

  return computeFreeSlots({
    recurring: fullyBlocked ? [] : recurring,
    overrides,
    bookings: bookings.map((b) => ({ start: b.startAt, end: b.endAt })),
    durationMinutes,
  });
}

/**
 * Authoritative availability check used by booking create + payment creation.
 * Slots are wall-clock per tz date; gather free intervals across every tz
 * date the window touches and test the single continuous UTC range against
 * their union (cross-slot overlaps merge, gaps remain gaps).
 */
export async function assertWindowAvailable(
  companionProfileId: string,
  startAt: Date,
  endAt: Date,
  durationMinutes: number,
  excludeBookingId?: string,
): Promise<boolean> {
  const profile = await prisma.companionProfile.findUniqueOrThrow({
    where: { id: companionProfileId },
    select: { timezone: true },
  });

  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: profile.timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const dates = new Set<string>([fmt.format(startAt), fmt.format(endAt)]);
  for (let t = startAt.getTime(); t < endAt.getTime(); t += 3600e3) {
    dates.add(fmt.format(new Date(t)));
  }

  const freeByDate = await Promise.all(
    [...dates]
      .sort()
      .map((d) => getFreeSlotsForDate(companionProfileId, d, durationMinutes, excludeBookingId)),
  );
  const union = mergeOverlaps(freeByDate.flat());
  return isWindowBookable(union, startAt, endAt);
}
