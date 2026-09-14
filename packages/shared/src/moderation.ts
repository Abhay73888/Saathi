import { ModerationStatus, RiskLevel } from './enums.js';

/**
 * Synchronous message pre-screening. Fast regex/blocklist that runs before
 * delivery. High-risk messages are HELD for human review; the system never
 * silently punishes from this — everything is logged and queued.
 */

const PHONE_RE = /(?:\+?91[\s-]?)?[6-9]\d(?:[\s-]?\d){8}/;
const URL_RE = /(https?:\/\/|www\.)[^\s]+/i;
const HANDLE_RE = /(?:@|https?:\/\/)?(?:instagram|whatsapp|wa\.me|telegram|t\.me|signal)\b/i;

const OFF_PLATFORM_PAYMENT =
  /\b(upi|gpay|google\s?pay|paytm|phonepe|phone\s?pe|bhim|net\s?banking|bank transfer|neft|imps)\b/i;
const PAY_OUTSIDE =
  /\b(pay me|pay outside|pay (you )?(direct|outside|privately)|avoid (the )?(fee|platform)|skip the fee|cash (only|payment|please))\b/i;

const THREAT_KEYWORDS =
  /\b(kill|beat you|hurt you|rape|threat|harm you|kidnap|bomb|police complaint|expose you|blackmail)\b/i;

const ESCORT_SOLICITATION =
  /\b(escort|call girl|call boy|paid sex|sexual|massage with happy ending|hotel room meetup|intimate service|hookup|one night stand|ons|sex chat|nudes|sensual massage|room service companion)\b/i;

export interface ModerationVerdict {
  status: ModerationStatus;
  risk: RiskLevel;
  signals: string[];
  /** shown to the sender as a nudge; null = silent */
  senderWarning: string | null;
  /** true => message must not be delivered until human review */
  holdForReview: boolean;
}

const KEEP_ON_PLATFORM_WARNING =
  'Keep payments and contact details on Saath — you stay protected and our safety team can help if something goes wrong.';

const SOLICITATION_WARNING =
  'Saath is strictly for platonic, social companionship in public spaces. Escort or adult services are strictly prohibited and will lead to account termination.';

export function moderateMessage(text: string, context: { hasConfirmedBooking: boolean }): ModerationVerdict {
  const signals: string[] = [];
  let riskPoints = 0;

  if (THREAT_KEYWORDS.test(text)) {
    signals.push('THREAT_KEYWORD');
    riskPoints += 25;
  }
  if (ESCORT_SOLICITATION.test(text)) {
    signals.push('ESCORT_SOLICITATION');
    riskPoints += 50;
  }
  if (OFF_PLATFORM_PAYMENT.test(text) || PAY_OUTSIDE.test(text)) {
    signals.push('OFF_PLATFORM_PAYMENT_ATTEMPT');
    riskPoints += 25;
  }
  if (PHONE_RE.test(text) || HANDLE_RE.test(text)) {
    signals.push('CONTACT_INFO_SHARED');
    // Before a confirmed booking this is a strong scam/bypass signal; after
    // booking it is still flagged for a safety nudge but not held.
    riskPoints += context.hasConfirmedBooking ? 10 : 14;
  }
  if (URL_RE.test(text)) {
    signals.push('URL_SHARED');
    riskPoints += 6;
  }

  if (riskPoints >= 25) {
    const isSolicitation = signals.includes('ESCORT_SOLICITATION');
    return {
      status: ModerationStatus.HELD,
      risk: RiskLevel.HIGH,
      signals,
      senderWarning: isSolicitation
        ? SOLICITATION_WARNING
        : 'This message was held for review because it may violate Saath guidelines.',
      holdForReview: true,
    };
  }
  if (riskPoints >= 8) {
    return {
      status: ModerationStatus.FLAGGED,
      risk: RiskLevel.MEDIUM,
      signals,
      senderWarning: KEEP_ON_PLATFORM_WARNING,
      holdForReview: false,
    };
  }
  if (riskPoints > 0) {
    return {
      status: ModerationStatus.FLAGGED,
      risk: RiskLevel.LOW,
      signals,
      senderWarning: null,
      holdForReview: false,
    };
  }
  return {
    status: ModerationStatus.CLEARED,
    risk: RiskLevel.LOW,
    signals: [],
    senderWarning: null,
    holdForReview: false,
  };
}
