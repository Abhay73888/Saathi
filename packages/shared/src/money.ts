/**
 * Money helpers. ALL monetary values on the platform are integer paise
 * (₹1 = 100 paise). Floats are banned in money code — these helpers are
 * the only sanctioned way to convert/display money.
 */

export const PAISE_PER_RUPEE = 100n;

export function rupeesToPaise(rupees: number): bigint {
  return BigInt(Math.round(rupees * 100));
}

export function paiseToRupees(paise: bigint | number): number {
  return Number(paise) / 100;
}

/** Indian-grouped rupee display, e.g. 117500 -> "₹1,175" (or ₹1,175.50 with paise). */
export function formatINR(paise: bigint | number): string {
  const total = Number(paise);
  const rupees = Math.floor(total / 100);
  const rem = total % 100;
  const grouped = rupees.toLocaleString('en-IN');
  return rem === 0 ? `₹${grouped}` : `₹${grouped}.${String(rem).padStart(2, '0')}`;
}

/**
 * Apply a percentage to a paise amount using integer math with HALF-UP rounding.
 * e.g. percentOf(100000n, 18) = 18% of ₹1,000 in paise.
 */
export function percentOf(amountPaise: bigint, percent: number): bigint {
  if (percent < 0 || percent > 100) throw new Error(`percent out of range: ${percent}`);
  const scaled = amountPaise * BigInt(Math.round(percent * 100));
  const half = 5000n; // rounding for /10000 with half-up
  const result = (scaled + half) / 10000n;
  return scaled >= 0n ? result : -result;
}
