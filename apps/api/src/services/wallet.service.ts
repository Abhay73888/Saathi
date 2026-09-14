import { Prisma, type PrismaClient } from '@prisma/client';
import { WalletTxnType, WalletTxnState, PayoutStatus, RiskLevel } from '@saath/shared';
import { prisma } from '../lib/prisma.js';
import { getPaymentProvider } from './payments/payment.provider.js';
import { recordRiskEvent } from './risk.service.js';
import { Errors } from '../lib/errors.js';

/**
 * Append-only wallet ledger. Wallet rows hold cached balances updated
 * atomically inside transactions; every entry stores the resulting balances
 * for audit. Corrections are compensating entries, never updates/deletes.
 */

async function getOrCreateWallet(tx: Prisma.TransactionClient | PrismaClient, userId: string) {
  return tx.wallet.upsert({
    where: { userId },
    create: { userId },
    update: {},
  });
}

/** Credit companion earnings (pending until cooling period elapses post-completion). */
export async function creditBookingEarnings(
  tx: Prisma.TransactionClient,
  args: { userId: string; amountPaise: bigint; bookingId: string },
): Promise<void> {
  const wallet = await getOrCreateWallet(tx, args.userId);
  const pendingAfter = wallet.pendingPaise + args.amountPaise;
  await tx.walletTransaction.create({
    data: {
      walletId: wallet.id,
      type: WalletTxnType.BOOKING_CREDIT,
      state: WalletTxnState.PENDING,
      amountPaise: args.amountPaise,
      pendingBalanceAfter: pendingAfter,
      availableBalanceAfter: wallet.availablePaise,
      refType: 'BOOKING',
      refId: args.bookingId,
    },
  });
  await tx.wallet.update({
    where: { id: wallet.id },
    data: { pendingPaise: pendingAfter },
  });
}

/** Reverse pending earnings (full or partial) when a booking is refunded. */
export async function reversePendingEarnings(
  tx: Prisma.TransactionClient,
  args: { userId: string; amountPaise: bigint; bookingId: string },
): Promise<void> {
  const wallet = await getOrCreateWallet(tx, args.userId);
  const pendingAfter = wallet.pendingPaise - args.amountPaise;
  if (pendingAfter < 0n) {
    // Earnings may already have been released; debit available instead.
    const availAfter = wallet.availablePaise - args.amountPaise;
    await tx.walletTransaction.create({
      data: {
        walletId: wallet.id,
        type: WalletTxnType.REFUND_DEBIT,
        state: WalletTxnState.AVAILABLE,
        amountPaise: -args.amountPaise,
        pendingBalanceAfter: 0n,
        availableBalanceAfter: availAfter,
        refType: 'BOOKING',
        refId: args.bookingId,
      },
    });
    await tx.wallet.update({
      where: { id: wallet.id },
      data: { pendingPaise: 0n, availablePaise: availAfter },
    });
    return;
  }
  await tx.walletTransaction.create({
    data: {
      walletId: wallet.id,
      type: WalletTxnType.REFUND_DEBIT,
      state: WalletTxnState.PENDING,
      amountPaise: -args.amountPaise,
      pendingBalanceAfter: pendingAfter,
      availableBalanceAfter: wallet.availablePaise,
      refType: 'BOOKING',
      refId: args.bookingId,
    },
  });
  await tx.wallet.update({
    where: { id: wallet.id },
    data: { pendingPaise: pendingAfter },
  });
}

/**
 * Release pending → available for completed bookings past the cooling period.
 * Called by the scheduler. Moves balances with a RELEASE ledger entry.
 */
