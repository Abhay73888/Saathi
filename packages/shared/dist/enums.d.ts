/**
 * Canonical enumerations shared between API, web and tests.
 * These mirror the Prisma enums 1:1 — never define ad-hoc string unions elsewhere.
 */
export declare const UserRole: {
    readonly CUSTOMER: "CUSTOMER";
    readonly COMPANION: "COMPANION";
    readonly ADMIN: "ADMIN";
};
export type UserRole = (typeof UserRole)[keyof typeof UserRole];
export declare const UserStatus: {
    readonly ACTIVE: "ACTIVE";
    readonly SUSPENDED: "SUSPENDED";
    readonly BANNED: "BANNED";
    readonly DELETED: "DELETED";
};
export type UserStatus = (typeof UserStatus)[keyof typeof UserStatus];
export declare const VerificationStatus: {
    readonly NOT_STARTED: "NOT_STARTED";
    readonly SUBMITTED: "SUBMITTED";
    readonly UNDER_REVIEW: "UNDER_REVIEW";
    readonly VERIFIED: "VERIFIED";
    readonly REJECTED: "REJECTED";
    readonly EXPIRED: "EXPIRED";
};
export type VerificationStatus = (typeof VerificationStatus)[keyof typeof VerificationStatus];
export declare const BookingStatus: {
    readonly REQUESTED: "REQUESTED";
    readonly PENDING_PAYMENT: "PENDING_PAYMENT";
    readonly CONFIRMED: "CONFIRMED";
    readonly IN_PROGRESS: "IN_PROGRESS";
    readonly COMPLETED: "COMPLETED";
    readonly CANCELLED: "CANCELLED";
    readonly DISPUTED: "DISPUTED";
    readonly REFUNDED: "REFUNDED";
    readonly PARTIALLY_REFUNDED: "PARTIALLY_REFUNDED";
};
export type BookingStatus = (typeof BookingStatus)[keyof typeof BookingStatus];
/** "UPCOMING" is a derived view: CONFIRMED and start time in the future. */
export declare function isUpcoming(status: BookingStatus, startsAt: Date, now?: Date): boolean;
export declare const MeetingType: {
    readonly IN_PERSON: "IN_PERSON";
    readonly ONLINE: "ONLINE";
};
export type MeetingType = (typeof MeetingType)[keyof typeof MeetingType];
export declare const PaymentStatus: {
    readonly CREATED: "CREATED";
    readonly PENDING: "PENDING";
    readonly CAPTURED: "CAPTURED";
    readonly FAILED: "FAILED";
    readonly REFUNDED: "REFUNDED";
    readonly PARTIALLY_REFUNDED: "PARTIALLY_REFUNDED";
};
export type PaymentStatus = (typeof PaymentStatus)[keyof typeof PaymentStatus];
export declare const PayoutStatus: {
    readonly REQUESTED: "REQUESTED";
    readonly UNDER_REVIEW: "UNDER_REVIEW";
    readonly APPROVED: "APPROVED";
    readonly PROCESSING: "PROCESSING";
    readonly COMPLETED: "COMPLETED";
    readonly REJECTED: "REJECTED";
    readonly ON_HOLD: "ON_HOLD";
};
export type PayoutStatus = (typeof PayoutStatus)[keyof typeof PayoutStatus];
export declare const WalletTxnType: {
    readonly BOOKING_CREDIT: "BOOKING_CREDIT";
    readonly REFUND_DEBIT: "REFUND_DEBIT";
    readonly PAYOUT_DEBIT: "PAYOUT_DEBIT";
    readonly ADJUSTMENT: "ADJUSTMENT";
    readonly PROMO_CREDIT: "PROMO_CREDIT";
    readonly RELEASE: "RELEASE";
};
export type WalletTxnType = (typeof WalletTxnType)[keyof typeof WalletTxnType];
export declare const WalletTxnState: {
    readonly PENDING: "PENDING";
    readonly AVAILABLE: "AVAILABLE";
};
export type WalletTxnState = (typeof WalletTxnState)[keyof typeof WalletTxnState];
export declare const ReportReason: {
    readonly HARASSMENT: "HARASSMENT";
    readonly FAKE_PROFILE: "FAKE_PROFILE";
    readonly SCAM: "SCAM";
    readonly THREAT: "THREAT";
    readonly INAPPROPRIATE_CONTENT: "INAPPROPRIATE_CONTENT";
    readonly PROHIBITED_SERVICE: "PROHIBITED_SERVICE";
    readonly PAYMENT_FRAUD: "PAYMENT_FRAUD";
    readonly OTHER: "OTHER";
};
export type ReportReason = (typeof ReportReason)[keyof typeof ReportReason];
export declare const ReportStatus: {
    readonly OPEN: "OPEN";
    readonly TRIAGED: "TRIAGED";
    readonly INVESTIGATING: "INVESTIGATING";
    readonly ACTIONED: "ACTIONED";
    readonly DISMISSED: "DISMISSED";
};
export type ReportStatus = (typeof ReportStatus)[keyof typeof ReportStatus];
export declare const ModerationStatus: {
    readonly PENDING: "PENDING";
    readonly FLAGGED: "FLAGGED";
    readonly HELD: "HELD";
    readonly CLEARED: "CLEARED";
    readonly REMOVED: "REMOVED";
};
export type ModerationStatus = (typeof ModerationStatus)[keyof typeof ModerationStatus];
export declare const RiskLevel: {
    readonly LOW: "LOW";
    readonly MEDIUM: "MEDIUM";
    readonly HIGH: "HIGH";
};
export type RiskLevel = (typeof RiskLevel)[keyof typeof RiskLevel];
export declare const CheckinStatus: {
    readonly NOT_STARTED: "NOT_STARTED";
    readonly CHECKED_IN: "CHECKED_IN";
    readonly CHECKED_OUT: "CHECKED_OUT";
    readonly MISSED_ESCALATED: "MISSED_ESCALATED";
};
export type CheckinStatus = (typeof CheckinStatus)[keyof typeof CheckinStatus];
export declare const DisputeStatus: {
    readonly OPEN: "OPEN";
    readonly UNDER_REVIEW: "UNDER_REVIEW";
    readonly RESOLVED: "RESOLVED";
};
export type DisputeStatus = (typeof DisputeStatus)[keyof typeof DisputeStatus];
export declare const DisputeResolution: {
    readonly REFUND_FULL: "REFUND_FULL";
    readonly REFUND_PARTIAL: "REFUND_PARTIAL";
    readonly RELEASE: "RELEASE";
    readonly CANCEL: "CANCEL";
};
export type DisputeResolution = (typeof DisputeResolution)[keyof typeof DisputeResolution];
export declare const ProfileVisibility: {
    readonly PUBLIC: "PUBLIC";
    readonly PRIVATE: "PRIVATE";
};
export type ProfileVisibility = (typeof ProfileVisibility)[keyof typeof ProfileVisibility];
export declare const RiskEventType: {
    readonly SIGNUP_VELOCITY: "SIGNUP_VELOCITY";
    readonly PAYMENT_FAILURE: "PAYMENT_FAILURE";
    readonly CANCELLATION_SPIKE: "CANCELLATION_SPIKE";
    readonly CHARGEBACK: "CHARGEBACK";
    readonly MESSAGE_FLAG: "MESSAGE_FLAG";
    readonly REPORT: "REPORT";
    readonly DEVICE_SHARED: "DEVICE_SHARED";
    readonly OFF_PLATFORM_PAYMENT_ATTEMPT: "OFF_PLATFORM_PAYMENT_ATTEMPT";
    readonly THREAT_KEYWORD: "THREAT_KEYWORD";
};
export type RiskEventType = (typeof RiskEventType)[keyof typeof RiskEventType];
export declare const PricingModel: {
    readonly HOURLY: "HOURLY";
    readonly SESSION: "SESSION";
};
export type PricingModel = (typeof PricingModel)[keyof typeof PricingModel];
export declare const AvailabilityKind: {
    readonly WEEKLY_RECURRING: "WEEKLY_RECURRING";
    readonly AVAILABLE: "AVAILABLE";
    readonly BLOCKED: "BLOCKED";
    readonly BREAK: "BREAK";
};
export type AvailabilityKind = (typeof AvailabilityKind)[keyof typeof AvailabilityKind];
export declare const NotificationType: {
    readonly BOOKING_REQUESTED: "BOOKING_REQUESTED";
    readonly BOOKING_ACCEPTED: "BOOKING_ACCEPTED";
    readonly BOOKING_REJECTED: "BOOKING_REJECTED";
    readonly PAYMENT_SUCCESS: "PAYMENT_SUCCESS";
    readonly PAYMENT_FAILED: "PAYMENT_FAILED";
    readonly BOOKING_REMINDER: "BOOKING_REMINDER";
    readonly NEW_MESSAGE: "NEW_MESSAGE";
    readonly REVIEW_RECEIVED: "REVIEW_RECEIVED";
    readonly VERIFICATION_UPDATE: "VERIFICATION_UPDATE";
    readonly REFUND_PROCESSED: "REFUND_PROCESSED";
    readonly SAFETY_ALERT: "SAFETY_ALERT";
    readonly PAYOUT_UPDATE: "PAYOUT_UPDATE";
};
export type NotificationType = (typeof NotificationType)[keyof typeof NotificationType];
