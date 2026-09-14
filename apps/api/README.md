# Saath API — Backend

Production-structured Express + TypeScript + Prisma + PostgreSQL + Redis backend
for the Saath companionship marketplace. See `../../docs/ARCHITECTURE.md` for
the full system design and `../../docs/DESIGN_SYSTEM.md` for the UI spec.

## Stack

- **Express 4 + TypeScript** (ESM, `tsx` in dev)
- **Prisma + PostgreSQL 16+** — migrations incl. a GiST `EXCLUDE` constraint
  that authoritatively prevents double-booking
- **Redis (ioredis)** — rate limiting, OTP, refresh-token storage
- **Socket.IO** — authenticated realtime chat, typing, presence, notifications
- **argon2id** password hashing, JWT access + rotating refresh tokens
- **Mock payment provider** (`PaymentProvider` interface) — swap in Razorpay
  via `PAYMENTS_MOCK=false` + keys; webhook signature verification is built in
- **Mock IDV provider** — hosted Hyperverge/Onfido flow in production
- Scheduler loop (BullMQ in prod) for payment expiry, auto-completion,
  earnings release, safety check-out escalation

## Run locally

```bash
# 1. Dependencies (repo root)
npm install
npm run build:shared

# 2. Postgres + Redis (use infra/docker-compose.yml on other machines)
#    Sandbox has them natively:
sudo service postgresql start && sudo service redis-server start
createdb saath  # or: psql -c "CREATE DATABASE saath"

# 3. Configure
cp .env.example .env   # defaults work for local dev

# 4. Migrate + seed
npx prisma migrate deploy
# one-time: also deploy the raw constraint migration via migrate deploy
npm run db:seed

# 5. Run
npm run dev            # http://localhost:4000
```

### Seeded accounts (dev)

| Role      | Email                  | Password       |
|-----------|------------------------|----------------|
| Admin     | `admin@saath.app`      | `Password123!` |
| Companion | `companion@saath.app`  | `Password123!` |
| Customer  | `customer@saath.app`   | `Password123!` |

## Key endpoints (`/api/v1`)

| Area | Endpoints |
|---|---|
| Auth | `POST /auth/register`, `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout-all`, `POST /auth/otp/{request,verify}`, `GET /auth/me` |
| Discovery | `GET /companions` (filters, sort, compatibility score), `GET /companions/:id`, `GET /companions/:id/availability?date=` |
| Companion | `POST /companions/apply`, `GET/PATCH /companions/me`, `PUT /companions/me/services`, `PUT /companions/me/availability` |
| Booking | `POST /bookings`, `POST /bookings/:id/{accept,reject,cancel,payment-order,checkin,checkout,complete,dispute}` |
| Payments | `POST /payments/webhook` (HMAC-verified), `POST /payments/mock-capture` (dev only) |
| Wallet | `GET /wallet`, `POST /wallet/payouts`, `GET /earnings` |
| Chat | `GET /conversations`, `POST /conversations`, `GET /conversations/:id/messages`, `POST /messages` (+ Socket.IO) |
| Reviews | `POST /reviews` (completed bookings only) |
| Trust | `POST /reports`, `POST /blocks`, `POST /favorites` |
| Safety | `POST /safety/sos`, `GET/POST /safety/trusted-contacts`, `POST /safety/location`, `GET /safety/checkins` |
| Verify | `POST /verification/session`, `POST /verification/webhook`, `GET /verification/status` |
| Admin | `GET /admin/dashboard`, `/admin/users/*`, `/admin/reports/*`, `/admin/messages/flagged`, `/admin/disputes/*`, `/admin/payouts/*`, `GET/PUT /admin/settings`, `GET /admin/audit-logs` |

## Security properties

- argon2id hashes; access JWT 15 min; rotating httpOnly refresh cookies with
  family revocation
- Redis sliding-window rate limits (global/auth/OTP/booking/chat)
- All input validated through shared zod schemas
- Payment state changes **only** from signature-verified webhooks; idempotent
- RBAC (`requireRole`) + resource ownership checks on every protected route
- Append-only `audit_logs` for admin/financial actions
- Chat messages moderated synchronously: high-risk held for human review
  (never auto-punish); cumulative risk scoring routes to moderation queue
- Money is integer paise; append-only wallet ledger; fees configured in DB
  and snapshotted onto bookings

## Tests

```bash
npm test                 # shared domain unit tests + API integration tests
```

- `packages/shared/test/domain.test.ts` — pricing, cancellation policy,
  compatibility matcher, moderation, risk scoring, availability math
- `apps/api/tests/integration.test.ts` — boots the app against real
  Postgres/Redis and runs the full flow: register → apply → verify →
  configure → discover → book → accept → pay (signed webhook + idempotency +
  bad-signature rejection) → check-in/out → complete → review → wallet,
  plus RBAC, overlap rejection, chat moderation, and admin gating.
