import { describe, it, expect } from 'vitest';
import {
  calculatePrice,
  refundPercentForCancellation,
  DEFAULT_FEES,
  HeuristicRecommendationStrategy,
  moderateMessage,
  scoreSignals,
  computeFreeSlots,
  isWindowBookable,
  percentOf,
  formatINR,
  rupeesToPaise,
} from '../src/index.js';

describe('money', () => {
  it('converts rupees to paise', () => {
    expect(rupeesToPaise(499)).toBe(49900n);
    expect(formatINR(117500n)).toBe('₹1,175');
    expect(formatINR(117550n)).toBe('₹1,175.50');
  });

  it('computes percentages with integer half-up rounding', () => {
    expect(percentOf(100000n, 18)).toBe(18000n);
    expect(percentOf(99900n, 15)).toBe(14985n); // 149.85 → rounds
  });
});

describe('pricing engine', () => {
  it('builds the canonical fee breakdown', () => {
    const p = calculatePrice(200000n); // ₹2,000 base
    expect(p.commissionPaise).toBe(30000n); // 15%
    expect(p.taxPaise).toBe(5400n); // 18% of commission
    expect(p.totalPaise).toBe(200000n); // customer pays base
    expect(p.companionCreditPaise).toBe(170000n); // ₹1,700
    expect(p.platformRevenuePaise).toBe(35400n);
  });

  it('rejects bookings below the minimum', () => {
    expect(() => calculatePrice(5000n)).toThrow(/BOOKING_BELOW_MINIMUM/);
  });

  it('honours custom (admin-configured) fees', () => {
    const p = calculatePrice(100000n, { ...DEFAULT_FEES, companionCommissionPercent: 20 });
    expect(p.commissionPaise).toBe(20000n);
    expect(p.companionCreditPaise).toBe(80000n);
  });
});

describe('cancellation policy', () => {
  const start = new Date('2026-09-20T14:00:00Z');
  it('full refund >48h before', () => {
    expect(refundPercentForCancellation(start, new Date('2026-09-17T14:00:00Z'))).toBe(100);
  });
  it('50% within 48–24h', () => {
    expect(refundPercentForCancellation(start, new Date('2026-09-19T14:00:00Z'))).toBe(50);
  });
  it('nothing within 24h', () => {
    expect(refundPercentForCancellation(start, new Date('2026-09-20T10:00:00Z'))).toBe(0);
  });
});

describe('recommendation engine', () => {
  const engine = new HeuristicRecommendationStrategy();
  const base = {
    interests: [],
    languages: [],
    experienceSlugs: [],
    ratePaise: 50000n,
    ratingAvg: 4.5,
    responseRate: 0.9,
    completionRate: 0.95,
    isVerified: true,
    availableForWindow: true,
    city: 'Noida',
  };

  it('ranks a strong match above a weak one', () => {
    const strong = {
      ...base,
      companionId: 'strong',
      interests: ['movies', 'coffee', 'gaming'],
      languages: ['hindi', 'english'],
      experienceSlugs: ['coffee', 'movie'],
    };
    const weak = {
      ...base,
      companionId: 'weak',
      interests: ['hiking'],
      languages: ['tamil'],
      experienceSlugs: ['study'],
      isVerified: false,
      ratingAvg: 3.2,
      responseRate: 0.4,
    };
    const ranked = engine.rank([weak, strong], {
      interests: ['movies', 'coffee', 'gaming'],
      languages: ['hindi', 'english'],
      experienceSlugs: ['coffee', 'movie'],
      city: 'Noida',
      needsAvailability: true,
      budgetPaise: 60000n,
    });
    expect(ranked[0]!.companionId).toBe('strong');
    expect(ranked[0]!.score).toBeGreaterThan(ranked[1]!.score);
    expect(ranked[0]!.score).toBeGreaterThan(70);
  });

  it('never scores above 100', () => {
    const perfect = {
      ...base,
      companionId: 'p',
      interests: ['x'],
      languages: ['x'],
      experienceSlugs: ['x'],
    };
    const r = engine.score(perfect, {
      interests: ['x'],
      languages: ['x'],
      experienceSlugs: ['x'],
      city: 'Noida',
      needsAvailability: true,
      budgetPaise: 99999n,
    });
    expect(r.score).toBeLessThanOrEqual(100);
    expect(r.score).toBeGreaterThanOrEqual(0);
  });

  it('matches semantic synonyms across activity clusters (cafe -> coffee, gig -> concert)', () => {
    const cafeCompanion = {
      ...base,
      companionId: 'c1',
      interests: ['coffee', 'music'],
      experienceSlugs: ['coffee'],
    };
    const score = engine.score(cafeCompanion, {
      interests: ['cafe', 'gig'],
      experienceSlugs: ['brews'],
    });
    expect(score.signals.interests).toBeGreaterThan(0.5);
    expect(score.signals.activities).toBeGreaterThan(0.5);
    expect(score.score).toBeGreaterThan(40);
  });
});

