import { BookingStatus, ModerationStatus, NotificationType } from '@saath/shared';
import { prisma } from '../lib/prisma.js';
import { Errors } from '../lib/errors.js';
import { notify } from './notification.service.js';

export interface ReviewInput {
  bookingId: string;
  customerId: string;
  communication: number;
  punctuality: number;
  respect: number;
  experience: number;
  overall: number;
  comment?: string;
}

/** Only the customer, only on a COMPLETED booking, exactly one review each. */
export async function submitReview(input: ReviewInput) {
  const booking = await prisma.booking.findUnique({
    where: { id: input.bookingId },
    include: { reviews: true },
  });
  if (!booking) throw Errors.notFound('Booking');
  if (booking.customerId !== input.customerId) throw Errors.forbidden();
  if (booking.status !== BookingStatus.COMPLETED) {
    throw Errors.conflict('Reviews open after the booking is completed.', 'REVIEW_NOT_ELIGIBLE');
  }
  if (booking.reviews.length > 0) {
    throw Errors.conflict('You have already reviewed this booking.', 'REVIEW_EXISTS');
  }

  const review = await prisma.$transaction(async (tx) => {
    const r = await tx.review.create({
      data: {
        bookingId: input.bookingId,
        customerId: input.customerId,
        companionProfileId: booking.companionProfileId,
        communication: input.communication,
        punctuality: input.punctuality,
        respect: input.respect,
        experience: input.experience,
        overall: input.overall,
        comment: input.comment,
        status: ModerationStatus.CLEARED,
      },
    });

    // Recompute aggregates from all reviews.
    const agg = await tx.review.aggregate({
      where: { companionProfileId: booking.companionProfileId, status: ModerationStatus.CLEARED },
      _avg: { communication: true, punctuality: true, respect: true, experience: true, overall: true },
      _count: true,
    });
    await tx.companionProfile.update({
      where: { id: booking.companionProfileId },
      data: {
        ratingAvg: agg._avg.overall ?? 0,
        ratingCount: agg._count,
        ratingCommunication: agg._avg.communication ?? 0,
        ratingPunctuality: agg._avg.punctuality ?? 0,
        ratingRespect: agg._avg.respect ?? 0,
        ratingExperience: agg._avg.experience ?? 0,
      },
    });
    return r;
  });

  const companion = await prisma.companionProfile.findUnique({
    where: { id: booking.companionProfileId },
    select: { userId: true },
  });
  if (companion) {
    await notify(companion.userId, NotificationType.REVIEW_RECEIVED, {
      bookingId: input.bookingId,
      overall: input.overall,
    });
  }
  return review;
}
