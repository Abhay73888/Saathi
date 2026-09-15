import { ModerationStatus, RiskLevel } from './enums.js';
export interface ModerationVerdict {
    status: ModerationStatus;
    risk: RiskLevel;
    signals: string[];
    /** shown to the sender as a nudge; null = silent */
    senderWarning: string | null;
    /** true => message must not be delivered until human review */
    holdForReview: boolean;
}
export declare function moderateMessage(text: string, context: {
    hasConfirmedBooking: boolean;
}): ModerationVerdict;
