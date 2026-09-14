import { prisma } from '../lib/prisma.js';
import { DEFAULT_FEES, DEFAULT_CANCELLATION_TIERS } from '@saath/shared';

/**
 * Platform settings live in the DB (admin-editable, audited) with safe
 * defaults. Commission/tax values are NEVER hardcoded inside business
 * logic — always read through here and snapshotted onto bookings.
 */
export interface PlatformSettings {
  companionCommissionPercent: number;
  taxPercent: number;
  minBookingPaise: bigint;
  payoutCooldownHours: number;
  paymentWindowMinutes: number;
  cancellationTiers: { hoursBefore: number; refundPercent: number }[];
}

const DEFAULTS: PlatformSettings = {
  companionCommissionPercent: DEFAULT_FEES.companionCommissionPercent,
  taxPercent: DEFAULT_FEES.taxPercent,
  minBookingPaise: DEFAULT_FEES.minBookingPaise,
  payoutCooldownHours: 48,
  paymentWindowMinutes: 30,
  cancellationTiers: DEFAULT_CANCELLATION_TIERS,
};

export async function getSettings(): Promise<PlatformSettings> {
  const row = await prisma.platformSetting.findUnique({ where: { key: 'platform' } });
  if (!row) return DEFAULTS;
  const v = row.value as Record<string, unknown>;
  return {
    ...DEFAULTS,
    ...v,
    minBookingPaise: v.minBookingPaise != null ? BigInt(v.minBookingPaise as number) : DEFAULTS.minBookingPaise,
    cancellationTiers:
      (v.cancellationTiers as PlatformSettings['cancellationTiers']) ?? DEFAULTS.cancellationTiers,
  } as PlatformSettings;
}

export async function updateSettings(
  patch: Partial<PlatformSettings>,
  actorId: string,
): Promise<PlatformSettings> {
  const serialisable = {
    ...patch,
    minBookingPaise: patch.minBookingPaise != null ? Number(patch.minBookingPaise) : undefined,
  };
  await prisma.platformSetting.upsert({
    where: { key: 'platform' },
    create: { key: 'platform', value: serialisable as object, updatedById: actorId },
    update: { value: serialisable as object, updatedById: actorId },
  });
  return getSettings();
}
