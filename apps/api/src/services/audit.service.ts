import type { Request } from 'express';
import { prisma } from '../lib/prisma.js';

/** Append-only audit trail for privileged/financial/admin actions. */
export async function recordAudit(params: {
  actorId: string | null;
  action: string;
  targetType: string;
  targetId: string;
  before?: unknown;
  after?: unknown;
  req?: Request;
}): Promise<void> {
  await prisma.auditLog.create({
    data: {
      actorId: params.actorId,
      action: params.action,
      targetType: params.targetType,
      targetId: params.targetId,
      before: params.before as object | undefined,
      after: params.after as object | undefined,
      ip: params.req?.ip,
      userAgent: params.req?.headers['user-agent'],
    },
  });
}
