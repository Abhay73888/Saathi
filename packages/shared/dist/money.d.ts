/**
 * Money helpers. ALL monetary values on the platform are integer paise
 * (₹1 = 100 paise). Floats are banned in money code — these helpers are
 * the only sanctioned way to convert/display money.
 */
export declare const PAISE_PER_RUPEE = 100n;
export declare function rupeesToPaise(rupees: number): bigint;
export declare function paiseToRupees(paise: bigint | number): number;
/** Indian-grouped rupee display, e.g. 117500 -> "₹1,175" (or ₹1,175.50 with paise). */
export declare function formatINR(paise: bigint | number): string;
/**
 * Apply a percentage to a paise amount using integer math with HALF-UP rounding.
 * e.g. percentOf(100000n, 18) = 18% of ₹1,000 in paise.
 */
export declare function percentOf(amountPaise: bigint, percent: number): bigint;
