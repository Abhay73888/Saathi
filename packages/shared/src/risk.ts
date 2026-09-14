import { RiskLevel } from './enums.js';

/**
 * Rule-based risk scoring (V1). Output is ADVISORY only: high-risk users go
 * to a human moderation queue or get reversible restrictions (payout hold,
 * re-verification). Never auto-ban from a score.
 */

export const RISK_WEIGHTS = {
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

export type RiskSignalType = keyof typeof RISK_WEIGHTS;

export const RISK_THRESHOLDS = {
  MEDIUM: 20,
  HIGH: 45,
} as const;

export function levelForScore(score: number): RiskLevel {
  if (score >= RISK_THRESHOLDS.HIGH) return RiskLevel.HIGH;
  if (score >= RISK_THRESHOLDS.MEDIUM) return RiskLevel.MEDIUM;
  return RiskLevel.LOW;
}

export function scoreSignals(signals: RiskSignalType[]): {
  score: number;
  level: RiskLevel;
} {
  const score = signals.reduce((sum, s) => sum + (RISK_WEIGHTS[s] ?? 0), 0);
  return { score, level: levelForScore(score) };
}
