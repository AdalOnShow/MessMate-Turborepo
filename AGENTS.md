# MessMate — Agent Guide

## Quick Start

```bash
pnpm install                    # install all deps (uses shamefully-hoist=true)
pnpm turbo build --filter=[origin/main]  # build changed packages
pnpm turbo lint --filter=[origin/main]   # lint changed packages
pnpm turbo check-types --filter=[origin/main]  # typecheck changed packages
```

Dev servers (run in separate terminals):

```bash
pnpm turbo dev --filter=web     # Next.js on :3000
pnpm turbo dev --filter=api     # NestJS on :4000
```

## Architecture

Turborepo monorepo with pnpm workspaces.

```
apps/
  web/          Next.js 16 (App Router, Tailwind v4, Zustand, TanStack Query)
  api/          NestJS 11 (Prisma, Passport JWT, serverless-ready for Vercel)
packages/
  database/     Prisma schema + Neon serverless client (singleton via Proxy)
  shared/       DTOs, Zod schemas, TypeScript interfaces, ApiResponse type
```

## Key Conventions

### API Response Envelope

All API responses are wrapped in `{ success, message, data }` by `ApiResponseMiddleware`. Controllers that return raw objects get auto-wrapped. If a controller already returns the envelope shape, the middleware passes it through (via `isApiResponse` check).

Error responses: `{ success: false, message, statusCode, error, path, details? }` — handled by `ApiExceptionFilter`.

### RBAC Pattern

Manager-only endpoints use:

```typescript
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('MANAGER')
```

`RolesGuard` looks up `mess_members` by `messId` route param. The `:messId` param must be present in the route.

### Frontend Data Flow

Server actions (`apps/web/app/actions/*.ts`) call the API via `api-client.ts` (which reads `access_token` from cookies). React Query hooks (`apps/web/app/hooks/*.ts`) wrap server actions. Zustand (`app/store/`) holds client session state only.

### Database Client

`@repo/database` exports a lazy `prisma` proxy — do NOT import `PrismaClient` directly. Use:

```typescript
import { prisma } from "@repo/database";
```

The proxy initializes on first use via `DATABASE_URL` from env.

### Shared Package

`@repo/shared` exports DTOs, interfaces, Zod schemas, and `ApiResponse`/`isApiResponse`. Import from the package root:

```typescript
import { CreateMessDto, MessResponse } from "@repo/shared";
```

## Env Setup

Root `.env` is the source of truth for `DATABASE_URL`. Each app/package has its own `.env.example`. Key vars:

- `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` — random 64-char hex strings
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` — for OAuth
- `CORS_ORIGIN` — must match frontend URL (`http://localhost:3000` in dev)
- `CLOUDINARY_*` — for avatar uploads

## Database

PostgreSQL on Neon (serverless). Prisma 7.8 with Neon adapter. Migrations in `packages/database/prisma/migrations/`.

Run migrations:

```bash
cd packages/database && pnpm migrate    # prisma migrate dev
cd packages/database && pnpm generate  # prisma generate
```

**Known issue:** `meal_entry_items` table still exists in schema but ADR-021 says meals should use JSONB in `meal_entries.meals`. This table should be removed.

## Style Guide

- Dark theme primary. CSS variables in `globals.css` via Tailwind v4 `@theme`.
- Use `foreground`, `foreground-muted`, `primary`, `surface`, `surface-raised` etc. from the theme.
- Font: Plus Jakarta Sans (headings + body), Alkatra (Bengali accents).
- No shadcn/ui — custom Tailwind components only.
- Lucide React for icons.

## CI/CD

GitHub Actions on push/PR to main: `build → lint → check-types`. Uses Turborepo remote cache.

## Important ADRs

Read `context/architecture-decisions.md` before changing core logic. Key decisions:

- **ADR-003:** One active mess per user (business validation)
- **ADR-004:** Max 2 managers per mess, equal permissions
- **ADR-005:** Dynamic meal types (configurable per mess)
- **ADR-006:** Manual month lifecycle (managers control open/close)
- **ADR-008:** Balance carry forward — positive→deposit, negative→individual expense
- **ADR-010:** Soft delete via `deleted_at` on major entities
- **ADR-021:** Meals use JSONB in `meal_entries.meals` (not `meal_entry_items` table)
