# 🚀 Deploying Saath to Vercel (web app) — exact settings & troubleshooting

This repository is an npm-workspaces monorepo. Vercel only hosts the **Next.js web app**
(`apps/web`). The Express API (`apps/api`) needs long-lived processes (Socket.IO, Prisma,
Redis) and must run on a container host — Render, Railway, Fly, or AWS ECS — not on Vercel.

---

## 1. Vercel project settings (one-time)

These live in **Vercel → Project → Settings** and cannot be expressed in `vercel.json`:

| Setting | Value | Why |
| --- | --- | --- |
| **Root Directory** | `apps/web` | This is the single most important setting. It is what makes Vercel treat the deployment as a Next.js project. Pointing it at the repo root makes Vercel look for `.next` at the root and fail. |
| **Framework Preset** | `Next.js` (auto-detected from `apps/web/package.json`) | Uses Vercel's first-class Next.js adapter (SSR, ISR, image optimisation). |
| **Build Command** | default, or `npm run build` | `apps/web/vercel.json` pins `npm run build` so the `prebuild` hook (which compiles `@saath/shared`) always runs. |
| **Output Directory** | *leave empty* | Never set this to `apps/web/.next`; overriding it replaces the Next.js adapter with naive static hosting and breaks build-time asset manifests. |
| **Install Command** | default (`npm install`) | npm resolves the workspace root from the repo-root `package-lock.json` and installs into the repo-root `node_modules`. |
| **Include source files outside of the Root Directory in the Build Step** | **ON** (default for new projects) | The build reaches `../../packages/shared` and the hoisted workspace `node_modules`. |
| **Node.js Version** | 20.x, 22.x, or 24.x | `engines.node` is `>=20`. |

Environment variables (add to **Production** *and* **Preview**):

| Variable | Example | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_API_BASE` | `https://saath-api.onrender.com/api/v1` | **Build-time** value — it is inlined into the browser bundle. Changing it requires a redeploy. Without it the deployed site calls `http://localhost:4000/api/v1` and every request fails (the build prints a `[saath] NEXT_PUBLIC_API_BASE is not set` warning). |

Nothing else is required: `.npmrc`, `package.json` and `apps/web/vercel.json` in this repository
already contain every setting the build needs.

**How to confirm the Root Directory is right** — in the deployment log you should see:

```
Installing dependencies...
added 170 packages in 8s        ← the apps/web dependency subtree (NOT ~336)
...
Running "npm run build"          ← sees @saath/web@0.1.1 prebuild + next build
```

If the install reports ~336 packages (or the build runs at the repository root), the Root
Directory is still the repo root — fix it before chasing anything else.

---

## 2. What the Vercel build actually does

1. **Install** — Vercel detects the npm workspace root from the repo-root `package-lock.json`
   and installs the `@saath/web` dependency subtree into the repo-root `node_modules`
   (≈170 packages, devDependencies included). `node_modules/@saath/shared` is a symlink to
   `packages/shared`.
2. **`npm run build`** inside `apps/web`:
   - `prebuild` → `npm --prefix ../.. run build:shared` → `tsc` emits `packages/shared/dist`
     (the compiled shared package is also committed, so even a bare `next build` resolves it).
   - `next build` compiles the App Router app with `transpilePackages: ['@saath/shared']`.
3. Vercel deploys `.next` through the Next.js adapter and serves it from the edge.

Reproduce the exact Vercel steps locally:

```bash
# what Vercel's install does (run from apps/web)
cd apps/web && npm install

# what Vercel's build does
rm -rf ../../packages/shared/dist   # prove the prebuild really rebuilds it
npm run build
```

---

## 3. About the `npm warn allow-scripts … esbuild postinstall` lines

They are **not build failures** — npm 11+ blocks install scripts until a package version is
explicitly approved, and it warns while continuing:

```
npm warn allow-scripts 2 packages have install scripts not yet covered by allowScripts:
npm warn allow-scripts   esbuild@0.28.2 (postinstall: node install.js)
npm warn allow-scripts   esbuild@0.21.5 (postinstall: node install.js)
```

`esbuild` (pulled in transitively via `tsx` and `vitest`) ships its platform binary in the
`@esbuild/*` optional packages, so a blocked postinstall is harmless. The two versions currently
in the lockfile are approved in the root `package.json`:

```json
"allowScripts": {
  "esbuild@0.21.5": true,
  "esbuild@0.28.2": true
}
```

If a dependency bump changes the esbuild version, npm warns again for that new version. To
silence it (and keep the log trustworthy):

```bash
npm install-scripts approve esbuild@<version>
npm install-scripts ls            # list anything still unapproved
```

Do **not** approve `argon2` blindly: its install script is a `node-gyp` build that needs a
compiler toolchain; it ships prebuilt binaries, so leaving the script blocked is safer.

---

## 4. Troubleshooting: errors seen on this repo

| Error in the Vercel log | Cause | Fix |
| --- | --- | --- |
| `Module not found: Can't resolve '@saath/shared'` | `packages/shared/dist` was not built/tracked, or "Include source files outside of the Root Directory" is off. | Keep the `apps/web` `prebuild` hook, keep `packages/shared/dist` tracked (`.gitignore` whitelists it), and enable the include-source setting. |
| `The file "/vercel/path0/.next/routes-manifest.json" couldn't be found` | Root Directory is the repo root but a `vercel.json` sets `outputDirectory: apps/web/.next` + a custom `buildCommand`, overriding the Next.js adapter. | Set Root Directory to `apps/web` and never add `outputDirectory`/`buildCommand` overrides at the repo root. (A repo-root `vercel.json` was removed for exactly this reason.) |
| `sh: 1: tsc: not found` / `next: not found` | devDependencies were skipped (e.g. `NODE_ENV=production`). | `.npmrc` sets `include=dev`; also make sure the Install Command is not overridden. |
| Build succeeds but the deployed site reports network errors and calls `localhost:4000` | `NEXT_PUBLIC_API_BASE` not set for that environment. | Add it in Project → Settings → Environment Variables and redeploy (build-time value). |
| The failed deployment references an old commit (e.g. `bd3d020`) | That deployment predates the deployment fixes (`d2cbe03` onwards). | Redeploy the latest `main`; the old log is stale. |

---

## 5. API deployment (reference)

- Build: `npm run build:api` (root) → `tsc` output in `apps/api/dist`.
- Start: `npm run start:api` → `node dist/server.js` (must bind `0.0.0.0`).
- Required env: `DATABASE_URL`, `REDIS_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, razorpay keys,
  `CORS_ORIGINS`/origin allow-list including the Vercel production and preview domains.
- Deploy/migrate: `npm run db:migrate` (`prisma migrate deploy`), then `npm run db:seed` if needed.
