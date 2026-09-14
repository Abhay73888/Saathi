import { z } from 'zod';
import { MeetingType } from './enums.js';

/**
 * Validation schemas shared by API (server) and web (client) so rules never
 * drift. API re-validates everything — client validation is UX only.
 */

export const emailSchema = z.string().trim().toLowerCase().email().max(200);
export const phoneSchema = z
  .string()
  .trim()
  .regex(/^\+91[6-9]\d{9}$/, 'Phone must be E.164 Indian number, e.g. +9198XXXXXXXX');
export const passwordSchema = z
  .string()
  .min(10, 'Password must be at least 10 characters')
  .max(200)
  .regex(/[a-z]/, 'Must contain a lowercase letter')
  .regex(/[A-Z]/, 'Must contain an uppercase letter')
  .regex(/\d/, 'Must contain a number');
export const dobSchema = z
  .string()
  .date()
  .refine((d) => {
    const dob = new Date(d);
    const age = (Date.now() - dob.getTime()) / (365.25 * 24 * 3600 * 1000);
    return age >= 18;
  }, 'You must be at least 18 years old');

export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  displayName: z.string().trim().min(2).max(60),
  phone: phoneSchema,
  dateOfBirth: dobSchema,
  ageAcknowledged: z.literal(true, {
    errorMap: () => ({ message: 'You must confirm you are 18 or older' }),
  }),
});
export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1),
});

export const otpRequestSchema = z.object({ phone: phoneSchema });
export const otpVerifySchema = z.object({
  phone: phoneSchema,
  code: z.string().regex(/^\d{6}$/),
});

export const companionApplySchema = z.object({
  displayName: z.string().trim().min(2).max(60),
  tagline: z.string().trim().min(4).max(120),
  bio: z.string().trim().min(30).max(2000),
  city: z.string().trim().min(2).max(80),
  area: z.string().trim().min(2).max(120),
  languages: z.array(z.string().trim().min(2).max(40)).min(1, 'Add at least one language'),
  interests: z.array(z.string().trim().min(2).max(40)).min(1, 'Add at least one interest'),
  meetingTypes: z.array(z.nativeEnum(MeetingType)).min(1),
});

export const serviceSchema = z.object({
  experienceId: z.string().uuid(),
  pricingModel: z.enum(['HOURLY', 'SESSION']),
  ratePaise: z.number().int().min(9900).max(5_000_000), // ₹99 – ₹50,000
  minDurationMinutes: z.number().int().min(30).max(480),
  isActive: z.boolean().default(true),
});

export const availabilitySlotSchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6), // 0 = Monday … 6 = Sunday
  startTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  endTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
});

export const availabilityOverrideSchema = z.object({
  date: z.string().date(),
  kind: z.enum(['AVAILABLE', 'BLOCKED', 'BREAK']),
  startTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).optional(),
  endTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).optional(),
  reason: z.string().max(200).optional(),
});

export const bookingCreateSchema = z
  .object({
    companionId: z.string().uuid(),
    experienceId: z.string().uuid(),
    startAt: z.string().datetime(),
    durationMinutes: z.number().int().min(30).max(600),
    meetingType: z.nativeEnum(MeetingType),
    meetingArea: z.string().trim().max(200).optional(),
    note: z.string().trim().max(500).optional(),
  })
  .refine((b) => new Date(b.startAt).getTime() > Date.now() + 30 * 60_000, {
    message: 'Bookings must be at least 30 minutes in the future',
    path: ['startAt'],
  });

export const reviewSchema = z.object({
  bookingId: z.string().uuid(),
  communication: z.number().int().min(1).max(5),
  punctuality: z.number().int().min(1).max(5),
  respect: z.number().int().min(1).max(5),
  experience: z.number().int().min(1).max(5),
  overall: z.number().int().min(1).max(5),
  comment: z.string().trim().max(2000).optional(),
});

