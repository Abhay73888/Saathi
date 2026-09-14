import { Router } from 'express';
import type { Request, Response } from 'express';
import { z } from 'zod';
import {
  companionApplySchema,
  availabilitySlotSchema,
  availabilityOverrideSchema,
  serviceSchema,
  UserRole,
  VerificationStatus,
  ModerationStatus,
  MeetingType,
  HeuristicRecommendationStrategy,
} from '@saath/shared';
import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { asyncHandler } from '../middleware/async.js';
import { validateBody } from '../middleware/validate.js';
import { requireAuth } from '../middleware/auth.js';
import { Errors } from '../lib/errors.js';
import { getFreeSlotsForDate } from '../services/availability.service.js';
import { recordAudit } from '../services/audit.service.js';

export const companionsRouter = Router();

const experienceList = asyncHandler(async (_req: Request, res: Response) => {
  const categories = await prisma.experienceCategory.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: 'asc' },
  });
  res.json({ data: categories });
});
companionsRouter.get('/experience-categories', experienceList);

// ---------------- Discovery ----------------

const exploreQuery = z.object({
  q: z.string().max(100).optional(),
  city: z.string().max(80).optional(),
  experience: z.string().uuid().optional(),
  language: z.string().max(40).optional(),
  interest: z.string().max(40).optional(),
  meetingType: z.nativeEnum(MeetingType).optional(),
  rating: z.coerce.number().min(0).max(5).optional(),
  priceMax: z.coerce.number().int().optional(), // paise
  sort: z
    .enum(['recommended', 'rating', 'price_asc', 'price_desc', 'most_booked', 'recently_active'])
    .default('recommended'),
  interests: z.string().optional(), // comma-separated for AI matching
  languages: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
});

companionsRouter.get(
  '/companions',
  asyncHandler(async (req: Request, res: Response) => {
    const q = exploreQuery.parse(req.query);
    const where: Prisma.CompanionProfileWhereInput = {
      isLive: true,
      verificationStatus: VerificationStatus.VERIFIED,
      ...(q.city ? { city: { contains: q.city, mode: 'insensitive' } } : {}),
      ...(q.language ? { languages: { has: q.language } } : {}),
      ...(q.interest ? { interests: { has: q.interest } } : {}),
      ...(q.meetingType ? { meetingTypes: { has: q.meetingType } } : {}),
      ...(q.rating ? { ratingAvg: { gte: q.rating } } : {}),
      ...(q.q
        ? { OR: [{ displayName: { contains: q.q, mode: 'insensitive' } }, { bio: { contains: q.q, mode: 'insensitive' } }] }
        : {}),
      ...(q.experience || q.priceMax
        ? {
            services: {
              some: {
                isActive: true,
                ...(q.experience ? { experienceId: q.experience } : {}),
                ...(q.priceMax ? { ratePaise: { lte: BigInt(q.priceMax) } } : {}),
              },
            },
          }
        : {}),
    };

    const orderBy: Prisma.CompanionProfileOrderByWithRelationInput =
      q.sort === 'rating'
        ? { ratingAvg: 'desc' }
        : q.sort === 'most_booked'
          ? { completedCount: 'desc' }
          : q.sort === 'recently_active'
            ? { updatedAt: 'desc' }
            : { ratingAvg: 'desc' };

    const [rows, total] = await Promise.all([
      prisma.companionProfile.findMany({
        where,
        orderBy,
        skip: (q.page - 1) * q.pageSize,
        take: q.pageSize,
        include: { services: { where: { isActive: true }, orderBy: { ratePaise: 'asc' } } },
      }),
      prisma.companionProfile.count({ where }),
    ]);

    // Compatibility scoring when the user expresses preferences (AI matching hook).
    const prefInterests = q.interests?.split(',').map((s) => s.trim()).filter(Boolean);
    const prefLanguages = q.languages?.split(',').map((s) => s.trim()).filter(Boolean);
    let scores: Map<string, number> | null = null;
    if ((prefInterests?.length || prefLanguages?.length || q.interest || q.language)) {
      const engine = new HeuristicRecommendationStrategy();
      scores = new Map(
        engine
          .rank(
            rows.map((c) => ({
              companionId: c.id,
              interests: c.interests,
              languages: c.languages,
              experienceSlugs: [],
              city: c.city,
              ratePaise: c.services[0]?.ratePaise ?? 0n,
              ratingAvg: c.ratingAvg,
              responseRate: c.responseRate,
              completionRate: 1 - c.cancellationRate,
              isVerified: c.verificationStatus === VerificationStatus.VERIFIED,
              availableForWindow: true,
            })),
            {
              interests: prefInterests ?? (q.interest ? [q.interest] : []),
              languages: prefLanguages ?? (q.language ? [q.language] : []),
              city: q.city ?? null,
              budgetPaise: q.priceMax ?? null,
            },
          )
          .map((r) => [r.companionId, r.score] as const),
      );
    }

    const data = rows.map((c) => ({
      id: c.id,
      displayName: c.displayName,
      tagline: c.tagline,
      avatarKey: c.avatarKey,
      city: c.city,
      area: c.area,
      bio: c.bio.slice(0, 140),
      interests: c.interests,
      languages: c.languages,
      meetingTypes: c.meetingTypes,
      ratingAvg: c.ratingAvg,
      ratingCount: c.ratingCount,
      completedCount: c.completedCount,
      responseRate: c.responseRate,
      verified: c.verificationStatus === VerificationStatus.VERIFIED,
      fromRatePaise: c.services[0]?.ratePaise ?? null,
      compatibility: scores?.get(c.id) ?? null,
    }));

    res.json({
      data,
      meta: { page: q.page, pageSize: q.pageSize, total },
    });
  }),
);