describe('message moderation', () => {
  it('clears normal messages', () => {
    const v = moderateMessage('See you at the café at 2pm!', { hasConfirmedBooking: false });
    expect(v.holdForReview).toBe(false);
    expect(v.signals).toHaveLength(0);
  });

  it('holds off-platform payment solicitation', () => {
    const v = moderateMessage('Pay me via UPI directly to skip the platform fee', {
      hasConfirmedBooking: false,
    });
    expect(v.holdForReview).toBe(true);
    expect(v.signals).toContain('OFF_PLATFORM_PAYMENT_ATTEMPT');
  });

  it('flags pre-booking phone-number sharing as riskier than post-booking', () => {
    const before = moderateMessage('my number is 9876543210 thanks', {
      hasConfirmedBooking: false,
    });
    const after = moderateMessage('my number is 9876543210 thanks', {
      hasConfirmedBooking: true,
    });
    expect(before.risk).not.toBe('LOW');
    expect(after.risk).toBe('MEDIUM');
  });

  it('holds escort and non-platonic solicitation with strict warning', () => {
    const v = moderateMessage('Are you available for escort service or hotel room meetup?', {
      hasConfirmedBooking: false,
    });
    expect(v.holdForReview).toBe(true);
    expect(v.signals).toContain('ESCORT_SOLICITATION');
    expect(v.senderWarning).toContain('platonic, social companionship');
  });
});

describe('risk scoring', () => {
  it('classifies levels and never auto-bans', () => {
    expect(scoreSignals(['REPORT', 'OFF_PLATFORM_PAYMENT_ATTEMPT']).level).toBe('HIGH');
    expect(scoreSignals(['MESSAGE_FLAG']).level).toBe('LOW');
    expect(scoreSignals(['PAYMENT_FAILURE', 'PAYMENT_FAILURE']).level).toBe('MEDIUM');
  });
});

describe('availability math', () => {
  const day = (h: number, m = 0) => new Date(Date.UTC(2026, 8, 12, h, m));

  it('subtracts bookings and breaks, keeps chunks long enough', () => {
    const free = computeFreeSlots({
      recurring: [{ start: day(10), end: day(18) }],
      overrides: [
        { start: day(13), end: day(14), kind: 'BREAK' },
      ],
      bookings: [{ start: day(15), end: day(16) }],
      durationMinutes: 60,
    });
    // 10–13, 14–15, 16–18
    expect(free).toHaveLength(3);
    expect(isWindowBookable(free, day(16, 30), day(17, 30))).toBe(true);
    expect(isWindowBookable(free, day(13, 30), day(14, 30))).toBe(false);
  });

  it('merges overlapping additions', () => {
    const free = computeFreeSlots({
      recurring: [{ start: day(10), end: day(12) }],
      overrides: [{ start: day(12), end: day(13), kind: 'AVAILABLE' }],
      bookings: [],
      durationMinutes: 60,
    });
    expect(free).toHaveLength(1);
    expect(free[0]!.end).toEqual(day(13));
  });
});
