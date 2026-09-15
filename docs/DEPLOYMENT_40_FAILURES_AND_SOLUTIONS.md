# 🛡️ SAATH (साथ) — 44 Deployment Failure Modes & Exact Solutions Matrix
### *Enterprise Production Readiness, Vercel/Render Diagnostics & Security Hardening*

> Canonical, step-by-step deployment settings (Vercel Root Directory, environment variables,
> build/install commands) live in [`docs/VERCEL_DEPLOY.md`](./VERCEL_DEPLOY.md). This document is
> the wider failure matrix.

---

## 📑 Category Index
1. **Monorepo & Build Pipeline (Failures 1 – 8)**
2. **Vercel & Static Generation (Failures 9 – 16)**
3. **Next.js 15 & React 19 Client/Server Boundaries (Failures 17 – 24)**
4. **Backend Express API & Container Hosts (Failures 25 – 32)**
5. **Database, Prisma ORM & Connection Pools (Failures 33 – 38)**
6. **Network, CORS, WebSockets & Security Headers (Failures 39 – 44)**

---

## Part 1: Monorepo & Workspace Build Pipeline

### 1. `Module not found: Can't resolve '@saath/shared'`
- **Root Cause**: Fresh CI clone doesn't compile packages in dependency order. `@saath/shared` is consumed before `tsc -p tsconfig.json` outputs `dist/`.
- **Solution Applied**: 
  1. Whitelisted `!packages/shared/dist/` in `.gitignore` so compiled artifacts are always tracked.
  2. Added `"transpilePackages": ["@saath/shared"]` in `apps/web/next.config.mjs`.
  3. Added `"prebuild": "npm --prefix ../.. run build:shared"` in `apps/web/package.json` so every `npm run build` recompiles the shared package first (no silent `|| true` fallback).

### 2. `npm warn allow-scripts ... esbuild postinstall`
- **Root Cause**: npm 11+ blocks dependency install scripts until that exact package version is approved, and warns on every install for `esbuild` (pulled in transitively by `tsx` and `vitest`). The warning is informational — it never fails a build.
- **Solution Applied**: `.npmrc` keeps `engine-strict=false`, `fund=false`, `audit=false` and adds `include=dev` (so `NODE_ENV=production` cannot strip the build toolchain). The root `package.json` approves the esbuild versions currently in the lockfile via `allowScripts`. `npm install-scripts ls` lists anything still unapproved. Do not blanket-approve `argon2` — its install script is a `node-gyp` build that needs a compiler.

### 3. Vercel Root Directory Misconfiguration
- **Root Cause**: The Next.js app lives in `apps/web`, but Vercel's Root Directory was the repository root, so Vercel looked for the app (and `.next`) in the wrong place. A repository-root `vercel.json` with `buildCommand` + `outputDirectory: "apps/web/.next"` does **not** fix this: overriding `outputDirectory` replaces Vercel's Next.js adapter with naive static hosting and the deployment fails looking for `routes-manifest.json`.
- **Solution Applied**: Root Directory is set to `apps/web` in the Vercel project settings (the only place that setting can live), and `apps/web/vercel.json` pins `framework: nextjs` + `buildCommand: npm run build`. The misleading repository-root `vercel.json` was deleted. Full recipe: `docs/VERCEL_DEPLOY.md`.

### 4. Node.js Version Mismatch (`engines` check failure)
- **Root Cause**: Cloud host defaulting to Node 18 or Node 22 while code expects Node 20+.
- **Solution Applied**: Explicitly set `"engines": { "node": ">=20" }` in root `package.json` and Node 20 in GitHub Actions `.github/workflows/ci.yml`.

### 5. Lockfile Drift (`ERR_PNPM_LOCKFILE_CONFIG_MISMATCH` or `npm ci` failure)
- **Root Cause**: `package-lock.json` modified locally without syncing workspace child packages.
- **Solution**: Always run `npm install` from the repository root, never inside child folders with isolated lockfiles.

### 6. Circular Workspace References
- **Root Cause**: `apps/web` referencing `@saath/api` directly instead of consuming contracts through `@saath/shared`.
- **Solution**: Enforced unidirectional imports: `apps/web -> @saath/shared` and `apps/api -> @saath/shared`.

### 7. TypeScript TSBuildInfo Stale Cache
- **Root Cause**: Cached `*.tsbuildinfo` in CI assuming files didn't change.
- **Solution**: `.gitignore` ignores `*.tsbuildinfo` and CI runs clean builds.

### 8. Submodule or Git LFS Missing in CI
- **Root Cause**: Git repositories referencing assets via Git LFS or submodules failing checkout without `--recurse-submodules`.
- **Solution**: Self-contained repository; all SVG/assets are packaged locally within `apps/web/public`.

---

## Part 2: Vercel & Static Generation

### 9. Dynamic Route Static Prerender Error (`Page /booking/[id] couldn't be rendered statically`)
- **Root Cause**: Next.js App Router trying to prerender `params.id` without `generateStaticParams` when `useSearchParams` or dynamic params are read synchronously.
- **Solution**: Marked dynamic routes as dynamic or wrapped client params inside `React.Suspense`.