// ---------------- Public profile ----------------

companionsRouter.get(
  '/companions/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const profile = await prisma.companionProfile.findUnique({
      where: { id: req.params.id },
      include: {
        services: { where: { isActive: true }, include: { experience: true } },
        user: { select: { id: true, lastActiveAt: true } },
      },
    });
    if (!profile) throw Errors.notFound('Companion');
    if (
      !profile.isLive &&
      profile.userId !== req.auth?.userId &&
      req.auth?.role !== UserRole.ADMIN
    ) {
      throw Errors.notFound('Companion');
    }
    const reviews = await prisma.review.findMany({
      where: { companionProfileId: profile.id, status: ModerationStatus.CLEARED },
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: { booking: { include: { customer: { include: { customerProfile: true } } } } },
    });
    res.json({
      data: {
        id: profile.id,
        displayName: profile.displayName,
        tagline: profile.tagline,
        bio: profile.bio,
        avatarKey: profile.avatarKey,
        galleryKeys: profile.galleryKeys,
        city: profile.city,
        area: profile.area,
        languages: profile.languages,
        interests: profile.interests,
        personalityTags: profile.personalityTags,
        meetingTypes: profile.meetingTypes,
        verified: profile.verificationStatus === VerificationStatus.VERIFIED,
        verificationStatus: profile.verificationStatus,
        ratingAvg: profile.ratingAvg,
        ratingCount: profile.ratingCount,
        ratingBreakdown: {
          communication: profile.ratingCommunication,
          punctuality: profile.ratingPunctuality,
          respect: profile.ratingRespect,
          experience: profile.ratingExperience,
        },
        completedCount: profile.completedCount,
        responseRate: profile.responseRate,
        services: profile.services.map((s) => ({
          id: s.id,
          experience: { id: s.experience.id, slug: s.experience.slug, name: s.experience.name, icon: s.experience.icon },
          pricingModel: s.pricingModel,
          ratePaise: s.ratePaise,
          minDurationMinutes: s.minDurationMinutes,
        })),
        reviews: reviews.map((r) => ({
          id: r.id,
          overall: r.overall,
          communication: r.communication,
          punctuality: r.punctuality,
          respect: r.respect,
          experience: r.experience,
          comment: r.comment,
          createdAt: r.createdAt,
          author: r.booking.customer.customerProfile?.displayName ?? 'Member',
        })),
      },
    });
  }),
);

companionsRouter.get(
  '/companions/:id/availability',
  asyncHandler(async (req: Request, res: Response) => {
    const date = z.string().date().parse(req.query.date);
    const duration = z.coerce.number().int().min(30).max(600).default(60).parse(req.query.duration);
    const free = await getFreeSlotsForDate(req.params.id, date, duration);
    res.json({ data: free.map((i) => ({ startAt: i.start, endAt: i.end })) });
  }),
);

// ---------------- Apply as companion ----------------

