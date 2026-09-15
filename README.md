<div align="center">

# 🛡️ SAATH (साथ)
### *Verified Platonic Companionship Marketplace — India's Safest Social Platform*

[![Next.js 15](https://img.shields.io/badge/Next.js-15.1.6-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![Express](https://img.shields.io/badge/Express-4.21-lightgrey?style=for-the-badge&logo=express)](https://expressjs.com/)
[![Prisma](https://img.shields.io/badge/Prisma-6.2-2D3748?style=for-the-badge&logo=prisma)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?style=for-the-badge&logo=postgresql)](https://www.postgresql.org/)
[![Redis](https://img.shields.io/badge/Redis-7.0-DC382D?style=for-the-badge&logo=redis)](https://redis.io/)
[![PWA Ready](https://img.shields.io/badge/PWA-Installable-purple?style=for-the-badge&logo=pwa)](https://web.dev/progressive-web-apps/)

**Never miss out on experiences because you have no one to go with.**  
Book 100% identity-screened, background-verified companions for coffee dates, live concerts, movies, workouts, gaming cafes, art crawls, and silent co-working.

[🌐 Live Demo](http://localhost:3000) • [📱 Mobile PWA](#-mobile-app-experience) • [🛡️ Safety Charter](#️-trust--safety-architecture) • [⚡ Quick Start](#-quick-start) • [🚀 Architecture](#-monorepo-architecture)

---

</div>

## 🌟 Why Saath Exists

Urban isolation in fast-growing metros is at an all-time high. Millions want to explore niche micro-roasteries, attend indie concerts, or go for weekend badminton matches, but lack the right company. 

Traditional dating and meetup apps blur lines and introduce safety vulnerabilities. **Saath solves this through a venture-grade, strictly platonic, zero-tolerance infrastructure:**
- **Zero Commercial Sex / Anti-Escort Guarantee:** Automated heuristic pre-screening holds any non-platonic solicitation.
- **100% Government ID & Biometric Age Verified:** Every companion is verified before their profile goes live.
- **Dual-PIN Mutual Handshake:** Sessions unlock only upon exchanging secret 4-digit codes in public venues.
- **Live GPS SOS Response:** 1-tap SOS alerts dispatch teams with real-time Google Maps coordinates.

---

## 📱 Mobile-First Native App Experience

Built from the ground up to feel like a high-performance **60fps Native Mobile App**:

- **🧭 Floating Glassmorphic Bottom Navigation:** Fluid 5-tab bar (`Home`, `Explore`, `Bookings`, `Safety`, `Account`) with spring micro-interactions and safe-area insets.
- **📸 Instagram/Airbnb-Style Story Spotlight Reels:** Horizontal snap-scrolling companion reels featuring real-time activity badges (`🎸 Concerts`, `☕ Cafes`, `🏃 Fitness`, `🎲 Boardgames`). Tap to open an instant full-screen Spotlight Sheet.
- **⚡ Buttery Touch Optimization:** `-webkit-tap-highlight-color: transparent` and `touch-action: manipulation` eliminate 300ms mobile tap delays.
- **📲 PWA Standalone Mode:** Add to home screen on iOS and Android with custom splash screens, app icons, and zero browser chrome.
- **📍 Smart City Switcher:** Instant multi-metro switching between Bengaluru, Delhi NCR, Mumbai, Hyderabad, and Pune.

---

## 🛡️ Trust & Safety Architecture

```
[ Client Request ] ──► [ Anti-Escort Heuristic Screener ] ──► [ Escrow Hold (Paise) ]
                                                                       │
[ Mutual Dual-PIN Handshake in Public Venue ] ◄────────────────────────┘
                    │
                    ▼
       [ Session Timer Activated ]
                    │
                    ▼
[ Live GPS SOS Armed ] ──► [ 24/7 Safety Desk + Emergency 112 / WhatsApp Alert ]
```

### 1. Dual-PIN Mutual Handshake
Sessions cannot be started remotely or unverified. Both client and companion generate a matching 4-digit code. Handshake completes strictly inside public, geo-fenced zones.

### 2. Live GPS SOS Dispatch
Instant emergency button accessible from any active booking screen:
- Captures high-precision GPS coordinates.
- Pre-fills emergency WhatsApp message with live location link to emergency contacts.
- Quick-dials **112 (National Emergency)** and **1091 (Women Helpline)**.

### 3. Financial Integrity (Integer Paise Engine)
All currency calculations and platform fees are executed strictly in integer paise (`bigint`) to avoid IEEE 754 floating-point rounding errors. Zero fee hardcoding; fully auditable append-only ledger.

---

## 🏗️ Monorepo Architecture

```
rentmate/
├── packages/
│   └── shared/          # Canonical domain core: pricing, Zod schemas, moderation, matching
├── apps/
│   ├── api/             # Express + Prisma + Redis + Socket.IO + PostgreSQL (31 models)
│   └── web/             # Next.js 15 App Router + Tailwind CSS + PWA Mobile App
├── infra/
│   └── docker-compose.yml # Local PostgreSQL & Redis infrastructure
└── docs/                # Architecture specifications & design system
```

| Package / App | Technology Stack | Responsibility |
|---|---|---|
| **`@saath/shared`** | TypeScript, Zod | Domain validation, integer paise math, recommendation engine, anti-solicitation filters |
| **`@saath/api`** | Node.js 20, Express, Prisma, Redis, Socket.IO | High-concurrency REST & Real-time WebSockets, transactional booking overlap protection |
| **`@saath/web`** | Next.js 15, React 19, Tailwind CSS | 30+ responsive routes, glassmorphic UI, mobile app shell, PWA service worker |

---

## ⚡ Quick Start

### Prerequisites
- **Node.js**: `v20.0.0` or higher
- **Package Manager**: `npm` (monorepo workspaces enabled)

### 1. Installation & Build
```bash
# Clone the repository
git clone https://github.com/your-username/rentmate.git
cd rentmate

# Install monorepo dependencies
npm install

# Build shared domain contracts
npm run build:shared
```

### 2. Database & Cache Setup

#### 🌟 Option A: Cloud Database (Fastest — 2 Minutes, No Docker Needed)
1. Provision a free PostgreSQL instance on [Neon.tech](https://neon.tech) or [Supabase](https://supabase.com).
2. Provision a free Redis cache on [Upstash](https://upstash.com).
3. Update `apps/api/.env`:
   ```env
   DATABASE_URL="postgresql://user:password@ep-xyz.neon.tech/saath?sslmode=require"
   REDIS_URL="rediss://default:password@xyz.upstash.io:6379"
   ```
4. Run migrations and database seeding:
   ```bash
   npm run db:setup
   ```

#### 🐳 Option B: Local Docker
```bash
docker compose -f infra/docker-compose.yml up -d
npm run db:setup
```

### 3. Launch Development Servers
Open two terminal windows:

```bash
# Terminal 1: Start API Gateway (Port 4000)
npm run dev

# Terminal 2: Start Web / Mobile App (Port 3000)
cd apps/web && npm run dev
```

Now open [http://localhost:3000](http://localhost:3000) in your browser!

---

## 🚀 Deployment

The monorepo deploys in two halves:

| Piece | Host | Notes |
| --- | --- | --- |
| `apps/web` (Next.js 15 PWA) | **Vercel** | Project **Root Directory must be `apps/web`**; `apps/web/vercel.json` pins the Next.js framework and `npm run build`. |
| `apps/api` (Express + Prisma + Redis + Socket.IO) | Render / Railway / Fly / ECS | Long-lived processes — not Vercel serverless. Build `npm run build:api`, start `npm run start:api`. |

Set `NEXT_PUBLIC_API_BASE` (e.g. `https://api.example.com/api/v1`) in the Vercel project
environment variables — it is inlined at build time.

👉 **Full checklist, environment variables, and the Vercel error/troubleshooting matrix: [`docs/VERCEL_DEPLOY.md`](docs/VERCEL_DEPLOY.md).**

---

## 📲 How to Install as Mobile App (PWA)

### 🟢 Android (Google Chrome)
1. Open `http://<your-ip>:3000` (e.g. `http://10.219.11.56:3000`) on your mobile browser.
2. Tap the **"Get the Saath App"** banner or tap Chrome menu (⋮) -> **"Install App"** / **"Add to Home screen"**.
3. Launch from your home screen — enjoy full-screen 60fps app experience.

### 🍎 iOS (Apple Safari)
1. Open Safari and navigate to your Saath URL.
2. Tap the **Share button** (⬆️ box with arrow).
3. Scroll down and tap **"Add to Home Screen"** (`+`).
4. Tap **Add** — open like a native iOS app with full safe-area notch support.

---

## 💳 Payment Gateway (Razorpay & Mock)

Saath features an interchangeable payment adapter for frictionless testing and production deployment:

```env
# In apps/api/.env
PAYMENTS_MOCK=false              # Set true for instant simulated test checkouts
RAZORPAY_KEY_ID=rzp_test_...     # Live UPI, Google Pay, PhonePe, Cards
RAZORPAY_KEY_SECRET=...
RAZORPAY_WEBHOOK_SECRET=...
```

---

## 🧪 Quality Assurance & Testing

```bash
# Test shared domain calculations (pricing, matching, risk)
npm run test -w @saath/shared

# Run strict TypeScript typechecks
npm run typecheck -w @saath/api
npm run typecheck -w @saath/web
```

### Pre-Seeded Test Credentials
All accounts use password: `Password123!`

| Role | Email | Capabilities |
|---|---|---|
| **Admin** | `admin@saath.app` | Verification approvals, moderation review, audit log inspection |
| **Companion** | `companion@saath.app` | Availability planner, booking manager, wallet payouts |
| **Customer** | `customer@saath.app` | Browse companions, test checkout, Dual-PIN simulator |

---

## 📜 Legal & Compliance Policy

- **Strictly Adults Only (18+):** Validated through government ID photo OCR and biometric liveliness checks.
- **Prohibited Activities:** Zero tolerance for escorting, prostitution, commercial adult services, or harassment. Immediate irreversible account termination and law enforcement referral.
- **Data Privacy:** Sensitive location data is ephemeral and session-scoped. Document verification is handled off-server by compliant IDV providers; physical ID copies are never persisted.

---

<div align="center">

**Built with ❤️ for urban companionship, safety, and human connection.**  
© 2026 Saath Platform. All rights reserved.

</div>
