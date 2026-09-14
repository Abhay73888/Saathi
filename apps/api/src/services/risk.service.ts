import { RiskLevel, type RiskEventType } from '@saath/shared';
import { scoreSignals, levelForScore } from '@saath/shared';
import { prisma } from '../lib/prisma.js';
import { notify } from './notification.service.js';
import { NotificationType } from '@saath/shared';

/**
 * Records a risk event and recomputes the user's cumulative score.
 * HIGH risk pages the moderation queue via notification — NEVER auto-bans.
 * Reversible automatic effects (payout holds, re-verification challenges)
 * are evaluated by callers/queues against the stored level.
 */
export async function recordRiskEvent(
  userId: string,
  type: RiskEventType,
  signals: Record<string, unknown> = {},
): Promise<{ score: number; level: RiskLevel }> {
  const weights = recordRiskEvent.weights;
  const delta = weights[type as keyof typeof weights] ?? 5;

  await prisma.riskEvent.create({
    data: { userId, type, signals: signals as object, riskDelta: delta },
  });

  const events = await prisma.riskEvent.findMany({ where: { userId } });
  const { score, level } = scoreSignals(events.map((e) => e.type as never));

  const prev = await prisma.riskScore.findUnique({ where: { userId } });
  await prisma.riskScore.upsert({
    where: { userId },
    create: { userId, score, level, reasons: events.map((e) => e.type) },
    update: { score, level, reasons: events.map((e) => e.type), updatedAt: new Date() },
  });

  if (level === RiskLevel.HIGH && prev?.level !== RiskLevel.HIGH) {
    const admins = await prisma.user.findMany({ where: { role: 'ADMIN', status: 'ACTIVE' } });
    for (const admin of admins) {
      await notify(admin.id, NotificationType.SAFETY_ALERT, {
        kind: 'RISK_HIGH',
        userId,
        score,
      });
    }
  }
  return { score, level };
}
recordRiskEvent.weights = {
  PAYMENT_FAILURE: 10,
  CHARGEBACK: 30,
  CANCELLATION_SPIKE: 15,
  MESSAGE_FLAG: 8,
  REPORT: 20,
  OFF_PLATFORM_PAYMENT_ATTEMPT: 25,
  SIGNUP_VELOCITY: 15,
  DEVICE_SHARED: 10,
  THREAT_KEYWORD: 25,
} as const;

export async function getRiskLevel(userId: string): Promise<RiskLevel> {
  const score = await prisma.riskScore.findUnique({ where: { userId } });
  return score?.level ?? RiskLevel.LOW;
}

export { levelForScore };
