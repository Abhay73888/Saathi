import { percentOf } from './money.js';

/**
 * Fee configuration. Values come from platform_settings (admin-configurable),
 * NEVER hardcoded in business logic. They are snapshotted onto each booking
 * at creation so historical bookings always reproduce their math.
 */
export interface FeeConfig {
  /** Platform commission taken from the companion's payout, percent e.g. 15 */
  companionCommissionPercent: number;
  /** Tax (GST) applied to the platform commission, percent e.g. 18 */
  taxPercent: number;
  /** Minimum allowed booking total in paise */
  minBookingPaise: bigint;
}

export const DEFAULT_FEES: FeeConfig = {
  companionCommissionPercent: 15,
  taxPercent: 18,
  minBookingPaise: 19900n, // ₹199
};

export interface PriceBreakdown {
  basePaise: bigint;
  commissionPaise: bigint;
  taxPaise: bigint;
  /** Customer always pays the base rate; commission + GST are settled by the platform. */
  totalPaise: bigint;
  /** Amount credited to the companion wallet (base − commission). */
  companionCreditPaise: bigint;
  /** Platform gross revenue incl. tax collected. */
  platformRevenuePaise: bigint;
}

/**
 * Pricing engine.
 *
 * Revenue model (transparent, commission-side):
 *   customer pays: base
 *   companion earns: base − commission
 *   platform keeps: commission (+ tax portion settled to authority)
 */
export function calculatePrice(basePaise: bigint, fees: FeeConfig = DEFAULT_FEES): PriceBreakdown {
  if (basePaise < 0n) throw new Error('base cannot be negative');
  if (basePaise < fees.minBookingPaise) {
    throw new Error(`BOOKING_BELOW_MINIMUM: minimum is ${fees.minBookingPaise} paise`);
  }
  const commissionPaise = percentOf(basePaise, fees.companionCommissionPercent);
  const taxPaise = percentOf(commissionPaise, fees.taxPercent);
  const companionCreditPaise = basePaise - commissionPaise;

  return {
    basePaise,
    commissionPaise,
    taxPaise,
    totalPaise: basePaise,
    companionCreditPaise,
    platformRevenuePaise: commissionPaise + taxPaise,
  };
}

export interface CancellationTier {
  /** Hours before start; refund percent if cancelled with >= this many hours remaining */
  hoursBefore: number;
  refundPercent: number;
}

/** Default policy; overridden per platform settings. Evaluated most-generous-first. */
export const DEFAULT_CANCELLATION_TIERS: CancellationTier[] = [
  { hoursBefore: 48, refundPercent: 100 },
  { hoursBefore: 24, refundPercent: 50 },
  { hoursBefore: 0, refundPercent: 0 },
];

export function refundPercentForCancellation(
  startsAt: Date,
  cancelledAt: Date = new Date(),
  tiers: CancellationTier[] = DEFAULT_CANCELLATION_TIERS,
): number {
  const hoursRemaining = (startsAt.getTime() - cancelledAt.getTime()) / 3_600_000;
  const sorted = [...tiers].sort((a, b) => b.hoursBefore - a.hoursBefore);
  for (const tier of sorted) {
    if (hoursRemaining >= tier.hoursBefore) return tier.refundPercent;
  }
  return 0;
}