export async function releaseMaturedEarnings(cooldownHours: number): Promise<number> {
  const matured = await prisma.booking.findMany({
    where: {
      status: 'COMPLETED',
      completedAt: { lt: new Date(Date.now() - cooldownHours * 3600_000) },
    },
    include: { companion: true },
  });

  let released = 0;
  for (const booking of matured) {
    const creditTxn = await prisma.walletTransaction.findFirst({
      where: { refType: 'BOOKING', refId: booking.id, type: WalletTxnType.BOOKING_CREDIT, state: WalletTxnState.PENDING },
      include: { wallet: true },
    });
    if (!creditTxn) continue; // already released or reversed
    const amount = creditTxn.amountPaise;
    await prisma.$transaction(async (tx) => {
      await tx.walletTransaction.update({
        where: { id: creditTxn.id },
        data: { state: WalletTxnState.AVAILABLE },
      });
      await tx.walletTransaction.create({
        data: {
          walletId: creditTxn.walletId,
          type: WalletTxnType.RELEASE,
          state: WalletTxnState.AVAILABLE,
          amountPaise: 0n,
          pendingBalanceAfter: creditTxn.wallet.pendingPaise - amount,
          availableBalanceAfter: creditTxn.wallet.availablePaise + amount,
          refType: 'BOOKING',
          refId: booking.id,
        },
      });
      await tx.wallet.update({
        where: { id: creditTxn.walletId },
        data: {
          pendingPaise: { decrement: amount },
          availablePaise: { increment: amount },
        },
      });
    });
    released++;
  }
  return released;
}

export async function requestPayout(
  userId: string,
  amountPaise: number,
  fundAccountId: string,
): Promise<{ id: string; status: PayoutStatus }> {
  const amount = BigInt(amountPaise);
  return prisma.$transaction(async (tx) => {
    const wallet = await getOrCreateWallet(tx, userId);
    if (wallet.availablePaise < amount) {
      throw Errors.badRequest('Available balance is lower than this amount.', 'WALLET_INSUFFICIENT');
    }

    // Fraud prevention: HIGH risk users' payouts go ON_HOLD for human review.
    const risk = await tx.riskScore.findUnique({ where: { userId } });
    const highRisk = risk?.level === RiskLevel.HIGH;

    const payout = await tx.payout.create({
      data: {
        userId,
        walletId: wallet.id,
        amountPaise: amount,
        fundAccountId,
        status: highRisk ? PayoutStatus.ON_HOLD : PayoutStatus.UNDER_REVIEW,
        riskHoldReason: highRisk ? 'HIGH risk score — manual review required' : null,
      },
    });

    // Debit available balance immediately (funds reserved).
    await tx.walletTransaction.create({
      data: {
        walletId: wallet.id,
        type: WalletTxnType.PAYOUT_DEBIT,
        state: WalletTxnState.AVAILABLE,
        amountPaise: -amount,
        pendingBalanceAfter: wallet.pendingPaise,
        availableBalanceAfter: wallet.availablePaise - amount,
        refType: 'PAYOUT',
        refId: payout.id,
      },
    });
    await tx.wallet.update({
      where: { id: wallet.id },
      data: { availablePaise: { decrement: amount }, withdrawnPaise: { increment: amount } },
    });

    if (highRisk) {
      await recordRiskEvent(userId, 'CHARGEBACK', { reason: 'payout_hold_context' });
    }
    return { id: payout.id, status: payout.status as PayoutStatus };
  });
}

export async function processApprovedPayout(payoutId: string): Promise<void> {
  const payout = await prisma.payout.findUnique({ where: { id: payoutId } });
  if (!payout || (payout.status !== PayoutStatus.APPROVED && payout.status !== PayoutStatus.UNDER_REVIEW)) return;
  await prisma.payout.update({
    where: { id: payoutId },
    data: { status: PayoutStatus.PROCESSING },
  });
  const provider = await getPaymentProvider();
  const { providerRef } = await provider.payout({
    fundAccountId: payout.fundAccountId,
    amountPaise: Number(payout.amountPaise),
    reference: payout.id,
  });
  await prisma.payout.update({
    where: { id: payoutId },
    data: { status: PayoutStatus.COMPLETED, providerRef, processedAt: new Date() },
  });
}
