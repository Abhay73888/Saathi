import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'production' ? ['warn', 'error'] : ['warn', 'error'],
});

/** BigInt serialises to JSON safely (our paise values are within Number range). */
(BigInt.prototype as unknown as { toJSON: () => number }).toJSON = function () {
  return Number(this);
};

export async function connectDb(): Promise<void> {
  await prisma.$connect();
}
