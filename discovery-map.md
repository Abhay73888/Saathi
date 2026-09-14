# 🗺️ Saath Platform — Comprehensive Discovery Map

**Generated**: 2026-09-15T00:17:00Z  
**Tech Stack**: Monorepo (Node.js 20, TypeScript 5.6, Next.js 15.1, Express 4.21, Prisma 5.22, PostgreSQL, Redis, Socket.IO, Tailwind CSS)

---

## 🏗️ Architecture & Modules

### 1. `packages/shared`
- **Pricing & Money**: Integer paise calculations (`fromPaise`, `toPaise`, `computePricingBreakdown`, `calculateEscrowSplit`), zero float tolerance.
- **Availability Engine**: Slot generation, overlap rejection, transactional window guards.
- **Moderation Engine**: Synchronous anti-escort filters, contact solicitation detection (`ESCORT_SOLICITATION`, `CONTACT_INFO_EXCHANGE`).
- **Risk Scoring**: Weighted multi-signal evaluation (`scoreSignals`, `levelForScore`).
- **Matching Engine**: Heuristic recommendation ranking.
- **Validation Schemas (Zod)**: `registerSchema`, `loginSchema`, `bookingCreateSchema`, `reviewCreateSchema`, etc.

### 2. `apps/api` (Port 4000)
- **Database**: 31 Prisma models (`User`, `CustomerProfile`, `CompanionProfile`, `Service`, `Booking`, `Wallet`, `WalletTransaction`, `AuditLog`, `RiskEvent`, `RiskScore`, `Notification`, `Message`, `Review`, `IdvSession`, etc.).
- **Authentication**: JWT access tokens (Bearer header) + HTTP-only rotation refresh cookie (`saath_rt`), argon2 password hashing, OTP verification.
- **Real-Time Layer**: Socket.IO for real-time messaging, booking state updates, and emergency SOS alerts.
- **Payment Processing**: Dual-mode payment provider (Live Razorpay checkout with webhook idempotency + simulated mock provider).

### 3. `apps/web` (Port 3000)
- **Framework**: Next.js 15 App Router + React 19 + Tailwind CSS.
- **Form Factor**: Mobile-First PWA (`manifest.json`, standalone mode, floating bottom bar, story reels, safe-area insets).
- **Navigation Shells**:
  - `NavBar.tsx`: Desktop navigation, city switcher (`📍 Bengaluru`), quick search, install prompt.
  - `MobileAppNav.tsx`: Glassmorphic 5-tab bottom navigation (`Home`, `Explore`, `Bookings`, `Safety`, `Account`).

---

## 👥 User Roles & Authorization

| Role | Permissions | Guard Middleware |
|---|---|---|
| **ANONYMOUS** | Explore companions, view safety guidelines, public stories | Public routes |
| **CUSTOMER** | Request bookings, chat with companions, view bookings, emergency SOS | `requireAuth`, `requireRole('CUSTOMER')` |
| **COMPANION** | Set availability, accept/decline bookings, manage services, wallet payouts | `requireAuth`, `requireCompanion` |
| **ADMIN** | Moderation review queue, IDV approvals, audit logs, payout approvals | `requireAuth`, `requireRole('ADMIN')` |

---

## 🛣️ API Endpoints Map

### Auth (`/api/v1/auth`)
- `POST /register`: Account creation with date-of-birth validation (18+ only)
- `POST /login`: Email/password login with argon2 verification
- `POST /refresh`: Refresh token exchange with token rotation & cookie invalidation
- `POST /logout`: Revoke all user refresh tokens and clear cookie
- `POST /otp/request`: Phone/email OTP issuance for verification
- `POST /otp/verify`: OTP verification handshake
- `GET /me`: Authenticated user identity and active profiles

### Companions (`/api/v1/companions`)
- `GET /`: Search and filter companions (city, vibe, interests, rating, rate range)
- `GET /featured`: Top-rated verified companions
- `GET /:id`: Full companion profile, services, and reviews
- `POST /profile`: Create/update companion profile (requires ID verification)
- `GET /:id/availability`: Available booking slots for date

### Bookings (`/api/v1/bookings`)
- `POST /`: Create booking request with transactional overlap checking
- `GET /`: List bookings for current user (customer or companion)
- `GET /:id`: Retrieve booking details, mutual PINs, and active session status
- `POST /:id/accept`: Companion accepts booking
- `POST /:id/decline`: Companion declines booking
- `POST /:id/start`: Dual-PIN mutual verification handshake to begin session
- `POST /:id/complete`: Complete booking, trigger wallet escrow release cooling
- `POST /:id/cancel`: Transactional cancellation with refund rules

### Safety & Emergency (`/api/v1/safety`)
- `POST /sos`: 1-tap live GPS emergency broadcast to safety desk + emergency contacts
- `POST /report`: File complaint or incident report with evidence
- `GET /desk`: Safety team review dashboard

### Wallet & Payouts (`/api/v1/wallet`)
- `GET /`: Balance inquiry (available, pending escrow) and transaction history
- `POST /payout`: Request payout to bank account (enforces risk check hold)

---

## 🖥️ Web App Route Directory

- `/`: Home page with Story Spotlight Reels, curated experiences, and Dual-PIN simulator
- `/explore`: Search, filter by city, vibe, and categories
- `/companion/[id]`: Companion profile & real-time booking scheduler widget
- `/bookings`: User bookings list with live session progress
- `/booking/[id]`: Dual-PIN verification screen, chat, and active GPS SOS
- `/safety`: Trust & safety charter, helpline directory, SOS guide
- `/become-a-companion`: Onboarding wizard for companions
- `/verification`: ID verification portal (hosted IDV flow)
- `/wallet`: Financial dashboard, earnings, payout requests
- `/messages`: Real-time chat with matched companions
- `/admin`: Moderation queue, risk scoring dashboard, user review
