# Rentmate / Saath Agent Guide

## Working agreement

- This is a private npm workspace monorepo. Use Node.js 20 or newer and npm; do not introduce a second package manager.
- Proceed with routine repository inspection, edits, builds, tests, and local commands without asking the user to approve each step.
- Do not expose or invent secrets. Ask before destructive commands, irreversible data changes, production actions, or operations that require credentials or external services.
- Keep changes focused on the requested behavior. Preserve unrelated user changes and do not commit or create branches unless explicitly requested.
- Prefer existing helpers, shared schemas, service boundaries, and project patterns over new abstractions.

## Repository map

- `packages/shared` contains canonical enums, Zod schemas, money/pricing, availability, matching, moderation, risk, and domain tests. API and web code should consume it rather than redefining these contracts.
- `apps/api` is an ESM Express + TypeScript backend using Prisma, PostgreSQL, Redis, Socket.IO, and Vitest. Routes should remain thin; business rules belong in services or shared domain modules.
- `apps/web` is a Next.js 15 App Router frontend. Follow the existing components, Tailwind configuration, and design system.
- `infra/docker-compose.yml` provides local PostgreSQL and Redis services. `docs/ARCHITECTURE.md` describes system boundaries and data design; `docs/DESIGN_SYSTEM.md` describes the UI language; `docs/PHASE3-BACKEND.md` records backend completion details.

## Commands

Run from the repository root unless stated otherwise:

```bash
npm install
npm run build:shared
npm run typecheck
npm test
npm run db:setup
npm run dev
```

- `npm run dev` starts the API on port 4000. Start the web app separately with `cd apps/web && npm run dev` on port 3000.
- API-only checks: `npm run typecheck -w @saath/api`, `npm test -w @saath/api`, and `npm run build -w @saath/api`.
- Shared checks: `npm run build -w @saath/shared` and `npm test -w @saath/shared`.
- Web checks: `npm run typecheck -w @saath/web` and `npm run build -w @saath/web`.
- API integration tests require PostgreSQL and Redis plus the API environment configuration. Use `apps/api/.env.example` and `infra/docker-compose.yml`; never commit `.env` files.

## Domain invariants

- Treat `packages/shared` enums and schemas as canonical. The API re-validates all input even when the web client validates for UX.
- Store and calculate money as integer paise (`bigint` where appropriate); never use floating-point currency or hardcode platform fees.
- Booking availability must be checked transactionally and remains subject to the database exclusion constraint. Do not weaken overlap protection in route code.
- Payment state changes come only from verified, idempotent webhooks. Keep mock providers behind their existing interfaces.
- Protected routes require authentication, role checks, and resource ownership checks. Preserve stable API response envelopes and error codes.
- Moderation and risk scores are advisory workflows: flagged or high-risk content is routed for review or reversible restrictions, never an automatic ban.
- Verification is hosted by the IDV provider; document images must not be stored in this application.
- Preserve append-only wallet and audit behavior, and keep sensitive location data ephemeral and session-scoped.

## Implementation and review

- For backend changes, inspect the nearest route, service, shared schema, and relevant integration test before editing.
- For frontend changes, inspect the route's existing components and `docs/DESIGN_SYSTEM.md`; keep layouts responsive and accessible.
- Add or update focused tests for behavior changes. Run the narrowest relevant test first, then broaden to `npm test` or package typechecks as needed.
- Update documentation only when a workflow, contract, or setup command changes. Link to existing docs rather than copying their contents into this file.