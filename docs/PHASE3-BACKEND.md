# Phase 3 — Backend: Delivered & Verified

## What was built

Monorepo with a runnable, locally-verified backend (Express + TypeScript + Prisma
+ PostgreSQL + Redis + Socket.IO).

### Database
- **31 Prisma models** covering every entity in the architecture doc (users,
  profiles, companions, services, availability, bookings, payments, refunds,
  wallet + ledger, payouts, conversations, messages, message flags, reviews,
  favorites, blocks, reports, disputes, verification, safety check-ins, SOS,
  trusted contacts, notifications, audit logs, settings, risk events/scores).
- Money as **BIGINT paise**; Prisma migrations applied to a live Postgres.
- **GiST EXCLUDE constraint** (`btree_gist`) authoritatively prevents
  double-booking at the database layer — application checks are defence-in-depth.

### Domain core (shared package, unit-tested)
- Money engine (integer paise, INR formatting)
- Pricing engine: base + admin-configured commission + GST, min booking,
  snapshotted to every booking; cancellation refund tiers
- Heuristic compatibility matcher behind a `RecommendationStrategy`
  interface (ML-ready); protected characteristics excluded
- Rule-based risk scorer (LOW/MED/HIGH — advisory only, never auto-ban)
- Synchronous message moderator (off-platform payment solicitation HELD;
  contact/URL sharing flagged with safety nudges)
- Availability interval math (recurring slots + overrides − bookings)

### API surface
- Auth: register, login (argon2id), rotating refresh tokens (httpOnly cookie +
  Redis + session families), OTP request/verify (Redis, rate-limited),
  logout-all, forgot-password
- Discovery: search/filter/sort, compatibility scores, public profiles,
  availability endpoint
- Companion: apply, profile/services/availability management, favorites
- Bookings: request → accept/reject → payment order → webhook capture →
  confirm → check-in/out → complete → cancel (policy refunds) → dispute
- Payments: `PaymentProvider` interface with mock gateway; **HMAC-verified
  webhooks only**, idempotent capture; mock-capture dev helper; bad-signature
  rejection proven by test
- Wallet: append-only ledger, pending→available release, payout requests with
  HIGH-risk auto-hold, admin approve/reject
- Chat: REST + authenticated Socket.IO gateway (rooms, typing, read receipts,
  presence, moderation on send)
- Reviews: post-completion only, one per booking, aggregate ratings
- Trust: reports (risk-classified, admin paging on HIGH), blocks (mutual
  enforcement in messaging)
- Safety: SOS → safety-team alert + trusted contacts, ephemeral location
  points while checked-in, check-in/out scheduler with 15/45-min escalation
- Verification: hosted-IDV abstraction + webhook workflow, admin decisions
- Admin: KPI dashboard, user search/actions (warn/suspend/ban/restore),
  reports queue, flagged messages, disputes, payouts, settings, audit logs
- Notifications: persisted + pushed via Socket.IO

### Jobs scheduler
Payment-window expiry, booking auto-completion, earnings release after cooling
period, missed-checkout escalation (15-min reminder → 45-min safety-team page).

## Verification

- `npx tsc --noEmit` clean
- **24 tests passing**:
  - 16 unit tests (pricing math, cancellation policy, matcher, moderation,
    risk, availability intervals)
  - 8 integration tests against real Postgres/Redis: auth, RBAC, validation,
    full booking lifecycle with webhook signature rejection + idempotent
    replay + overlap rejection, review-once enforcement, chat moderation,
    admin gating
- Live server smoke-tested on `:4000` (health, login, admin KPIs, wallet ledger).

## Run

```bash
npm install && npm run build:shared
cd apps/api
cp .env.example .env
npx prisma migrate deploy && npm run db:seed
npm run dev          # http://localhost:4000
npm test             # full suite
```

Seeded logins: `admin@saath.app` / `companion@saath.app` / `customer@saath.app`
— all with password `Password123!`.

## Production swaps (interfaces already in place)
- `PaymentProvider`: mock → Razorpay adapter (orders, webhooks, Route payouts)
- `IdvProvider`: mock → Hyperverge/Onfido hosted flow
- In-process setInterval loop → BullMQ repeatable jobs on Redis
- In-app only notifications → Resend (email) + MSG91 (SMS) adapters
