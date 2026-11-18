# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

The imported `AGENTS.md` covers setup, architecture, conventions and ADRs. The notes below add what it leaves out.

## Commands

```bash
pnpm turbo build --filter=api            # API only (build @repo/database first if the schema changed)
pnpm turbo check-types --filter=web      # web typecheck = `next typegen && tsc --noEmit`
pnpm --filter web lint                   # eslint --max-warnings 0 (warnings fail CI)
pnpm format                              # prettier over the whole repo
```

API tests (Jest, `apps/api`): unit specs match `src/**/*.spec.ts`; e2e lives in `apps/api/test/`.

```bash
pnpm --filter api test                          # all unit specs
pnpm --filter api test -- meals.service         # single spec by path pattern
pnpm --filter api test -- -t "test name"        # single test by name
pnpm --filter api test:e2e
```

There is currently almost no test coverage; CI runs only build, lint and check-types.

`@repo/database` and `@repo/shared` are consumed from `dist/` at runtime, so after editing the Prisma schema or shared code, rebuild them (`pnpm turbo build --filter=@repo/database --filter=@repo/shared`) before the API sees the change.

## Backend (apps/api)

- **Two entry paths in `main.ts`:** local dev runs `bootstrap()` (port 4000); on Vercel (`VERCEL=1`) the default export lazily builds a Nest app on an Express adapter. Global pipes, filters and CORS are configured in **both** places; change both together.
- `CORS_ORIGIN` is required at boot and may be a comma-separated list.
- Env is loaded from the repo-root `.env` (`ConfigModule` `envFilePath: '../../.env'`).
- **Validation:** request bodies are typed `unknown` in controllers and validated with Zod schemas from `@repo/shared` (`schema.safeParse` + `formatZodError`), throwing `BadRequestException({ message: 'Validation failed', details })`. Route param UUIDs are checked manually. Follow this pattern, not class-validator DTOs.
- **Errors:** throw Nest `HttpException`s; `ApiExceptionFilter` turns everything into `{ success:false, message, statusCode, code, requestId, details? }`. Add an `ErrorCode` (from `@repo/shared`) when a client may branch on the rule: `throw new ConflictException({ message, code: ErrorCode.MONTH_ALREADY_CLOSED })`. Prisma errors are mapped automatically (P2002→409, P2025→404, DB unreachable→503); 5xx messages are never sent to clients and are logged as one-line JSON via `console.error` (Nest's logger is off in production). Every response carries `X-Request-Id`.
- **Guards:** routes use `@UseGuards(AuthGuard('jwt'))` at the controller level, then `MembershipGuard` (any active member of `:messId`) or `RolesGuard` + `@Roles('MANAGER')`. Both read `request.params.messId`, so routes needing them must include `:messId`. Membership checks filter `removed_at: null` and `deleted_at: null`.
- **Rate limiting:** a global `AppThrottlerGuard` limits each user to 120 requests/min; auth routes set stricter limits.
- **Activity logs:** services write `activity_logs` rows for state changes, inside the same `prisma.$transaction(tx => ...)` as the mutation when there is one. New mutating features should do the same. Keep the volume down: a meal save writes one row per day (`entity_type: 'meal_day'`, counts in `details`), not one per member. Rows older than 12 months are deleted for a mess whenever it opens a new month (`ACTIVITY_RETENTION_MONTHS` in `months.service.ts`).
- **Month close** (`months.service.ts` `closeMonth`/`generateCarryForward`) computes `member_month_summaries` and `carry_forward_balances` in one transaction (ADR-008). Meal-rate and expense math must not double-count SHARED expenses (see recent fix e837ba5).
- The API is deployed to Vercel via `apps/api/vercel.json`, which builds `@repo/database` and then `api`.

## Frontend (apps/web)

- **Server actions return `ActionResult<T>` and never throw for API failures** (`app/lib/action-result.ts`): in production Next.js would hide the error message. Hooks call `unwrap(action(...))` inside `queryFn`/`mutationFn` to turn a failure back into an `ActionError` that carries the real message. New actions and hooks must follow this.
- **User-facing errors:** don't render mutation errors inline. `query-client.ts` toasts every mutation failure (opt out with `meta: { errorToast: false }`) and shows `meta: { successMessage }` on success; `SESSION_EXPIRED` signs the user out globally. For failed loads render `QueryErrorState` / `QueriesErrorState` (`app/components/feedback/`), never an empty state. Check `failedQueries(...)` **before** "no mess"/"no active month" branches, or a network blip looks like missing data and can expose destructive actions (e.g. Start Month, saving an empty meal grid). Inline errors are only for client-side field validation and the auth forms.
- `app/lib/api-client.ts` is server-only (reads cookies). On a 401 it calls `refreshAccessToken()` once and retries. It sends `X-Request-Id`, times out after 15s, and returns `json.data` from the API envelope.
- **Two root layouts.** `app/(public)/` (landing, signin, signup, install, guide) renders on the server in the `NEXT_LOCALE` cookie's language. `app/(app)/` (all of `/dashboard`) is prerendered as static pages so navigation needs no server round trip; its language is picked in the browser by `components/i18n/ClientIntlProvider.tsx`. Never call `cookies()`, `headers()` or `next-intl/server` anywhere under `app/(app)/` or its layout, or every dashboard page becomes dynamic again (check that `next build` still shows `○` for `/dashboard/*`). Unknown URLs use `app/global-not-found.tsx` (`experimental.globalNotFound`).
- Route protection lives in `apps/web/proxy.ts` (the Next 16 equivalent of middleware). It checks only whether the `access_token`/`refresh_token` cookies exist, and redirects between `/`, `/signin`, `/signup` and `/dashboard`.
- `app/components/ui/` contains a few shadcn-style primitives (button, popover, calendar, date-picker, select) built on Radix + CVA. Reuse them; don't add a shadcn dependency or generate new shadcn components.

## Project context docs

`context/` holds the design source of truth: `architecture-decisions.md` (ADRs), `database-schema.md`, `features.md`, `technical-flow.md`, `design.md`, and `process_tracker.md` (phase-by-phase feature checklist). Project-local agent skills are in `.agents/skills/`.
