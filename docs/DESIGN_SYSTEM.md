# Saath — Phase 2: UI/UX Design System

> Brand identity, visual language, component specs, page designs, responsive rules,
> and motion/accessibility standards. Built on Phase 1 architecture. No app code yet —
> the companion file `design-showcase.html` renders every element in this doc live.

---

## 1. Brand Identity

**Saath (साथ)** — *"together, in good company."*

- **Positioning:** The safe, verified way to book companions for real social moments.
- **Feel:** Calm trust of a bank/healthcare app × the warmth of a hospitality brand.
  Explicitly **not** a dating-app aesthetic (no hot pinks, no sensual photography, no
  suggestive copy). Photography style: people in bright public places — cafés, parks,
  events — candid, fully-clothed, everyday.
- **Voice:** Warm, plain, reassuring. "You're protected here." Never sensational.
- **Logo concept:** A shield (safety) cradling a heart (human connection) — rendered
  as one continuous rounded mark. Wordmark set in the display serif with the Devanagari
  साथ as a secondary lockup for India markets.

---

## 2. Color Palette

All values are design tokens (CSS variables / Tailwind theme extension). AA contrast
verified for text pairs.

### 2.1 Primary — "Teal Trust" (trust, safety, primary actions)

| Token | Hex | Use |
|---|---|---|
| `teal-50` | `#EFF8F6` | tint backgrounds, selected chips |
| `teal-100` | `#D7EEEA` | soft badges |
| `teal-300` | `#7FC4BC` | borders, illustrations |
| `teal-500` | `#27877D` | links, secondary accents |
| `teal-600` | `#176B63` | interactive hover base |
| `teal-700` | `#11554F` | **primary buttons, nav** |
| `teal-800` | `#0E443F` | headings on light, footer |
| `teal-900` | `#0B3733` | deepest text-on-accent contrast |
| `teal-950` | `#062623` | footer bg |

### 2.2 Accent — "Marigold" (warmth, ratings, highlights; used sparingly)

| Token | Hex | Use |
|---|---|---|
| `marigold-300` | `#F8D07A` | star inactive track |
| `marigold-500` | `#ED9F1C` | **star ratings, highlights** |
| `marigold-600` | `#D08412` | hover |

### 2.3 Neutrals — "Warm Sand"

| Token | Hex | Use |
|---|---|---|
| `sand-50` | `#FBFAF7` | app background |
| `sand-100` | `#F5F1EA` | section alternates |
| `sand-200` | `#EAE4DA` | hairline borders |
| `sand-400` | `#A8A094` | placeholder text |
| `sand-600` | `#6B7370` | muted body text |
| `ink-900` | `#1E2A28` | primary text (warm charcoal, not pure black) |
| `white` | `#FFFFFF` | cards |

### 2.4 Semantic & safety

| Token | Hex | Use |
|---|---|---|
| `success` | `#1E9E6A` | confirmed, online dot, success toasts |
| `danger` | `#DC3B3B` | **SOS button**, errors, destructive actions |
| `danger-dark` | `#B02A2A` | SOS hover |
| `warning` | `#C9810C` | pending states, risk MEDIUM |
| `info` | `#2B7FD9` | informational banners |
| `rose` | `#E0564F` | favorite heart (active) |

### 2.5 Rules

- Primary buttons = teal-700. Marigold **never** used for buttons (only ratings/highlights).
- SOS = the only persistent red element in the app — it must visually dominate in emergencies.
- Gradients: soft teal `linear-gradient(135deg, #11554F → #176B63)` for hero/footer;
  glass overlay = `rgba(255,255,255,0.72)` + `backdrop-blur`. No colorful/purple gradients.

---

## 3. Typography

