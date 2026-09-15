import { RiskLevel } from './enums.js';
/**
 * Rule-based risk scoring (V1). Output is ADVISORY only: high-risk users go
 * to a human moderation queue or get reversible restrictions (payout hold,
 * re-verification). Never auto-ban from a score.
 */
export declare const RISK_WEIGHTS: {
    readonly PAYMENT_FAILURE: 10;
    readonly CHARGEBACK: 30;
    readonly CANCELLATION_SPIKE: 15;
    readonly MESSAGE_FLAG: 8;
    readonly REPORT: 20;
    readonly OFF_PLATFORM_PAYMENT_ATTEMPT: 25;
    readonly SIGNUP_VELOCITY: 15;
    readonly DEVICE_SHARED: 10;
    readonly THREAT_KEYWORD: 25;
};
export type RiskSignalType = keyof typeof RISK_WEIGHTS;
export declare const RISK_THRESHOLDS: {
    readonly MEDIUM: 20;
    readonly HIGH: 45;
};
export declare function levelForScore(score: number): RiskLevel;
export declare function scoreSignals(signals: RiskSignalType[]): {
    score: number;
    level: RiskLevel;
};
