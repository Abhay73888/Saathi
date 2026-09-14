import { CheckinStatus, NotificationType } from '@saath/shared';
import { prisma } from '../lib/prisma.js';
import { logger } from '../lib/logger.js';
import { autoCompleteBookings, expireUnpaidBookings } from '../services/booking.service.js';
import { releaseMaturedEarnings } from '../services/wallet.service.js';
import { getSettings } from '../services/settings.service.js';
import { notify } from '../services/notification.service.js';

/**
 * Lightweight cron loop. In production these are BullMQ repeatable jobs on
 * Redis (same functions, different trigger) — see Phase 6 deployment notes.
 */
export function startScheduler(): NodeJS.Timeout {
  const TICK = 60_000; // every minute

  const tick = async () => {
    try {
      const settings = await getSettings();
      const [expired, completed, released] = await Promise.all([
        expireUnpaidBookings(),
        autoCompleteBookings(),
        releaseMaturedEarnings(settings.payoutCooldownHours),
        safetyEscalations(),
      ]);
      if (expired || completed || released) {
        logger.info('scheduler.tick', { expired, completed, released });
      }
    } catch (err) {
      logger.error('scheduler.error', { message: (err as Error).message });
    }
  };

  const interval = setInterval(tick, TICK);
  // First run shortly after boot.
  setTimeout(tick, 5_000);
  return interval;
}

/**
 * Safety check-in escalation:
 *  - +15 min after booking end, no check-out → remind both users
 *  - +45 min → escalate to safety team (admins)
 */
async function safetyEscalations(): Promise<number> {
  const now = Date.now();
  const checkedIn = await prisma.safetyCheckin.findMany({
    where: { status: CheckinStatus.CHECKED_IN },
    include: { booking: { include: { companion: true } } },
  });

  let escalated = 0;
  for (const checkin of checkedIn) {
    const endMs = checkin.booking.endAt.getTime();
    const overdueMin = (now - endMs) / 60_000;
    if (overdueMin < 15) continue;

    const alreadyReminded = checkin.remindersSentAt.length;
    if (overdueMin >= 15 && alreadyReminded === 0) {
      await prisma.safetyCheckin.update({
        where: { id: checkin.id },
        data: { remindersSentAt: [...checkin.remindersSentAt, new Date()] },
      });
      await notify(checkin.booking.customerId, NotificationType.SAFETY_ALERT, {
        kind: 'CHECKOUT_REMINDER',
        bookingId: checkin.bookingId,
      });
      await notify(checkin.booking.companion.userId, NotificationType.SAFETY_ALERT, {
        kind: 'CHECKOUT_REMINDER',
        bookingId: checkin.bookingId,
      });
    } else if (overdueMin >= 45 && alreadyReminded === 1) {
      await prisma.safetyCheckin.update({
        where: { id: checkin.id },
        data: {
          status: CheckinStatus.MISSED_ESCALATED,
          remindersSentAt: [...checkin.remindersSentAt, new Date()],
        },
      });
      const admins = await prisma.user.findMany({ where: { role: 'ADMIN', status: 'ACTIVE' } });
      for (const admin of admins) {
        await notify(admin.id, NotificationType.SAFETY_ALERT, {
          kind: 'MISSED_CHECKOUT_ESCALATION',
          bookingId: checkin.bookingId,
        });
      }
      escalated++;
    }
  }
  return escalated;
}
