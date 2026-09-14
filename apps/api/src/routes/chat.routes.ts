import { Router } from 'express';
import { z } from 'zod';
import { messageSchema } from '@saath/shared';
import { prisma } from '../lib/prisma.js';
import { asyncHandler } from '../middleware/async.js';
import { validateBody } from '../middleware/validate.js';
import { requireAuth } from '../middleware/auth.js';
import { limits } from '../middleware/rateLimit.js';
import { sendMessage, startInquiry } from '../services/chat.service.js';
import { Errors } from '../lib/errors.js';

export const chatRouter = Router();

chatRouter.get(
  '/conversations',
  requireAuth,
  asyncHandler(async (req, res) => {
    const participations = await prisma.conversationParticipant.findMany({
      where: { userId: req.auth!.userId },
      orderBy: { conversation: { updatedAt: 'desc' } },
      include: {
        conversation: {
          include: {
            participants: { include: { user: { include: { customerProfile: true, companionProfile: true } } } },
            booking: { include: { experience: true } },
            messages: { orderBy: { createdAt: 'desc' }, take: 1 },
          },
        },
      },
    });
    const data = participations.map((p) => {
      const other = p.conversation.participants.find((x) => x.userId !== req.auth!.userId);
      const name =
        other?.user.companionProfile?.displayName ?? other?.user.customerProfile?.displayName ?? 'Member';
      return {
        id: p.conversationId,
        contextType: p.conversation.contextType,
        booking: p.conversation.booking
          ? { id: p.conversation.booking.id, experience: p.conversation.booking.experience.name, startAt: p.conversation.booking.startAt, status: p.conversation.booking.status }
          : null,
        other: { id: other?.userId, name, verified: !!other?.user.companionProfile?.verificationStatus || false },
        lastMessage: p.conversation.messages[0]
          ? { body: p.conversation.messages[0].body, createdAt: p.conversation.messages[0].createdAt, moderationStatus: p.conversation.messages[0].moderationStatus }
          : null,
        updatedAt: p.conversation.updatedAt,
      };
    });
    res.json({ data });
  }),
);

chatRouter.post(
  '/conversations',
  requireAuth,
  asyncHandler(async (req, res) => {
    const { companionProfileId } = z.object({ companionProfileId: z.string().uuid() }).parse(req.body);
    const convo = await startInquiry(req.auth!.userId, companionProfileId);
    res.status(201).json({ data: convo });
  }),
);

chatRouter.get(
  '/conversations/:id/messages',
  requireAuth,
  asyncHandler(async (req, res) => {
    const participant = await prisma.conversationParticipant.findUnique({
      where: {
        conversationId_userId: { conversationId: req.params.id, userId: req.auth!.userId },
      },
    });
    if (!participant) throw Errors.forbidden();
    const messages = await prisma.message.findMany({
      where: { conversationId: req.params.id },
      orderBy: { createdAt: 'asc' },
      take: 100,
    });
    // HELD messages are hidden from the recipient until moderation clears them.
    const visible = messages.filter(
      (m) => m.moderationStatus !== 'HELD' || m.senderId === req.auth!.userId,
    );
    res.json({ data: visible });
  }),
);

// REST fallback for message send (Socket.IO is the primary path).
chatRouter.post(
  '/messages',
  requireAuth,
  limits.chat,
  validateBody(messageSchema),
  asyncHandler(async (req, res) => {
    const body = req.body as z.infer<typeof messageSchema>;
    const result = await sendMessage({
      conversationId: body.conversationId,
      senderId: req.auth!.userId,
      body: body.body,
    });
    res.status(201).json({ data: result.message, held: result.held, warning: result.senderWarning });
  }),
);