export const reportSchema = z.object({
  reportedUserId: z.string().uuid().optional(),
  refType: z.enum(['USER', 'MESSAGE', 'REVIEW', 'BOOKING']),
  refId: z.string().uuid(),
  reason: z.enum([
    'HARASSMENT',
    'FAKE_PROFILE',
    'SCAM',
    'THREAT',
    'INAPPROPRIATE_CONTENT',
    'PROHIBITED_SERVICE',
    'PAYMENT_FRAUD',
    'OTHER',
  ]),
  details: z.string().trim().min(10).max(2000),
});

export const payoutRequestSchema = z.object({
  amountPaise: z.number().int().min(10000), // ₹100 minimum withdrawal
  fundAccountId: z.string().min(3).max(100),
});

export const messageSchema = z.object({
  conversationId: z.string().uuid(),
  body: z.string().trim().min(1).max(2000),
});

/** Curated Social Experience definitions with activity-first positioning */
export const ACTIVITY_EXPERIENCES = [
  {
    id: 'concerts-music',
    slug: 'concerts',
    label: 'Concerts & Music Fests',
    icon: '🎸',
    tagline: 'Never attend a gig alone — enjoy the beat together',
    popularVibe: 'High Energy',
  },
  {
    id: 'cafe-hopping',
    slug: 'coffee',
    label: 'Cafe Hopping & Brews',
    icon: '☕',
    tagline: 'Discover artisan cafes & chill conversations',
    popularVibe: 'Chill & Relaxed',
  },
  {
    id: 'cinema-movies',
    slug: 'movies',
    label: 'Blockbusters & Cinema',
    icon: '🎬',
    tagline: 'Share the popcorn & discuss fan theories post-show',
    popularVibe: 'Pop-Culture Fan',
  },
  {
    id: 'food-dining',
    slug: 'dinner',
    label: 'Food Crawls & Dining',
    icon: '🍽️',
    tagline: 'Street food runs to fine dining tasting menus',
    popularVibe: 'Foodie Insider',
  },
  {
    id: 'city-walks',
    slug: 'walking',
    label: 'City Walks & Heritage',
    icon: '🏛️',
    tagline: 'Explore scenic parks, monuments & photo spots',
    popularVibe: 'Curious Explorer',
  },
  {
    id: 'fitness-sports',
    slug: 'fitness',
    label: 'Fitness & Running Buddy',
    icon: '🏃',
    tagline: 'Weekend jogging, badminton, or gym accountability',
    popularVibe: 'Motivated & Active',
  },
  {
    id: 'boardgames-trivia',
    slug: 'gaming',
    label: 'Board Games & Trivia',
    icon: '🎲',
    tagline: 'Catan, Chess, Arcade, or Pub Trivia showdowns',
    popularVibe: 'Strategic & Fun',
  },
  {
    id: 'coworking-study',
    slug: 'study',
    label: 'Co-Working & Deep Work',
    icon: '💼',
    tagline: 'Focused Pomodoro sprints in quiet ambient spaces',
    popularVibe: 'Quiet & Focused',
  },
] as const;

export type ActivityExperience = (typeof ACTIVITY_EXPERIENCES)[number];

export const VIBE_TAGS = [
  'Introvert Friendly',
  'Great Listener',
  'Pop-Culture Fan',
  'High Energy',
  'Chill & Relaxed',
  'Deep Conversations',
  'Foodie Insider',
  'Zero Awkwardness',
  'Motivated & Active',
  'City Explorer',
] as const;

export type VibeTag = (typeof VIBE_TAGS)[number];

/**
 * Deterministically computes a 4-digit Meetup Handshake PIN for in-person check-in.
 */
export function computeMeetupPin(bookingId: string): string {
  let hash = 0;
  for (let i = 0; i < bookingId.length; i++) {
    hash = (hash << 5) - hash + bookingId.charCodeAt(i);
    hash |= 0;
  }
  const pin = (Math.abs(hash) % 9000) + 1000;
  return String(pin);
}

