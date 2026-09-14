/**
 * Canonical enumerations shared between API, web and tests.
 * These mirror the Prisma enums 1:1 — never define ad-hoc string unions elsewhere.
 */

export const UserRole = {
  CUSTOMER: 'CUSTOMER',
  COMPANION: 'COMPANION',
  ADMIN: 'ADMIN',
} as const;
export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export const UserStatus = {
  ACTIVE: 'ACTIVE',
  SUSPENDED: 'SUSPENDED',
  BANNED: 'BANNED',
  DELETED: 'DELETED',
} as const;
export type UserStatus = (typeof UserStatus)[keyof typeof UserStatus];

export const VerificationStatus = {
  NOT_STARTED: 'NOT_STARTED',
  SUBMITTED: 'SUBMITTED',
  UNDER_REVIEW: 'UNDER_REVIEW',
  VERIFIED: 'VERIFIED',
  REJECTED: 'REJECTED',
  EXPIRED: 'EXPIRED',
} as const;
export type VerificationStatus = (typeof VerificationStatus)[keyof typeof VerificationStatus];

export const BookingStatus = {
  REQUESTED: 'REQUESTED',
  PENDING_PAYMENT: 'PENDING_PAYMENT',
  CONFIRMED: 'CONFIRMED',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
  DISPUTED: 'DISPUTED',
  REFUNDED: 'REFUNDED',
  PARTIALLY_REFUNDED: 'PARTIALLY_REFUNDED',
} as const;
export type BookingStatus = (typeof BookingStatus)[keyof typeof BookingStatus];

/** "UPCOMING" is a derived view: CONFIRMED and start time in the future. */
export function isUpcoming(status: BookingStatus, startsAt: Date, now: Date = new Date()): boolean {
  return status === BookingStatus.CONFIRMED && startsAt.getTime() > now.getTime();
}

export const MeetingType = {
  IN_PERSON: 'IN_PERSON',
  ONLINE: 'ONLINE',
} as const;
export type MeetingType = (typeof MeetingType)[keyof typeof MeetingType];

export const PaymentStatus = {
  CREATED: 'CREATED',
  PENDING: 'PENDING',
  CAPTURED: 'CAPTURED',
  FAILED: 'FAILED',
  REFUNDED: 'REFUNDED',
  PARTIALLY_REFUNDED: 'PARTIALLY_REFUNDED',
} as const;
export type PaymentStatus = (typeof PaymentStatus)[keyof typeof PaymentStatus];

export const PayoutStatus = {
  REQUESTED: 'REQUESTED',
  UNDER_REVIEW: 'UNDER_REVIEW',
  APPROVED: 'APPROVED',
  PROCESSING: 'PROCESSING',
  COMPLETED: 'COMPLETED',
  REJECTED: 'REJECTED',
  ON_HOLD: 'ON_HOLD',
} as const;
export type PayoutStatus = (typeof PayoutStatus)[keyof typeof PayoutStatus];

export const WalletTxnType = {
  BOOKING_CREDIT: 'BOOKING_CREDIT',
  REFUND_DEBIT: 'REFUND_DEBIT',
  PAYOUT_DEBIT: 'PAYOUT_DEBIT',
  ADJUSTMENT: 'ADJUSTMENT',
  PROMO_CREDIT: 'PROMO_CREDIT',
  RELEASE: 'RELEASE',
} as const;
export type WalletTxnType = (typeof WalletTxnType)[keyof typeof WalletTxnType];

export const WalletTxnState = {
  PENDING: 'PENDING',
  AVAILABLE: 'AVAILABLE',
} as const;
export type WalletTxnState = (typeof WalletTxnState)[keyof typeof WalletTxnState];

export const ReportReason = {
  HARASSMENT: 'HARASSMENT',
  FAKE_PROFILE: 'FAKE_PROFILE',
  SCAM: 'SCAM',
  THREAT: 'THREAT',
  INAPPROPRIATE_CONTENT: 'INAPPROPRIATE_CONTENT',
  PROHIBITED_SERVICE: 'PROHIBITED_SERVICE',
  PAYMENT_FRAUD: 'PAYMENT_FRAUD',
  OTHER: 'OTHER',
} as const;
export type ReportReason = (typeof ReportReason)[keyof typeof ReportReason];