### 10. `window is not defined` during SSR
- **Root Cause**: Accessing `window`, `document`, or `localStorage` at the top level of a component before mounting.
- **Solution**: Guarded browser APIs inside `useEffect(() => { ... }, [])` or checked `typeof window !== 'undefined'`.

### 11. Hydration Mismatch (`Text content does not match server-rendered HTML`)
- **Root Cause**: Rendering dates, timestamps (`new Date()`), or random numbers (`Math.random()`) during server render vs client render.
- **Solution**: Render timestamps inside `useEffect` or use `suppressHydrationWarning` for localized date displays.

### 12. Vercel Serverless Function 50MB Size Limit Exceeded
- **Root Cause**: Bundling heavy server modules into Next.js edge/serverless functions.
- **Solution**: Keep heavy backend tasks (Prisma, Socket.IO) in `apps/api` hosted on Render/Railway, keeping `apps/web` lightweight.

### 13. Vercel Serverless Timeout (10s on Free Hobby Tier)
- **Root Cause**: Calling slow external APIs or long-running database queries directly inside Next.js Server Actions.
- **Solution**: Next.js client delegates long-running tasks asynchronously to `apps/api` with optimistic UI updates.

### 14. Missing Environment Variables at Build Time
- **Root Cause**: Client components reading `process.env.API_URL` without the `NEXT_PUBLIC_` prefix, resulting in `undefined`.
- **Solution**: Used `NEXT_PUBLIC_API_BASE` for all client-accessible environment variables.

### 15. Output Tracing File Missing (`Cannot find module .next/standalone/...`)
- **Root Cause**: `output: 'standalone'` enabled on Vercel without proper monorepo tracing root.
- **Solution**: Vercel natively handles Next.js builds; keep `output` default on Vercel and use `standalone` only in Docker.

### 16. Static Asset 404 (`manifest.json` or PWA icons missing)
- **Root Cause**: Placing icons outside `apps/web/public/`.
- **Solution**: All PWA manifest files and icons reside in `apps/web/public/` with root-relative paths (`/manifest.json`).

---

## Part 3: Next.js 15 & React 19 Client/Server Boundaries

### 17. `'use client'` Directive Missing on Interactive Components
- **Root Cause**: Using `useState`, `useEffect`, `useContext`, or `onClick` inside a Server Component.
- **Solution**: Added `'use client'` at line 1 of interactive components.

### 18. Server Actions Import inside Client Components
- **Root Cause**: Importing server-only Node.js libraries (fs, crypto, pg) into client bundles.
- **Solution**: Clean separation: client components only import UI utilities and typed schemas.

### 19. Async Request Params Breaking Change in Next.js 15
- **Root Cause**: Next.js 15 treats `params` and `searchParams` in page props as `Promise<{ id: string }>`.
- **Solution**: Await `params` in Page components or unwrap them before consumption.

### 20. React 19 Ref as Prop vs ForwardRef
- **Root Cause**: In React 19 `forwardRef` is deprecated; `ref` is a standard prop. Older libraries may break.
- **Solution**: TypeScript 5.6+ with `@types/react@19` ensures compatibility.

### 21. Next/Image Unconfigured Remote Host
- **Root Cause**: `<Image src="https://example.com/photo.jpg" />` crashing build without `remotePatterns`.
- **Solution**: Local data URIs and avatars used; `remotePatterns` pre-configured in `next.config.mjs`.

### 22. CSS Tailwind Class Purging in Monorepo
- **Root Cause**: Tailwind not scanning components inside `packages/shared` or monorepo subfolders.
- **Solution**: `apps/web/tailwind.config.ts` content array includes `../../packages/shared/**/*.{ts,tsx}` and all `./src/**/*.{ts,tsx}`.

### 23. Stale Route Cache in App Router
- **Root Cause**: Next.js aggressively caching `fetch` requests indefinitely.
- **Solution**: Specified `{ cache: 'no-store' }` or revalidation tags on dynamic user queries.

### 24. PWA Service Worker Registration Failure over HTTP
- **Root Cause**: Service Workers only install on `https://` (or `localhost`).
- **Solution**: Vercel forces HTTPS by default, enabling instant PWA registration.

---

## Part 4: Backend Express API & Container Hosts (Render/Railway)

### 25. Express Port Binding on Cloud Containers (`EADDRINUSE` or Port Timeout)
- **Root Cause**: Hardcoding `app.listen(4000)` instead of `process.env.PORT`.
- **Solution**: Express binds to `process.env.PORT || 4000` and host `0.0.0.0`.

### 26. Render Free Tier Web Service Cold Start (50s Delay)
- **Root Cause**: Inactivity sleep on Render free tier.
- **Solution**: Added lightweight health check endpoint `GET /api/v1/health` for uptime pings (e.g. UptimeRobot or Cron).

