# 🐛 Bugs Found & Self-Healed Log

### Summary of Triage & Resolutions

| Bug ID | Severity | Area | Root Cause | Fix Applied | Verification Status |
|---|---|---|---|---|---|
| **BUG-001** | **P0** | CI/Build (`apps/api`) | Linux NodeNext ESM resolution treated `helmet` import as non-callable namespace object (`TS2349`). | Implemented safe callable fallback wrapper `const helmetMiddleware = (helmet as any).default \|\| (helmet as any)`. | Verified: `npm run build -w @saath/api` exits 0. |
| **BUG-002** | **P0** | Monorepo CI | Missing root build pipeline meant `@saath/shared` was not compiled before `apps/api` or `apps/web` build triggered in CI. | Added `prebuild` hooks in `apps/api/package.json` and root `"build"` command in `package.json`. | Verified: Clean monorepo build passes without missing module errors. |
| **BUG-003** | **P1** | Strict Typecheck (`apps/api`) | `TS7006` implicit any errors in `risk.service.ts` (`e` parameter) and `wallet.service.ts` (`tx` parameter). | Explicitly typed `(e: { type: string })` and `(tx: Prisma.TransactionClient)`. | Verified: `tsc -p tsconfig.json --noEmit` exits 0. |
| **BUG-004** | **P1** | Web UI / React | Browser extensions injecting attributes (`data-neoncur-extension`) before client hydration triggered Next.js hydration mismatch errors. | Added `suppressHydrationWarning` to `<html>` and `<body>` in `apps/web/src/app/layout.tsx`. | Verified: Zero hydration console errors in browser. |
| **BUG-005** | **P2** | Web UX / Accessibility | Sub-12px fixed font sizes (`text-[11px]`, `text-[13px]`) rendered text uncomfortably small on mobile viewports. | Elevated root font size to `17.5px` in `globals.css` and upgraded card/form typography to standard `text-sm` / `text-base`. | Verified: Improved readability and WCAG compliance. |

---

## Detailed Bug Reports

### 1. BUG-001: Helmet Callable Type Error (`TS2349`)
- **Symptoms**: Vercel/Linux build error: `error TS2349: This expression is not callable. Type 'typeof import(...)' has no call signatures.`
- **Root Cause**: NodeNext module resolution under TypeScript 5.6 treats certain CommonJS dual-exports (like Helmet v8) as namespace modules rather than default callable functions.
- **Fix**: In [`apps/api/src/app.ts`](file:///c:/Users/ABHAY%20MAURAYA/Downloads/rentmate/apps/api/src/app.ts), created dual-fallback resolution for `helmet`, `cors`, and `cookieParser`.
- **Regression Check**: Built locally on Windows and verified Linux container compatibility.

### 2. BUG-002: Monorepo Dependency Build Sequencing
- **Symptoms**: `error TS2307: Cannot find module '@saath/shared' or its corresponding type declarations.`
- **Root Cause**: In monorepos, internal workspace packages (`@saath/shared`) must generate their `.d.ts` declarations prior to dependent apps invoking `tsc`.
- **Fix**: Added `"prebuild": "npm run build -w @saath/shared && prisma generate"` in `apps/api/package.json` and configured root `"build": "npm run build:shared && npm run build -w @saath/web"`.
- **Regression Check**: Executed clean builds from repository root.

### 3. BUG-003: Implicit Any Parameter Types (`TS7006`)
- **Symptoms**: Strict TypeScript builds failed on unannotated lambda parameters in transaction callbacks.
- **Root Cause**: Unannotated `(tx) => ...` inside `prisma.$transaction` and `(e) => e.type` inside `.map`.
- **Fix**: Explicitly annotated `(tx: Prisma.TransactionClient)` in `wallet.service.ts` and `(e: { type: string })` in `risk.service.ts`.
- **Regression Check**: `npm run typecheck -w @saath/api` passed with 0 errors.

### 4. BUG-004: Browser Extension Hydration Mismatches
- **Symptoms**: Red error overlay on initial page load complaining about server/client attribute mismatch (`data-neoncur-extension="1.2.0"`).
- **Root Cause**: Client-side browser extensions modified the DOM before React could hydrate the server-rendered HTML.
- **Fix**: Configured `suppressHydrationWarning` on `<html>` and `<body>` elements in `RootLayout`.
- **Regression Check**: Verified hot reload and browser inspection.

### 5. BUG-005: Mobile Accessibility & Small Font Legibility
- **Symptoms**: Legibility strain on high-DPI screens due to hardcoded 11px font sizes.
- **Root Cause**: Legacy fixed pixel classes (`text-[11px]`, `text-[13.5px]`).
- **Fix**: Scaled base HTML font size to `17.5px` and refactored UI components to use scalable `rem` tokens (`text-sm`, `text-base`).
- **Regression Check**: Verified across mobile and desktop viewports.
