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
export declare const DEFAULT_FEES: FeeConfig;
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
export declare function calculatePrice(basePaise: bigint, fees?: FeeConfig): PriceBreakdown;
export interface CancellationTier {
    /** Hours before start; refund percent if cancelled with >= this many hours remaining */
    hoursBefore: number;
    refundPercent: number;
}
/** Default policy; overridden per platform settings. Evaluated most-generous-first. */
export declare const DEFAULT_CANCELLATION_TIERS: CancellationTier[];
export declare function refundPercentForCancellation(startsAt: Date, cancelledAt?: Date, tiers?: CancellationTier[]): number;