companionsRouter.post(
  '/companions/apply',
  requireAuth,
  validateBody(companionApplySchema),
  asyncHandler(async (req: Request, res: Response) => {
    const body = req.body as z.infer<typeof companionApplySchema>;
    const existing = await prisma.companionProfile.findUnique({ where: { userId: req.auth!.userId } });
    if (existing) throw Errors.conflict('You already have a companion profile.', 'COMPANION_EXISTS');

    const profile = await prisma.companionProfile.create({
      data: {
        userId: req.auth!.userId,
        displayName: body.displayName,
        tagline: body.tagline,
        bio: body.bio,
        city: body.city,
        area: body.area,
        languages: body.languages,
        interests: body.interests,
        meetingTypes: body.meetingTypes,
        verificationStatus: VerificationStatus.NOT_STARTED,
        profileModeration: ModerationStatus.PENDING,
        isLive: false,
      },
    });
    await prisma.user.update({
      where: { id: req.auth!.userId },
      data: { role: UserRole.COMPANION },
    });
    await recordAudit({
      actorId: req.auth!.userId,
      action: 'COMPANION_APPLIED',
      targetType: 'COMPANION_PROFILE',
      targetId: profile.id,
      req,
    });
    res.status(201).json({ data: { id: profile.id, nextStep: 'verification' } });
  }),
);

// ---------------- Companion self-management ----------------

companionsRouter.get(
  '/companions/me',
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const profile = await prisma.companionProfile.findUnique({
      where: { userId: req.auth!.userId },
      include: { services: true, slots: true, overrides: { orderBy: { date: 'desc' }, take: 30 } },
    });
    if (!profile) throw Errors.notFound('Companion profile');
    res.json({ data: profile });
  }),
);

companionsRouter.patch(
  '/companions/me',
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const allowed = [
      'displayName', 'tagline', 'bio', 'city', 'area', 'languages',
      'interests', 'personalityTags', 'meetingTypes', 'galleryKeys', 'timezone',
    ] as const;
    const patch: Record<string, unknown> = {};
    for (const key of allowed) if (key in req.body) patch[key] = req.body[key];
    const profile = await prisma.companionProfile.updateMany({
      where: { userId: req.auth!.userId },
      data: { ...patch, profileModeration: ModerationStatus.PENDING },
    });
    if (profile.count === 0) throw Errors.notFound('Companion profile');
    res.json({ data: { ok: true, moderation: 'PENDING' } });
  }),
);

companionsRouter.put(
  '/companions/me/services',
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const services = z.array(serviceSchema).parse(req.body.services);
    const profile = await prisma.companionProfile.findUniqueOrThrow({
      where: { userId: req.auth!.userId },
    });
    await prisma.$transaction([
      prisma.companionService.deleteMany({ where: { companionProfileId: profile.id } }),
      prisma.companionService.createMany({
        data: services.map((s) => ({
          companionProfileId: profile.id,
          experienceId: s.experienceId,
          pricingModel: s.pricingModel,
          ratePaise: BigInt(s.ratePaise),
          minDurationMinutes: s.minDurationMinutes,
          isActive: s.isActive,
        })),
      }),
    ]);
    res.json({ data: { ok: true, count: services.length } });
  }),
);

companionsRouter.put(
  '/companions/me/availability',
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const slots = z.array(availabilitySlotSchema).parse(req.body.slots);
    const overrides = z.array(availabilityOverrideSchema).parse(req.body.overrides ?? []);
    const profile = await prisma.companionProfile.findUniqueOrThrow({
      where: { userId: req.auth!.userId },
    });
    await prisma.$transaction([
      prisma.availabilitySlot.deleteMany({ where: { companionProfileId: profile.id } }),
      prisma.availabilitySlot.createMany({
        data: slots.map((s) => ({
          companionProfileId: profile.id,
          dayOfWeek: s.dayOfWeek,
          startTime: s.startTime,
          endTime: s.endTime,
        })),
        skipDuplicates: true,
      }),
      prisma.availabilityOverride.createMany({
        data: overrides.map((o) => ({
          companionProfileId: profile.id,
          date: o.date,
          kind: o.kind,
          startTime: o.startTime,
          endTime: o.endTime,
          reason: o.reason,
        })),
      }),
    ]);
    res.json({ data: { ok: true, slots: slots.length, overrides: overrides.length } });
  }),
);

companionsRouter.post(
  '/companions/:id/favorite',
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    await prisma.favorite.create({
      data: { customerId: req.auth!.userId, companionProfileId: req.params.id },
    }).catch(() => undefined); // unique constraint => already favorited
    res.status(201).json({ data: { favorited: true } });
  }),
);

companionsRouter.delete(
  '/companions/:id/favorite',
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    await prisma.favorite.deleteMany({
      where: { customerId: req.auth!.userId, companionProfileId: req.params.id },
    });
    res.json({ data: { favorited: false } });
  }),
);
