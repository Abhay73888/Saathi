import type { Server as HttpServer } from 'node:http';
import { Server } from 'socket.io';
import { verifyAccessToken } from '../services/token.service.js';
import { prisma } from '../lib/prisma.js';
import { sendMessage } from '../services/chat.service.js';
import { logger } from '../lib/logger.js';

export let io: Server | null = null;

/**
 * Authenticated Socket.IO gateway. JWT verified on handshake; users join a
 * personal room (user:<id>) and conversation rooms. Message persistence +
 * moderation goes through the same service as REST (single source of truth).
 */
export function initSocket(httpServer: HttpServer): Server {
  io = new Server(httpServer, {
    cors: { origin: process.env.WEB_ORIGIN ?? 'http://localhost:3000', credentials: true },
  });

  io.use((socket, next) => {
    const token =
      socket.handshake.auth?.token ??
      (socket.handshake.headers.authorization?.startsWith('Bearer ')
        ? socket.handshake.headers.authorization.slice(7)
        : null);
    if (!token) return next(new Error('unauthorized'));
    try {
      const payload = verifyAccessToken(token);
      socket.data.userId = payload.sub;
      socket.data.role = payload.role;
      next();
    } catch {
      next(new Error('unauthorized'));
    }
  });

  io.on('connection', async (socket) => {
    const userId: string = socket.data.userId;
    await socket.join(`user:${userId}`);

    // Join all conversation rooms this user belongs to.
    const participations = await prisma.conversationParticipant.findMany({
      where: { userId },
      select: { conversationId: true },
    });
    for (const p of participations) await socket.join(`convo:${p.conversationId}`);

    io?.to(`user:${userId}`).emit('presence', { userId, online: true });

    socket.on('conversation:open', (conversationId: string) => {
      void socket.join(`convo:${conversationId}`);
    });

    socket.on('message:send', async (payload: { conversationId: string; body: string }, ack?: (r: unknown) => void) => {
      try {
        if (!payload?.conversationId || typeof payload.body !== 'string') {
          ack?.({ ok: false, error: 'BAD_REQUEST' });
          return;
        }
        const { message, held, senderWarning } = await sendMessage({
          conversationId: payload.conversationId,
          senderId: userId,
          body: payload.body,
        });
        if (held) {
          ack?.({ ok: true, held: true, warning: senderWarning });
          return;
        }
        io?.to(`convo:${payload.conversationId}`).emit('message:new', message);
        ack?.({ ok: true, message });
      } catch (err) {
        logger.warn('socket.message.failed', { message: (err as Error).message });
        ack?.({ ok: false, error: (err as Error).message });
      }
    });

    socket.on('typing', (conversationId: string) => {
      socket.to(`convo:${conversationId}`).emit('typing', { conversationId, userId });
    });

    socket.on('read:receipt', async (conversationId: string) => {
      const last = await prisma.message.findFirst({
        where: { conversationId, senderId: { not: userId } },
        orderBy: { createdAt: 'desc' },
        select: { id: true },
      });
      if (last) {
        await prisma.conversationParticipant.updateMany({
          where: { conversationId, userId },
          data: { lastReadMessageId: last.id },
        });
        socket.to(`convo:${conversationId}`).emit('read:receipt', { conversationId, userId, messageId: last.id });
      }
    });

    socket.on('disconnect', () => {
      io?.emit('presence', { userId, online: false });
    });
  });

  return io;
}
