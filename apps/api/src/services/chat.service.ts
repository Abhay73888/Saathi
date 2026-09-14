import { ModerationStatus, RiskLevel, RiskEventType, NotificationType } from '@saath/shared';
import { moderateMessage } from '@saath/shared';
import { prisma } from '../lib/prisma.js';
import { Errors } from '../lib/errors.js';
import { notify } from './notification.service.js';
import { recordRiskEvent } from './risk.service.js';

export interface SendMessageInput {
  conversationId: string;
  senderId: string;
  body: string;
}

/**
 * Persist + moderate a message. High-risk messages are HELD (not delivered)
 * and queued for human review — the system never silently punishes; it logs
 * and routes. Risk signals feed the cumulative risk score.
 */
export async function sendMessage(input: SendMessageInput) {
  const convo = await prisma.conversation.findUnique({
    where: { id: input.conversationId },
    include: {
      participants: true,
      booking: true,
    },
  });
  if (!convo) throw Errors.notFound('Conversation');
  const isParticipant = convo.participants.some((p) => p.userId === input.senderId);
  if (!isParticipant) throw Errors.forbidden();

  // Blocking is mutual across the platform.
  const other = convo.participants.find((p) => p.userId !== input.senderId);
  if (other) {
    const block = await prisma.block.findFirst({
      where: {
        OR: [
          { blockerId: input.senderId, blockedId: other.userId },
          { blockerId: other.userId, blockedId: input.senderId },
        ],
      },
    });
    if (block) throw Errors.forbidden('You cannot message this user.');
  }

  const hasConfirmedBooking =
    !!convo.booking && ['CONFIRMED', 'IN_PROGRESS', 'COMPLETED'].includes(convo.booking.status);

  const verdict = moderateMessage(input.body, { hasConfirmedBooking });

  const message = await prisma.message.create({
    data: {
      conversationId: input.conversationId,
      senderId: input.senderId,
      body: input.body,
      moderationStatus: verdict.holdForReview ? ModerationStatus.HELD : ModerationStatus.CLEARED,
      riskLevel: verdict.risk,
      moderationSignals: verdict.signals,
    },
  });

  if (verdict.signals.length > 0) {
    await prisma.messageFlag.create({
      data: {
        messageId: message.id,
        flaggedBy: 'system',
        signals: verdict.signals,
        riskLevel: verdict.risk,
      },
    });
    for (const signal of verdict.signals) {
      const map: Record<string, RiskEventType> = {
        OFF_PLATFORM_PAYMENT_ATTEMPT: 'OFF_PLATFORM_PAYMENT_ATTEMPT',
        THREAT_KEYWORD: 'THREAT_KEYWORD',
        CONTACT_INFO_SHARED: 'MESSAGE_FLAG',
        URL_SHARED: 'MESSAGE_FLAG',
      };
      await recordRiskEvent(input.senderId, map[signal] ?? 'MESSAGE_FLAG', { signal, messageId: message.id });
    }
  }

  await prisma.conversation.update({
    where: { id: input.conversationId },
    data: { updatedAt: new Date() },
  });

  // Notify the other participant (in-app + socket).
  if (other && !verdict.holdForReview) {
    await notify(other.userId, NotificationType.NEW_MESSAGE, {
      conversationId: input.conversationId,
      messageId: message.id,
    });
  }

  return { message, held: verdict.holdForReview, senderWarning: verdict.senderWarning };
}

/** Create (or reuse) an inquiry conversation between a customer and a companion. */
export async function startInquiry(customerId: string, companionProfileId: string) {
  const companion = await prisma.companionProfile.findUnique({
    where: { id: companionProfileId },
    select: { userId: true },
  });
  if (!companion) throw Errors.notFound('Companion');
  if (companion.userId === customerId) throw Errors.badRequest('You cannot message yourself.');

  // Reuse a booking-linked conversation if one already exists between these two.
  const existing = await prisma.conversation.findFirst({
    where: {
      participants: { every: { userId: { in: [customerId, companion.userId] } } },
      AND: [{ participants: { some: { userId: customerId } } }, { participants: { some: { userId: companion.userId } } }],
    },
    orderBy: { updatedAt: 'desc' },
  });
  if (existing) return existing;

  return prisma.conversation.create({
    data: {
      contextType: 'INQUIRY',
      participants: { create: [{ userId: customerId }, { userId: companion.userId }] },
    },
  });
}
