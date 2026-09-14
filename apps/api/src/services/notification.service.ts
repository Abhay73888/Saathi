import type { NotificationType } from '@saath/shared';
import { prisma } from '../lib/prisma.js';
import { logger } from '../lib/logger.js';
import { io } from '../realtime/socket.js';

/**
 * In-app notifications are persisted + pushed over Socket.IO.
 * Email/SMS adapters dispatch side-effects (queued in production via BullMQ).
 */
export async function notify(
  userId: string,
  type: NotificationType,
  payload: Record<string, unknown>,
): Promise<void> {
  const n = await prisma.notification.create({
    data: { userId, type, channel: 'IN_APP', payload: payload as object },
  });
  io?.to(`user:${userId}`).emit('notification:new', {
    id: n.id,
    type,
    payload,
    createdAt: n.createdAt,
  });
  // Email/SMS fan-out would be queued here based on notification type.
  logger.info('notification.sent', { userId, type });
}