export const ReportStatus = {
  OPEN: 'OPEN',
  TRIAGED: 'TRIAGED',
  INVESTIGATING: 'INVESTIGATING',
  ACTIONED: 'ACTIONED',
  DISMISSED: 'DISMISSED',
} as const;
export type ReportStatus = (typeof ReportStatus)[keyof typeof ReportStatus];

export const ModerationStatus = {
  PENDING: 'PENDING',
  FLAGGED: 'FLAGGED',
  HELD: 'HELD',
  CLEARED: 'CLEARED',
  REMOVED: 'REMOVED',
} as const;
export type ModerationStatus = (typeof ModerationStatus)[keyof typeof ModerationStatus];

export const RiskLevel = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
} as const;
export type RiskLevel = (typeof RiskLevel)[keyof typeof RiskLevel];

export const CheckinStatus = {
  NOT_STARTED: 'NOT_STARTED',
  CHECKED_IN: 'CHECKED_IN',
  CHECKED_OUT: 'CHECKED_OUT',
  MISSED_ESCALATED: 'MISSED_ESCALATED',
} as const;
export type CheckinStatus = (typeof CheckinStatus)[keyof typeof CheckinStatus];

export const DisputeStatus = {
  OPEN: 'OPEN',
  UNDER_REVIEW: 'UNDER_REVIEW',
  RESOLVED: 'RESOLVED',
} as const;
export type DisputeStatus = (typeof DisputeStatus)[keyof typeof DisputeStatus];

export const DisputeResolution = {
  REFUND_FULL: 'REFUND_FULL',
  REFUND_PARTIAL: 'REFUND_PARTIAL',
  RELEASE: 'RELEASE',
  CANCEL: 'CANCEL',
} as const;
export type DisputeResolution = (typeof DisputeResolution)[keyof typeof DisputeResolution];

export const ProfileVisibility = {
  PUBLIC: 'PUBLIC',
  PRIVATE: 'PRIVATE',
} as const;
export type ProfileVisibility = (typeof ProfileVisibility)[keyof typeof ProfileVisibility];

export const RiskEventType = {
  SIGNUP_VELOCITY: 'SIGNUP_VELOCITY',
  PAYMENT_FAILURE: 'PAYMENT_FAILURE',
  CANCELLATION_SPIKE: 'CANCELLATION_SPIKE',
  CHARGEBACK: 'CHARGEBACK',
  MESSAGE_FLAG: 'MESSAGE_FLAG',
  REPORT: 'REPORT',
  DEVICE_SHARED: 'DEVICE_SHARED',
  OFF_PLATFORM_PAYMENT_ATTEMPT: 'OFF_PLATFORM_PAYMENT_ATTEMPT',
  THREAT_KEYWORD: 'THREAT_KEYWORD',
} as const;
export type RiskEventType = (typeof RiskEventType)[keyof typeof RiskEventType];

export const PricingModel = {
  HOURLY: 'HOURLY',
  SESSION: 'SESSION',
} as const;
export type PricingModel = (typeof PricingModel)[keyof typeof PricingModel];

export const AvailabilityKind = {
  WEEKLY_RECURRING: 'WEEKLY_RECURRING',
  AVAILABLE: 'AVAILABLE',
  BLOCKED: 'BLOCKED',
  BREAK: 'BREAK',
} as const;
export type AvailabilityKind = (typeof AvailabilityKind)[keyof typeof AvailabilityKind];

export const NotificationType = {
  BOOKING_REQUESTED: 'BOOKING_REQUESTED',
  BOOKING_ACCEPTED: 'BOOKING_ACCEPTED',
  BOOKING_REJECTED: 'BOOKING_REJECTED',
  PAYMENT_SUCCESS: 'PAYMENT_SUCCESS',
  PAYMENT_FAILED: 'PAYMENT_FAILED',
  BOOKING_REMINDER: 'BOOKING_REMINDER',
  NEW_MESSAGE: 'NEW_MESSAGE',
  REVIEW_RECEIVED: 'REVIEW_RECEIVED',
  VERIFICATION_UPDATE: 'VERIFICATION_UPDATE',
  REFUND_PROCESSED: 'REFUND_PROCESSED',
  SAFETY_ALERT: 'SAFETY_ALERT',
  PAYOUT_UPDATE: 'PAYOUT_UPDATE',
} as const;
export type NotificationType = (typeof NotificationType)[keyof typeof NotificationType];