### 27. Missing Start Script in Backend Monorepo
- **Root Cause**: Cloud hosts running `npm start` in root without workspace targeting.
- **Solution**: Added explicit start scripts: `"start:api": "npm run start -w @saath/api"`.

### 28. Helmet / Security Middleware Callable Type Discrepancy
- **Root Cause**: CJS/ESM interop differences between local Windows Node and Linux Docker runners for `helmet`.
- **Solution**: Resolved in commit `b8642d6` with safe ESM default import syntax.

### 29. Socket.IO Sticky Sessions on Scaled Instances
- **Root Cause**: Multiple backend replicas causing WebSocket handshake failures without Redis adapter.
- **Solution**: Socket.IO configured with Redis Adapter (`@socket.io/redis-adapter`) for cross-node pub/sub.

### 30. Unhandled Promise Rejections Crashing Node Process
- **Root Cause**: Uncaught async errors in Express route handlers terminating the container.
- **Solution**: Centralized `asyncHandler` wrapper and global `unhandledRejection` listener.

### 31. Memory Leak via Unbounded Event Listeners
- **Root Cause**: Registering socket event listeners inside request loops without cleanup.
- **Solution**: Sockets registered strictly in connection lifecycle handlers with disconnect cleanup.

### 32. File Upload Storage Loss on Ephemeral Containers
- **Root Cause**: Writing user avatars or verification documents to local disk (`/uploads`).
- **Solution**: Invariant adhered to: Saathi uses third-party IDV redirects; no raw document images stored on ephemeral filesystem.

---

## Part 5: Database, Prisma ORM & Connection Pools

### 33. Prisma Engine Architecture Mismatch in Docker / CI
- **Root Cause**: Prisma binary generated for Windows (`windows`) failing when deployed to Linux (`debian-openssl-3.0.x`).
- **Solution**: Configured `binaryTargets = ["native", "debian-openssl-3.0.x", "rhel-openssl-3.0.x"]` in `schema.prisma`.

### 34. Database Connection Pool Exhaustion (`Max client connections reached`)
- **Root Cause**: Creating `new PrismaClient()` on every request or serverless invocation.
- **Solution**: Singleton `PrismaClient` pattern with connection pooling parameters (`?connection_limit=10&pool_timeout=20`).

### 35. Cloud PostgreSQL SSL Requirement Failure (`no pg_hba.conf entry for host ... SSL off`)
- **Root Cause**: Supabase/Neon/AWS RDS requiring SSL connections (`sslmode=require`).
- **Solution**: Production `DATABASE_URL` configured with `?sslmode=require`.

### 36. Migration Lock Deadlocks (`Database migration failed: Lock wait timeout`)
- **Root Cause**: Running `prisma migrate deploy` concurrently across multiple auto-scaling containers.
- **Solution**: Migration decoupled into a single pre-deploy release command (`npm run db:migrate`).

### 37. Database Exclusion Constraint Violation on Booking Overlap
- **Root Cause**: Race conditions when two users book the same companion at the same time slot.
- **Solution**: Database-level PostgreSQL GiST exclusion constraint (`tsrange` overlap prevention) combined with transactional availability verification.

### 38. Integer Currency Overflow
- **Root Cause**: JavaScript `Number.MAX_SAFE_INTEGER` precision loss on financial transactions.
- **Solution**: All paise arithmetic performed in native `bigint` with exact zero-float guarantees.

---

## Part 6: Network, CORS, WebSockets & Security Headers

### 39. Cross-Origin Resource Sharing (CORS) Blocked
- **Root Cause**: Next.js on `https://saathi.vercel.app` calling API on `https://api.saath.app` without CORS headers.
- **Solution**: Express API CORS middleware allows trusted origin patterns, credentials, and pre-flight `OPTIONS`.

### 40. WebSocket Connection Failed (`Cross-Origin WebSocket blocked`)
- **Root Cause**: Socket.IO origin whitelist rejecting Vercel preview URLs.
- **Solution**: Dynamic origin regex matching `*.vercel.app` and custom production domains.

### 41. Mixed Content Error (`HTTP API called from HTTPS Frontend`)
- **Root Cause**: Deploying frontend on HTTPS (Vercel) while backend API URL is HTTP (`http://api...`).
- **Solution**: All external API endpoints enforced HTTPS (`https://...`) and WSS (`wss://...`).

### 42. Clickjacking Vulnerability
- **Root Cause**: Missing `X-Frame-Options` allowing malicious sites to iframe the platform.
- **Solution Applied**: Injected `X-Frame-Options: SAMEORIGIN` in `next.config.mjs` and Vercel headers.

### 43. MIME-Type Sniffing Attacks
- **Root Cause**: Browsers executing non-script files as scripts when `Content-Type` is spoofed.
- **Solution Applied**: Injected `X-Content-Type-Options: nosniff` across all routes.

### 44. Man-in-the-Middle (MitM) & Insecure HTTP Downgrade
- **Root Cause**: Users accessing site over unencrypted HTTP.
- **Solution Applied**: Configured `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload` (HSTS).
