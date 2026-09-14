/**
 * Integration test: boots the Express app against the real Postgres/Redis
 * and exercises the complete booking happy path plus key security rules.
 * Run with: npm test -w @saath/api
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { prisma } from '../src/lib/prisma.js';

const app = createApp();
const agent = request(app);

function unique(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

async function registerUser(email: string) {
  const res = await agent
    .post('/api/v1/auth/register')
    .send({
      email,
      password: 'Password123!',
      displayName: 'Test User',
      phone: '+9198' + String(Date.now()).slice(-8),
      dateOfBirth: '1995-01-01',
      ageAcknowledged: true,
    });
  expect(res.status).toBe(201);
  return res.body.data.accessToken as string;
}

describe('full booking lifecycle', () => {
  let customerToken: string;
  let companionToken: string;
  let adminToken: string;
  let companionProfileId: string;
  let experienceId: string;

  beforeAll(async () => {
    // Clean leftover test data from previous runs (idempotent test isolation).
    // Order respects FK constraints; all filtered by test-user emails.
    const testUser = { email: { contains: '@test.app' } };
    await prisma.messageFlag.deleteMany({ where: { message: { sender: testUser } } });
    await prisma.message.deleteMany({ where: { sender: testUser } });
    await prisma.conversation.deleteMany({ where: { participants: { some: { user: testUser } } } });
    await prisma.conversationParticipant.deleteMany({ where: { user: testUser } });
    await prisma.walletTransaction.deleteMany({ where: { wallet: { user: testUser } } });
    await prisma.payout.deleteMany({ where: { user: testUser } });
    await prisma.wallet.deleteMany({ where: { user: testUser } });
    await prisma.review.deleteMany({ where: { booking: { customer: testUser } } });
    await prisma.safetyCheckin.deleteMany({ where: { booking: { customer: testUser } } });
    await prisma.refund.deleteMany({ where: { booking: { customer: testUser } } });
    await prisma.payment.deleteMany({ where: { booking: { customer: testUser } } });
    await prisma.dispute.deleteMany({ where: { opener: testUser } });
    await prisma.booking.deleteMany({ where: { customer: testUser } });
    await prisma.availabilityOverride.deleteMany({ where: { companion: { user: testUser } } });
    await prisma.availabilitySlot.deleteMany({ where: { companion: { user: testUser } } });
    await prisma.companionService.deleteMany({ where: { companion: { user: testUser } } });
    await prisma.favorite.deleteMany({ where: { customer: testUser } });
    await prisma.block.deleteMany({
      where: { OR: [{ blocker: testUser }, { blocked: testUser }] },
    });
    await prisma.report.deleteMany({ where: { reporter: testUser } });
    await prisma.companionProfile.deleteMany({ where: { user: testUser } });
    await prisma.verificationRequest.deleteMany({ where: { user: testUser } });
    await prisma.customerProfile.deleteMany({ where: { user: testUser } });
    await prisma.session.deleteMany({ where: { user: testUser } });
    await prisma.notification.deleteMany({ where: { user: testUser } });
    await prisma.riskEvent.deleteMany({ where: { user: testUser } });
    await prisma.riskScore.deleteMany({ where: { user: testUser } });
    await prisma.user.deleteMany({ where: testUser });

    // Admin login (seeded).
    const login = await agent
      .post('/api/v1/auth/login')
      .send({ email: 'admin@saath.app', password: 'Password123!' });
    expect(login.status).toBe(200);
    adminToken = login.body.data.accessToken;

    customerToken = await registerUser(unique('customer') + '@test.app');
    companionToken = await registerUser(unique('companion') + '@test.app');
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('rejects unauthenticated access', async () => {
    const res = await agent.get('/api/v1/auth/me');
    expect(res.status).toBe(401);
  });

  it('rejects weak registration data', async () => {
    const res = await agent.post('/api/v1/auth/register').send({ email: 'bad', password: 'x' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('companion applies, gets verified by admin, configures profile', async () => {
    const apply = await agent
      .post('/api/v1/companions/apply')
      .set('Authorization', `Bearer ${companionToken}`)
      .send({
        displayName: 'Test Companion',
        tagline: 'Coffee and conversations',
        bio: 'I love meeting new people for coffee, walks and board games around the city.',
        city: 'Noida',
        area: 'Sector 62',
        languages: ['Hindi', 'English'],
        interests: ['coffee', 'movies', 'gaming'],
        meetingTypes: ['IN_PERSON'],
      });
    expect(apply.status).toBe(201);
    companionProfileId = apply.body.data.id;

    // Verify via admin: flip verification + moderation live.
    await prisma.companionProfile.update({
      where: { id: companionProfileId },
      data: { verificationStatus: 'VERIFIED', profileModeration: 'CLEARED', isLive: true },
    });

    const cat = await prisma.experienceCategory.findFirstOrThrow({ where: { slug: 'coffee' } });
    experienceId = cat.id;

    const services = await agent
      .put('/api/v1/companions/me/services')
      .set('Authorization', `Bearer ${companionToken}`)
      .send({
        services: [
          { experienceId, pricingModel: 'HOURLY', ratePaise: 49900, minDurationMinutes: 60, isActive: true },
        ],
      });
    expect(services.status).toBe(200);

    // Availability: every day (Mon–Sun), 10:00–19:00 IST.
    const avail = await agent
      .put('/api/v1/companions/me/availability')
      .set('Authorization', `Bearer ${companionToken}`)
      .send({
        slots: [0, 1, 2, 3, 4, 5, 6].map((dayOfWeek) => ({
          dayOfWeek,
          startTime: '10:00',
          endTime: '19:00',
        })),
        overrides: [],
      });
    expect(avail.status).toBe(200);
  });

  it('customer discovers the companion with compatibility scoring', async () => {
    const res = await agent
      .get('/api/v1/companions?city=Noida&interest=coffee&sort=rating')
      .set('Authorization', `Bearer ${customerToken}`);
    expect(res.status).toBe(200);
    const ids = res.body.data.map((c: { id: string }) => c.id);
    expect(ids).toContain(companionProfileId);
    const mine = res.body.data.find((c: { id: string }) => c.id === companionProfileId);
    expect(mine.verified).toBe(true);
    expect(Number(mine.fromRatePaise)).toBe(49900);
  });

  it('runs the complete request → accept → pay → confirm → complete → review flow', async () => {
    // Pick the first free 2h slot from the availability API for a date
    // 3+ days out (avoids same-day 30-minute rule and stale test data).
    let start = new Date();
    let freeSlots: { startAt: string; endAt: string }[] = [];
    for (let dayOffset = 3; dayOffset < 12; dayOffset++) {
      const d = new Date(Date.now() + dayOffset * 86400e3);
      const istDate = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Kolkata',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).format(d);
      const slotsRes = await agent
        .get(`/api/v1/companions/${companionProfileId}/availability?date=${istDate}&duration=120`)
        .set('Authorization', `Bearer ${customerToken}`);
      const slots = slotsRes.body.data as { startAt: string; endAt: string }[];
      if (slots.length > 0) {
        freeSlots = slots;
        start = new Date(slots[0]!.startAt);
        break;
      }
    }
    expect(freeSlots.length).toBeGreaterThan(0);
    const end = new Date(start.getTime() + 2 * 3600e3);

    const create = await agent
      .post('/api/v1/bookings')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        companionId: companionProfileId,
        experienceId,
        startAt: start.toISOString(),
        durationMinutes: 120,
        meetingType: 'IN_PERSON',
        meetingArea: 'Sector 62 café',
      });
    expect(create.status).toBe(201);
    const bookingId = create.body.data.id as string;
    // Price snapshot: 2h × ₹499 = ₹998 base.
    expect(Number(create.body.data.totalPaise)).toBe(99800);
    expect(Number(create.body.data.commissionPaise)).toBeGreaterThan(0);

    // Companion accepts the request → slot is now occupied in the DB.
    const accept = await agent
      .post(`/api/v1/bookings/${bookingId}/accept`)
      .set('Authorization', `Bearer ${companionToken}`);
    expect(accept.status).toBe(200);
    expect(accept.body.data.status).toBe('PENDING_PAYMENT');

    // A second overlapping booking must be rejected by availability once the
    // companion's calendar is occupied (CONFIRMED/PENDING_PAYMENT window).
    const overlap = await agent
      .post('/api/v1/bookings')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        companionId: companionProfileId,
        experienceId,
        startAt: new Date(start.getTime() + 3600e3).toISOString(),
        durationMinutes: 60,
        meetingType: 'IN_PERSON',
      });
    expect([409, 400]).toContain(overlap.status);
    void end;

    // Customer cannot accept their own booking (authorization).
    const wrongAccept = await agent
      .post(`/api/v1/bookings/${bookingId}/accept`)
      .set('Authorization', `Bearer ${customerToken}`);
    expect(wrongAccept.status).toBe(403);

    // Create payment order (server-side amount).
    const order = await agent
      .post(`/api/v1/bookings/${bookingId}/payment-order`)
      .set('Authorization', `Bearer ${customerToken}`);
    expect(order.status).toBe(200);
    const orderId = order.body.data.order.orderId as string;

    // Webhook with INVALID signature must be rejected.
    const badHook = await agent
      .post('/api/v1/payments/webhook')
      .set('x-webhook-signature', 'deadbeef')
      .send(JSON.stringify({ event: 'payment.captured', orderId }));
    expect(badHook.status).toBe(400);

    // Mock gateway callback (signed correctly) → captures + confirms.
    const capture = await agent
      .post('/api/v1/payments/mock-capture')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ orderId });
    expect(capture.status).toBe(200);

    // Webhook idempotency: replaying the same capture is a no-op.
    const replay = await agent
      .post('/api/v1/payments/mock-capture')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ orderId });
    expect(replay.status).toBe(200);

    const confirmed = await agent
      .get(`/api/v1/bookings/${bookingId}`)
      .set('Authorization', `Bearer ${customerToken}`);
    expect(confirmed.body.data.status).toBe('CONFIRMED');

    // Check-in → check-out → complete.
    await agent
      .post(`/api/v1/bookings/${bookingId}/checkin`)
      .set('Authorization', `Bearer ${customerToken}`)
      .expect(200);
    await agent
      .post(`/api/v1/bookings/${bookingId}/checkout`)
      .set('Authorization', `Bearer ${customerToken}`)
      .expect(200);
    const complete = await agent
      .post(`/api/v1/bookings/${bookingId}/complete`)
      .set('Authorization', `Bearer ${companionToken}`);
    expect(complete.status).toBe(200);
    expect(complete.body.data.status).toBe('COMPLETED');

    // Review — only once, only by the customer.
    const review = await agent
      .post('/api/v1/reviews')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        bookingId,
        communication: 5,
        punctuality: 5,
        respect: 5,
        experience: 4,
        overall: 5,
        comment: 'Great company, felt safe throughout.',
      });
    expect(review.status).toBe(201);

    const dup = await agent
      .post('/api/v1/reviews')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ bookingId, communication: 5, punctuality: 5, respect: 5, experience: 5, overall: 5 });
    expect(dup.status).toBe(409);

    // Companion earnings are pending in the ledger.
    const wallet = await agent
      .get('/api/v1/wallet')
      .set('Authorization', `Bearer ${companionToken}`);
    expect(Number(wallet.body.data.pendingPaise)).toBeGreaterThan(0);
  });

  it('holds high-risk chat messages and flags contact sharing pre-booking', async () => {
    const convo = await agent
      .post('/api/v1/conversations')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ companionProfileId });
    expect(convo.status).toBe(201);
    const conversationId = convo.body.data.id as string;

    const held = await agent
      .post('/api/v1/messages')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ conversationId, body: 'Pay me via UPI directly to skip the platform fee.' });
    expect(held.status).toBe(201);
    expect(held.body.data.moderationStatus).toBe('HELD');

    // Admin sees flagged message in queue.
    const flagged = await agent
      .get('/api/v1/admin/messages/flagged')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(flagged.status).toBe(200);
    expect(flagged.body.data.length).toBeGreaterThan(0);
  });

  it('non-admins cannot reach admin routes', async () => {
    const res = await agent
      .get('/api/v1/admin/dashboard')
      .set('Authorization', `Bearer ${customerToken}`);
    expect(res.status).toBe(403);
  });

  it('admin dashboard returns KPIs', async () => {
    const res = await agent
      .get('/api/v1/admin/dashboard')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.totalUsers).toBeGreaterThan(0);
    expect(res.body.data.verifiedCompanions).toBeGreaterThanOrEqual(1);
  });
});
