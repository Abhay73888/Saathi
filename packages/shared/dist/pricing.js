import { percentOf } from './money.js';
export const DEFAULT_FEES = {
    companionCommissionPercent: 15,
    taxPercent: 18,
    minBookingPaise: 19900n, // ₹199
};
/**
 * Pricing engine.
 *
 * Revenue model (transparent, commission-side):
 *   customer pays: base
 *   companion earns: base − commission
 *   platform keeps: commission (+ tax portion settled to authority)
 */
export function calculatePrice(basePaise, fees = DEFAULT_FEES) {
    if (basePaise < 0n)
        throw new Error('base cannot be negative');
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
/** Default policy; overridden per platform settings. Evaluated most-generous-first. */
export const DEFAULT_CANCELLATION_TIERS = [
    { hoursBefore: 48, refundPercent: 100 },
    { hoursBefore: 24, refundPercent: 50 },
    { hoursBefore: 0, refundPercent: 0 },
];
export function refundPercentForCancellation(startsAt, cancelledAt = new Date(), tiers = DEFAULT_CANCELLATION_TIERS) {
    const hoursRemaining = (startsAt.getTime() - cancelledAt.getTime()) / 3_600_000;
    const sorted = [...tiers].sort((a, b) => b.hoursBefore - a.hoursBefore);
    for (const tier of sorted) {
        if (hoursRemaining >= tier.hoursBefore)
            return tier.refundPercent;
    }
    return 0;
}