- **Display / headings / wordmark:** [Fraunces](https://fonts.google.com/specimen/Fraunces)
  — a soft, modern serif with optical sizing; gives premium editorial warmth.
  Fallback: `Georgia, 'Times New Roman', serif`.
- **UI / body:** [Plus Jakarta Sans](https://fonts.google.com/specimen/Plus_Jakarta_Sans)
  — geometric-humanist sans, friendly and highly legible at small sizes.
  Fallback: `system-ui, -apple-system, 'Segoe UI', sans-serif`.
- **Numerals:** tabular lining figures for prices/earnings (`font-variant-numeric: tabular-nums`).

### Type scale (desktop / mobile)

| Token | Size / line-height | Use |
|---|---|---|
| `display-xl` | 56/60 → 36/40, Fraunces 600 | Homepage hero |
| `display-lg` | 40/46 → 30/36 | Page heroes |
| `h1` | 32/38 → 26/32 | Page titles |
| `h2` | 24/30 → 20/26 | Section titles |
| `h3` | 19/26 | Card titles, sub-sections |
| `body-lg` | 17/26 | Lead paragraphs |
| `body` | 15/24 | Default UI text |
| `sm` | 13/20 | Meta, helper text |
| `xs` | 12/16 uppercase, +0.06em tracking | Labels, eyebrows, badge text |
| `price` | 20/24, Jakarta 700, tabular | Prices |

---

## 4. Spacing, Radius, Elevation, Layout

- **Spacing scale:** 4px base — `4, 8, 12, 16, 24, 32, 48, 64, 96`.
- **Radius:** `8` (inputs/buttons), `12` (chips/badges), `16` (cards), `24` (large panels/modals), `999` (pills).
- **Shadows:**
  - `shadow-card: 0 1px 2px rgba(14,68,63,.06), 0 8px 24px -12px rgba(14,68,63,.18)`
  - `shadow-pop: 0 12px 40px -12px rgba(6,38,35,.35)` (modals, popovers)
- **Container:** max-width `1200px`; explore grid `1120px`; gutters 16 mobile / 24 desktop.
- **Breakpoints:** `sm 640 · md 768 · lg 1024 · xl 1280`. Mobile-first.
- **Grid:** companions = 1 col (mobile) / 2 (md) / 3 (lg) / 3 with filters sidebar (xl).

---

## 5. Core Components

### 5.1 Buttons
- **Primary** — teal-700 bg, white text, radius 8, 44px min height (touch target),
  hover teal-800, active scale(0.98), loading spinner replaces label (button stays width).
- **Secondary** — white bg, teal-700 text + border teal-700.
- **Ghost / text** — no bg, teal text.
- **Danger** — white bg, red text/border for normal destructive; **solid red only for SOS**.
- Sizes: lg 48px, md 44px (default), sm 36px. Full-width on mobile forms.

### 5.2 Badges & chips
- **Verified badge** — teal-700 shield+check icon, white text "Verified" — appears next to
  names; tooltip explains "ID + age verified by [provider]".
- **Online dot** — emerald dot + "Online now" (presence).
- **Rating** — marigold star + `4.9` bold + muted `(128)`.
- **Experience chips** — sand-100 bg, ink text, coffee-cup icon etc.
- **Status pills** in dashboards: soft tinted bg (success/warning/danger/info at 12% opacity) + matching text.

### 5.3 Companion discovery card (the marketplace atom)
```
┌────────────────────────────┐
│  [photo 4:3, gradient      │   ♡ favorite (top-right, rose on active, pop animation)
│   placeholder w/ initials] │   ● Online dot (top-left, when live)
│                            │
├────────────────────────────┤
│ Aarav S.  🛡 Verified       │
│ ★ 4.9 (128) · Noida        │
│ "Coffee, long walks and     │
│  indie films..."            │
│ [Coffee] [Movies] [Gaming]  │
│ from ₹499/hr   [Book →]     │
└────────────────────────────┘
```
- Card radius 16, white bg, shadow-card, hover: translateY(-2px) + shadow-pop, image zoom 1.03.
- Skeleton = shimmer placeholders for photo, two text lines, chips.
- Favorite: heart button, 220ms spring pop on toggle.

### 5.4 Forms
- Label (sm, semibold) above; input height 44; border sand-200, focus ring teal-500/30
  + border teal-600; error = danger border + inline message + aria-invalid/aria-describedby.
- Selects = custom popover (native on mobile). Date/time = calendar strip + time chips
  (only slots the backend returns as free — never hardcoded).
- Toggles for availability; checkbox cards for experience categories.

### 5.5 Booking widget (right rail on profile, sticky)
Experience select → date strip → duration stepper → meeting type segmented
(In-person / Online) → note field → price breakdown:

```
Base (2h × ₹499)          ₹998
Platform fee (15%)        ₹150
GST (18% on fee)           ₹27
─────────────────────────────
Total                   ₹1,175
```
CTA **Request a Booking** → confirmation sheet with checkmark animation.

### 5.6 Safety components
- **SOS button** — persistent red circular FAB on booking/messages/safety screens + full
  emergency sheet: "Call 112" (biggest), "Alert Saath safety team", "Notify trusted
  contact + share live location". Always reachable in one tap.
- **Check-in banner** — teal card at top of active booking thread: "You're with Aarav
  14:00–16:00 · [Check in] [SOS]"; after check-in: [Check out] + live-session timer.
- **Trust strip** (hero + footer): "ID & age verified · Secure payments · Moderated
  chat · 24/7 safety support" with small icons.

### 5.7 Chat
- Conversation list (avatar, name, last message, unread count teal pill, booking-context
  label "Booking · Sat 4 PM"). Bubbles: teal-700 (mine) / white with border (theirs);
  system moderation nudge = sand-100 centered pill; typing dots; read = double-check.
- Report/block in ⋯ menu; off-platform attempt warning nudge pattern.

### 5.8 Navigation
- **Marketing:** transparent glass nav over hero → solid sand-50 on scroll. Links +
  [Become a Companion] secondary + [Sign in] ghost + [Explore] primary.
- **App (customer):** bottom tab bar on mobile (Explore, Bookings, Messages[unread dot],
  Safety, Profile); left sidebar on desktop.
- **Companion dashboard:** sidebar (Overview, Bookings, Availability, Earnings, Profile,
  Verification, Safety); KPI stat cards.
- **Admin:** dark teal sidebar (teal-950), data tables, queue cards with risk color
  coding, KPI row + chart placeholders, full audit history drawer.

### 5.9 Feedback & states
- **Toasts:** top-right desktop / top mobile; success teal, error red, auto-dismiss 4s.
- **Empty states:** illustration glyph (line icon in teal circle) + headline + one CTA
  ("No bookings yet — Explore companions").
- **Error page:** friendly shield glyph, "Something went wrong", [Try again] — never raw errors.
- **Skeletons** on every async surface (cards, profile, tables, messages).
- **Modals:** center desktop / bottom-sheet mobile; backdrop blur; focus-trapped; Esc closes.

---

## 6. Page Designs (all required routes)

### 6.1 Public / marketing

| Route | Design |
|---|---|
| `/` | Hero: teal gradient panel, Fraunces headline "Find your perfect companion", sub "Discover verified companions for safe and memorable social experiences.", CTAs **Explore Companions** / **Become a Companion**; trust strip; category chips row (Coffee, Dinner, Movies…); top-rated companion cards grid; how-it-works 3 steps; safety feature band (SOS, verification, secure pay); testimonials; footer with legal links + 18+ notice. |
| `/explore` | Left filter sidebar (desktop) / filter bottom-sheet (mobile): city & distance, date, duration, experience, price range slider, rating, languages, meeting type, verified toggle, sort dropdown. Result grid of cards with compatibility-score ring when AI matched. Map toggle V2. |
| `/companion/[id]` | Gallery (1 large + strip), name + Verified + rating + reviews + location + online; About; Interests; Languages (with fluency); Experiences w/ per-rate cards; Availability calendar strip; Reviews list (category bars); Verification panel (checkmarks: ID, age, phone, profile); Safety card (report/block, SOS info); sticky booking rail (desktop) / bottom CTA bar (mobile). |
| `/login` `/register` `/forgot-password` | Split screen: left brand panel (gradient, value props), right card form; social buttons (Google), OTP option; 18+ acknowledgement checkbox at register. |
| `/terms` `/privacy` `/community-guidelines` `/help` | Legal template: prose width 720px, sticky TOC, version date, last-updated banner. |

### 6.2 Customer app

| Route | Design |
|---|---|
| `/dashboard` | Greeting, upcoming booking card w/ check-in CTA, quick actions (Explore, Messages, Safety), recent activity. |
| `/bookings` | Tabbed: Upcoming / Past / Cancelled; booking rows → detail. `/booking/[id]`: timeline status stepper (Requested→Paid→Confirmed→Meeting→Completed), price breakdown, chat button, cancel/reschedule (policy-aware refund preview), dispute, report, check-in/out, receipt. |
| `/messages` | List + thread two-pane desktop / stacked mobile. |
| `/favorites` | Grid of saved cards with heart toggle. |
| `/notifications` | Grouped list, read/unread, deep links. |
| `/wallet` *(customer: payment methods & receipts V1)* | Transaction list, invoices. |
| `/reviews` | Pending-to-review completed bookings + review history. |
| `/safety` | Big SOS card, trusted contacts manager, check-in history, safety guidelines, emergency numbers, report history. |
| `/profile` | Avatar, public/private visibility toggle, personal info, verifications list. |

### 6.3 Companion app

| Route | Design |
|---|---|
| `/become-a-companion` | 4-step wizard: benefits → eligibility (18+, ID) → apply → verification handoff; progress tracker. |
| `/verification` | Status timeline (Not started → Submitted → Under review → Verified/Rejected), provider hosted-session launch, rejection reason + retry. |
| `/companion-dashboard` | KPI cards (earnings this week, upcoming bookings, response rate, rating), today's schedule, pending requests queue. |
| `/companion/bookings` | Request cards with Accept/Decline (SLA timer), confirmed list, status filters. |
| `/companion/availability` | Weekly calendar grid (click-drag slots), date overrides/blocked dates, breaks; existing bookings shown locked. |
| `/companion/earnings` | Earnings chart, balances (pending/available/withdrawn), transactions table, withdraw button → payout flow modal (KYC via Razorpay hosted), payout history with status timeline. |

### 6.4 Admin

| Route | Design |
|---|---|
| `/admin` | teal-950 sidebar; KPI row (users, active, verified, pending, bookings, revenue, commission, refunds, reports, disputes, risk accounts); charts (user growth, bookings, revenue, funnels — recharts); queue widgets (verifications, reports, flagged messages, payouts) with risk colors. |
| `/admin/users/*` | Searchable table; user drawer: profile, verification, bookings, reports, risk events, actions (verify/warn/suspend/ban/restore) with mandatory reason → confirm modal → audit entry. |
| Queues | Card-based triage with risk badge, evidence inline, action buttons; everything audited. |
| `/admin/settings` | Fee/commission/tax/cancellation inputs (number, paise-safe), policy version history. |

---

## 7. Responsive Rules

- **Mobile-first:** design at 375px first; bottom tabs and bottom-sheet filters; sticky
  bottom CTA bars; full-width buttons; cards single column; 44px touch targets everywhere.
- **Tablet (768):** 2-col grids; filters become collapsible top bar; chat two-pane optional.
- **Desktop (1024+):** sidebars, 3-col grids, sticky booking rail, hover micro-interactions,
  data tables; admin at 1280+.
- Never shrink desktop: mobile patterns (sheets, tabs) are purpose-built, not overflow-hidden.

## 8. Motion

- Duration 150–250ms, easing `cubic-bezier(0.22, 1, 0.36, 1)` (ease-out-quint).
- Use: card hover lift, heart pop, button press, toast slide, confirmation check-draw,
  skeleton shimmer, page fade 120ms.
- Don't: parallax on scroll-heavy pages, bouncing, decorative loops.
- `prefers-reduced-motion: reduce` disables all non-essential animation.

## 9. Accessibility (WCAG 2.1 AA target)

- Contrast: all text pairs ≥ 4.5:1 (verified in palette above); never color-only status
  (always icon + text).
- Keyboard: visible focus ring (teal, 2px + offset), tab order matches layout, Esc closes
  overlays, focus trap in modals/sheets, skip-to-content link.
- Forms: every input labeled; errors via `aria-live="polite"`; required fields marked.
- Semantic landmarks (`header/nav/main/aside/footer`), headings in order, icon buttons
  carry `aria-label`, live regions for chat/notifications/toasts.
- Touch: ≥44px targets, ≥8px gaps; charts have data tables alternative.

## 10. SEO

- Next.js metadata per public route, Open Graph cards (city/experience templates),
  JSON-LD `Product`/`AggregateRating` for companion profiles, `sitemap.xml`, `robots.txt`
  (disallow `/admin`, `/app/*`, account routes), noindex on private pages, semantic
  headings, Next/Image with priority LCP image.

---

*End of Phase 2. Awaiting approval before Phase 3 (backend implementation) & Phase 4 (frontend).*
