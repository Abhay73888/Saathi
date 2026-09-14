import { PrismaClient } from '@prisma/client';
import argon2 from 'argon2';
import {
  UserRole,
  UserStatus,
  VerificationStatus,
  ModerationStatus,
  BookingStatus,
  PaymentStatus,
  MeetingType,
  PricingModel,
  NotificationType,
} from '@saath/shared';

const prisma = new PrismaClient();

const categories = [
  { slug: 'coffee', name: 'Coffee companion', icon: '☕', sortOrder: 1 },
  { slug: 'dinner', name: 'Dinner companion', icon: '🍽️', sortOrder: 2 },
  { slug: 'movie', name: 'Movie companion', icon: '🎬', sortOrder: 3 },
  { slug: 'event', name: 'Event / party plus-one', icon: '🎉', sortOrder: 4 },
  { slug: 'city_tour', name: 'City exploration', icon: '🗺️', sortOrder: 5 },
  { slug: 'walking', name: 'Walking companion', icon: '🚶', sortOrder: 6 },
  { slug: 'gaming', name: 'Gaming companion', icon: '🎮', sortOrder: 7 },
  { slug: 'study', name: 'Study companion', icon: '📚', sortOrder: 8 },
  { slug: 'conversation', name: 'Conversation', icon: '💬', sortOrder: 9 },
  { slug: 'online', name: 'Online companionship', icon: '💻', sortOrder: 10 },
];

