import { z } from 'zod';
/**
 * Validation schemas shared by API (server) and web (client) so rules never
 * drift. API re-validates everything — client validation is UX only.
 */
export declare const emailSchema: z.ZodString;
export declare const phoneSchema: z.ZodString;
export declare const passwordSchema: z.ZodString;
export declare const dobSchema: z.ZodEffects<z.ZodString, string, string>;
export declare const registerSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
    displayName: z.ZodString;
    phone: z.ZodString;
    dateOfBirth: z.ZodEffects<z.ZodString, string, string>;
    ageAcknowledged: z.ZodLiteral<true>;
}, "strip", z.ZodTypeAny, {
    email: string;
    password: string;
    displayName: string;
    phone: string;
    dateOfBirth: string;
    ageAcknowledged: true;
}, {
    email: string;
    password: string;
    displayName: string;
    phone: string;
    dateOfBirth: string;
    ageAcknowledged: true;
}>;
export type RegisterInput = z.infer<typeof registerSchema>;
export declare const loginSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
    password: string;
}, {
    email: string;
    password: string;
}>;
export declare const otpRequestSchema: z.ZodObject<{
    phone: z.ZodString;
}, "strip", z.ZodTypeAny, {
    phone: string;
}, {
    phone: string;
}>;
export declare const otpVerifySchema: z.ZodObject<{
    phone: z.ZodString;
    code: z.ZodString;
}, "strip", z.ZodTypeAny, {
    code: string;
    phone: string;
}, {
    code: string;
    phone: string;
}>;
export declare const companionApplySchema: z.ZodObject<{
    displayName: z.ZodString;
    tagline: z.ZodString;
    bio: z.ZodString;
    city: z.ZodString;
    area: z.ZodString;
    languages: z.ZodArray<z.ZodString, "many">;
    interests: z.ZodArray<z.ZodString, "many">;
    meetingTypes: z.ZodArray<z.ZodNativeEnum<{
        readonly IN_PERSON: "IN_PERSON";
        readonly ONLINE: "ONLINE";
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    interests: string[];
    languages: string[];
    displayName: string;
    tagline: string;
    bio: string;
    city: string;
    area: string;
    meetingTypes: ("IN_PERSON" | "ONLINE")[];
}, {
    interests: string[];
    languages: string[];
    displayName: string;
    tagline: string;
    bio: string;
    city: string;
    area: string;
    meetingTypes: ("IN_PERSON" | "ONLINE")[];
}>;
export declare const serviceSchema: z.ZodObject<{
    experienceId: z.ZodString;
    pricingModel: z.ZodEnum<["HOURLY", "SESSION"]>;
    ratePaise: z.ZodNumber;
    minDurationMinutes: z.ZodNumber;
    isActive: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    experienceId: string;
    pricingModel: "HOURLY" | "SESSION";
    ratePaise: number;
    minDurationMinutes: number;
    isActive: boolean;
}, {
    experienceId: string;
    pricingModel: "HOURLY" | "SESSION";
    ratePaise: number;
    minDurationMinutes: number;
    isActive?: boolean | undefined;
}>;
export declare const availabilitySlotSchema: z.ZodObject<{
    dayOfWeek: z.ZodNumber;
    startTime: z.ZodString;
    endTime: z.ZodString;
}, "strip", z.ZodTypeAny, {
    dayOfWeek: number;
    startTime: string;
    endTime: string;
}, {
    dayOfWeek: number;
    startTime: string;
    endTime: string;
}>;
export declare const availabilityOverrideSchema: z.ZodObject<{
    date: z.ZodString;
    kind: z.ZodEnum<["AVAILABLE", "BLOCKED", "BREAK"]>;
    startTime: z.ZodOptional<z.ZodString>;
    endTime: z.ZodOptional<z.ZodString>;
    reason: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    date: string;
    kind: "AVAILABLE" | "BLOCKED" | "BREAK";
    startTime?: string | undefined;
    endTime?: string | undefined;
    reason?: string | undefined;
}, {
    date: string;
    kind: "AVAILABLE" | "BLOCKED" | "BREAK";
    startTime?: string | undefined;
    endTime?: string | undefined;
    reason?: string | undefined;
}>;
export declare const bookingCreateSchema: z.ZodEffects<z.ZodObject<{
    companionId: z.ZodString;
    experienceId: z.ZodString;
    startAt: z.ZodString;
    durationMinutes: z.ZodNumber;
    meetingType: z.ZodNativeEnum<{
        readonly IN_PERSON: "IN_PERSON";
        readonly ONLINE: "ONLINE";
    }>;
    meetingArea: z.ZodOptional<z.ZodString>;
    note: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    durationMinutes: number;
    experienceId: string;
    companionId: string;
    startAt: string;
    meetingType: "IN_PERSON" | "ONLINE";
    meetingArea?: string | undefined;
    note?: string | undefined;
}, {
    durationMinutes: number;
    experienceId: string;
    companionId: string;
    startAt: string;
    meetingType: "IN_PERSON" | "ONLINE";
    meetingArea?: string | undefined;
    note?: string | undefined;
}>, {
    durationMinutes: number;
    experienceId: string;
    companionId: string;
    startAt: string;
    meetingType: "IN_PERSON" | "ONLINE";
    meetingArea?: string | undefined;
    note?: string | undefined;
}, {
    durationMinutes: number;
    experienceId: string;
    companionId: string;
    startAt: string;
    meetingType: "IN_PERSON" | "ONLINE";
    meetingArea?: string | undefined;
    note?: string | undefined;
}>;
export declare const reviewSchema: z.ZodObject<{
    bookingId: z.ZodString;
    communication: z.ZodNumber;
    punctuality: z.ZodNumber;
    respect: z.ZodNumber;
    experience: z.ZodNumber;
    overall: z.ZodNumber;
    comment: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    bookingId: string;
    communication: number;
    punctuality: number;
    respect: number;
    experience: number;
    overall: number;
    comment?: string | undefined;
}, {
    bookingId: string;
    communication: number;
    punctuality: number;
    respect: number;
    experience: number;
    overall: number;
    comment?: string | undefined;
}>;
export declare const reportSchema: z.ZodObject<{
    reportedUserId: z.ZodOptional<z.ZodString>;
    refType: z.ZodEnum<["USER", "MESSAGE", "REVIEW", "BOOKING"]>;
    refId: z.ZodString;
    reason: z.ZodEnum<["HARASSMENT", "FAKE_PROFILE", "SCAM", "THREAT", "INAPPROPRIATE_CONTENT", "PROHIBITED_SERVICE", "PAYMENT_FRAUD", "OTHER"]>;
    details: z.ZodString;
}, "strip", z.ZodTypeAny, {
    reason: "HARASSMENT" | "FAKE_PROFILE" | "SCAM" | "THREAT" | "INAPPROPRIATE_CONTENT" | "PROHIBITED_SERVICE" | "PAYMENT_FRAUD" | "OTHER";
    refType: "USER" | "MESSAGE" | "REVIEW" | "BOOKING";
    refId: string;
    details: string;
    reportedUserId?: string | undefined;
}, {
    reason: "HARASSMENT" | "FAKE_PROFILE" | "SCAM" | "THREAT" | "INAPPROPRIATE_CONTENT" | "PROHIBITED_SERVICE" | "PAYMENT_FRAUD" | "OTHER";
    refType: "USER" | "MESSAGE" | "REVIEW" | "BOOKING";
    refId: string;
    details: string;
    reportedUserId?: string | undefined;
}>;
export declare const payoutRequestSchema: z.ZodObject<{
    amountPaise: z.ZodNumber;
    fundAccountId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    amountPaise: number;
    fundAccountId: string;
}, {
    amountPaise: number;
    fundAccountId: string;
}>;
export declare const messageSchema: z.ZodObject<{
    conversationId: z.ZodString;
    body: z.ZodString;
}, "strip", z.ZodTypeAny, {
    conversationId: string;
    body: string;
}, {
    conversationId: string;
    body: string;
}>;
/** Curated Social Experience definitions with activity-first positioning */
export declare const ACTIVITY_EXPERIENCES: readonly [{
    readonly id: "concerts-music";
    readonly slug: "concerts";
    readonly label: "Concerts & Music Fests";
    readonly icon: "🎸";
    readonly tagline: "Never attend a gig alone — enjoy the beat together";
    readonly popularVibe: "High Energy";
}, {
    readonly id: "cafe-hopping";
    readonly slug: "coffee";
    readonly label: "Cafe Hopping & Brews";
    readonly icon: "☕";
    readonly tagline: "Discover artisan cafes & chill conversations";
    readonly popularVibe: "Chill & Relaxed";
}, {
    readonly id: "cinema-movies";
    readonly slug: "movies";
    readonly label: "Blockbusters & Cinema";
    readonly icon: "🎬";
    readonly tagline: "Share the popcorn & discuss fan theories post-show";
    readonly popularVibe: "Pop-Culture Fan";
}, {
    readonly id: "food-dining";
    readonly slug: "dinner";
    readonly label: "Food Crawls & Dining";
    readonly icon: "🍽️";
    readonly tagline: "Street food runs to fine dining tasting menus";
    readonly popularVibe: "Foodie Insider";
}, {
    readonly id: "city-walks";
    readonly slug: "walking";
    readonly label: "City Walks & Heritage";
    readonly icon: "🏛️";
    readonly tagline: "Explore scenic parks, monuments & photo spots";
    readonly popularVibe: "Curious Explorer";
}, {
    readonly id: "fitness-sports";
    readonly slug: "fitness";
    readonly label: "Fitness & Running Buddy";
    readonly icon: "🏃";
    readonly tagline: "Weekend jogging, badminton, or gym accountability";
    readonly popularVibe: "Motivated & Active";
}, {
    readonly id: "boardgames-trivia";
    readonly slug: "gaming";
    readonly label: "Board Games & Trivia";
    readonly icon: "🎲";
    readonly tagline: "Catan, Chess, Arcade, or Pub Trivia showdowns";
    readonly popularVibe: "Strategic & Fun";
}, {
    readonly id: "coworking-study";
    readonly slug: "study";
    readonly label: "Co-Working & Deep Work";
    readonly icon: "💼";
    readonly tagline: "Focused Pomodoro sprints in quiet ambient spaces";
    readonly popularVibe: "Quiet & Focused";
}];
export type ActivityExperience = (typeof ACTIVITY_EXPERIENCES)[number];
export declare const VIBE_TAGS: readonly ["Introvert Friendly", "Great Listener", "Pop-Culture Fan", "High Energy", "Chill & Relaxed", "Deep Conversations", "Foodie Insider", "Zero Awkwardness", "Motivated & Active", "City Explorer"];
export type VibeTag = (typeof VIBE_TAGS)[number];
/**
 * Deterministically computes a 4-digit Meetup Handshake PIN for in-person check-in.
 */
export declare function computeMeetupPin(bookingId: string): string;