async function main(): Promise<void> {
  console.log('Seeding Saath database…');

  for (const c of categories) {
    await prisma.experienceCategory.upsert({
      where: { slug: c.slug },
      create: c,
      update: { name: c.name, icon: c.icon, sortOrder: c.sortOrder },
    });
  }

  const passwordHash = await argon2.hash('Password123!', { type: argon2.argon2id });

  // ---- Admin ----
  await prisma.user.upsert({
    where: { email: 'admin@saath.app' },
    update: { role: UserRole.ADMIN },
    create: {
      email: 'admin@saath.app',
      phone: '+919000000001',
      passwordHash,
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
      emailVerifiedAt: new Date(),
      phoneVerifiedAt: new Date(),
      dateOfBirth: new Date('1990-01-01'),
      customerProfile: { create: { displayName: 'Saath Admin', city: 'Noida' } },
    },
  });

  // ---- Demo customer ----
  const customer = await prisma.user.upsert({
    where: { email: 'customer@saath.app' },
    update: {},
    create: {
      email: 'customer@saath.app',
      phone: '+919000000002',
      passwordHash,
      role: UserRole.CUSTOMER,
      status: UserStatus.ACTIVE,
      emailVerifiedAt: new Date(),
      phoneVerifiedAt: new Date(),
      dateOfBirth: new Date('1996-06-15'),
      customerProfile: {
        create: { displayName: 'Ananya', city: 'Noida', interests: ['coffee', 'movies', 'gaming'] },
      },
    },
  });

  // ---- Demo companion ----
  const companion = await prisma.user.upsert({
    where: { email: 'companion@saath.app' },
    update: {},
    create: {
      email: 'companion@saath.app',
      phone: '+919000000003',
      passwordHash,
      role: UserRole.COMPANION,
      status: UserStatus.ACTIVE,
      emailVerifiedAt: new Date(),
      phoneVerifiedAt: new Date(),
      dateOfBirth: new Date('1994-03-22'),
      customerProfile: { create: { displayName: 'Aarav', city: 'Noida' } },
      verificationRequests: {
        create: {
          provider: 'mock',
          providerRef: 'seed-verification',
          status: VerificationStatus.VERIFIED,
          assertedAgeGte18: true,
          faceMatch: true,
        },
      },
      companionProfile: {
        create: {
          displayName: 'Aarav Sharma',
          tagline: 'Coffee, long walks and indie films',
          bio: 'Easygoing conversationalist who knows the best cafés in Noida. Happy to join for coffee, movies, gaming nights or a relaxed city walk — public places only, let’s keep it safe and fun. Fluent in Hindi and English.',
          city: 'Noida',
          area: 'Sector 62–104',
          languages: ['Hindi', 'English'],
          interests: ['coffee', 'movies', 'gaming', 'indie music', 'walking'],
          personalityTags: ['warm', 'good listener', 'punctual'],
          meetingTypes: [MeetingType.IN_PERSON, MeetingType.ONLINE],
          verificationStatus: VerificationStatus.VERIFIED,
          profileModeration: ModerationStatus.CLEARED,
          isLive: true,
          ratingAvg: 4.9,
          ratingCount: 1,
          ratingCommunication: 5,
          ratingPunctuality: 5,
          ratingRespect: 5,
          ratingExperience: 4.5,
          completedCount: 1,
          responseRate: 0.98,
        },
      },
    },
    include: { companionProfile: true },
  });

  const profile = companion.companionProfile;
  if (profile) {
    const bySlug = async (slug: string) =>
      prisma.experienceCategory.findUniqueOrThrow({ where: { slug } });
    const coffee = await bySlug('coffee');
    const movie = await bySlug('movie');
    const gaming = await bySlug('gaming');

    for (const [exp, rate] of [
      [coffee, 49900n],
      [movie, 59900n],
      [gaming, 39900n],
    ] as const) {
      await prisma.companionService.upsert({
        where: {
          companionProfileId_experienceId: { companionProfileId: profile.id, experienceId: exp.id },
        },
        create: {
          companionProfileId: profile.id,
          experienceId: exp.id,
          pricingModel: PricingModel.HOURLY,
          ratePaise: rate,
          minDurationMinutes: 60,
        },
        update: { ratePaise: rate },
      });
    }

    // Weekly availability: Mon–Sat, 10:00–19:00 IST.
    await prisma.availabilitySlot.deleteMany({ where: { companionProfileId: profile.id } });
    await prisma.availabilitySlot.createMany({
      data: [0, 1, 2, 3, 4, 5].map((d) => ({
        companionProfileId: profile.id,
        dayOfWeek: d,
        startTime: '10:00',
        endTime: '19:00',
      })),
    });

    // Wallet for the companion.
    const wallet = await prisma.wallet.upsert({
      where: { userId: companion.id },
      create: { userId: companion.id },
      update: {},
    });

    // One completed, reviewed booking with earnings (settled to available).
    const start = new Date(Date.now() - 7 * 86400e3);
    const end = new Date(start.getTime() + 2 * 3600e3);
    const booking = await prisma.booking.create({
      data: {
        customerId: customer.id,
        companionProfileId: profile.id,
        experienceId: coffee.id,
        startAt: start,
        endAt: end,
        durationMinutes: 120,
        meetingType: MeetingType.IN_PERSON,
        meetingArea: 'Café, Sector 104',
        status: BookingStatus.COMPLETED,
        basePaise: 99800n,
        commissionPaise: 14970n,
        taxPaise: 2695n,
        totalPaise: 99800n,
        companionCreditPaise: 84830n,
        idempotencyKey: `seed-booking-${profile.id}`,
        acceptedAt: start,
        completedAt: new Date(start.getTime() + 2.5 * 3600e3),
        payments: {
          create: {
            provider: 'mock',
            providerOrderId: 'order_seed_1',
            providerPaymentId: 'pay_seed_1',
            amountPaise: 99800n,
            status: PaymentStatus.CAPTURED,
            idempotencyKey: `seed-payment-${profile.id}`,
            capturedAt: start,
          },
        },
        conversation: {
          create: {
            contextType: 'BOOKING',
            participants: { create: [{ userId: customer.id }, { userId: companion.id }] },
          },
        },
        checkin: {
          create: {
            companionProfileId: profile.id,
            status: 'CHECKED_OUT',
            checkedInAt: start,
            checkedOutAt: end,
          },
        },
      },
    });

    await prisma.walletTransaction.create({
      data: {
        walletId: wallet.id,
        type: 'BOOKING_CREDIT',
        state: 'AVAILABLE',
        amountPaise: 84830n,
        pendingBalanceAfter: 0n,
        availableBalanceAfter: 84830n,
        refType: 'BOOKING',
        refId: booking.id,
      },
    });
    await prisma.wallet.update({
      where: { id: wallet.id },
      data: { availablePaise: 84830n },
    });

    await prisma.review.create({
      data: {
        bookingId: booking.id,
        customerId: customer.id,
        companionProfileId: profile.id,
        communication: 5,
        punctuality: 5,
        respect: 5,
        experience: 4,
        overall: 5,
        comment: 'Aarav was punctual, warm and great company. Felt completely safe the whole time.',
        status: ModerationStatus.CLEARED,
      },
    });
  }

  await prisma.notification.create({
    data: {
      userId: customer.id,
      type: NotificationType.BOOKING_REMINDER,
      payload: { message: 'Welcome to Saath — explore verified companions.' },
      readAt: null,
    },
  });

  console.log('Seed complete.');
  console.log('  Admin:     admin@saath.app / Password123!');
  console.log('  Companion: companion@saath.app / Password123!');
  console.log('  Customer:  customer@saath.app / Password123!');
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
