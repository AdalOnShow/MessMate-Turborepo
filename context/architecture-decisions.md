# MessMate - Architecture Decision Records (ADR)

## Purpose

This document records important architectural and business decisions made during
the development of MessMate.

Every major decision must be documented here.

Before changing any core architecture, database structure, accounting logic, or
business workflow, review this document first.

---

# ADR-001: Monorepo Architecture

## Status

Accepted

## Decision

MessMate will use a Turborepo-based monorepo architecture.

Structure:

```text id="z8p5fz"
apps/
  web/
  api/

packages/
  database/
  shared-types/
  shared-utils/
  validation/
  constants/
```

## Reason

- Shared code reuse
- Future mobile app support
- Better maintainability
- Scalable architecture

---

# ADR-002: Next.js + NestJS Architecture

## Status

Accepted

## Decision

Frontend and backend remain separate applications.

```text id="r1q2yb"
Next.js
    ↓
REST API
    ↓
NestJS
    ↓
PostgreSQL
```

## Reason

- Mobile-ready architecture
- Better separation of concerns
- Easier scaling
- Future SaaS support

---

# ADR-003: One Active Mess Per User

## Status

Accepted

## Decision

A user may only belong to one active mess at a time.

## Enforcement

Business validation only.

Database structure remains flexible.

## Reason

- Simpler user experience
- Easier accounting logic
- Future expansion remains possible

---

# ADR-004: Maximum Two Managers

## Status

Accepted

## Decision

Each mess can have a maximum of two managers.

## Rules

- Both managers have identical permissions.
- No hierarchy exists.
- No owner role inside a mess.

## Reason

- Operational simplicity
- Reduced permission complexity

---

# ADR-005: Dynamic Meal Types

## Status

Accepted

## Decision

Meal types are configurable.

Examples:

```text id="h2z3vy"
Breakfast
Lunch
Dinner
Sehri
Iftar
Brunch
```

## Reason

- Future flexibility
- Ramadan support
- No schema changes required

---

# ADR-006: Manual Month Lifecycle

## Status

Accepted

## Decision

Months are manually controlled by managers.

System does not automatically create or close months.

## Reason

- Matches real-world mess operations
- Provides manager control

---

# ADR-007: Month Archiving Strategy

## Status

Accepted

## Decision

When a new month starts:

```text id="n9w4tq"
Current Month
↓
Archived
↓
New Month Created
```

Previous months become historical records.

## Reason

- Historical accuracy
- Accounting integrity

---

# ADR-008: Balance Carry Forward

## Status

Accepted

## Decision

Only member balances are carried forward.

Nothing else is carried forward.

## Positive Balance

Converted into deposit.

Example:

```text id="zj9yga"
+500
↓
Deposit
```

## Negative Balance

Converted into individual expense.

Example:

```text id="9hkt8u"
-200
↓
Previous Month Due
```

## Reason

- Simplifies accounting
- Preserves balance history

## Implementation (Nov 2026)

Carries are stored as `carry_forward_balances` rows, not as real deposit or
expense rows. The maths treats `PREVIOUS_BALANCE` as a deposit and
`PREVIOUS_DUE` as an individual cost (`apps/api/src/months/month-summary.ts`).
The UI shows carried amounts in their own "Carried in" column, so they are not
confused with the month's own individual expenses. When starting a month, the
manager can switch carry forward off or exclude members who settled in cash.
Members removed before the close keep their summary but are not carried.
Close, summaries, the new month, carries and logs run in one transaction.

---

# ADR-009: Historical Data Preservation

## Status

Accepted

## Decision

Historical accounting data must never be deleted.

Includes:

- Meals
- Expenses
- Deposits
- Month Summaries
- Activity Logs

## Reason

- Accounting transparency
- Auditability

---

# ADR-010: Soft Delete Strategy

## Status

Accepted

## Decision

Major entities use soft delete.

Implementation:

```text id="xyh7zh"
deleted_at
```

## Reason

- Data recovery
- Historical preservation

---

# ADR-011: Expense Allocation Locking

## Status

Accepted

## Decision

Shared expense allocations become immutable after creation.

Example:

```text id="zwr4y3"
Internet Bill
1000

Selected Members:
Adal
Rahim
Fahad
```

Future membership changes do not affect the calculation.

## Reason

- Historical accuracy
- Accounting consistency

## Amendment (Nov 2026)

Membership changes never touch existing allocations. A manager editing an
expense of the **active** month replaces its allocations in the same
transaction, and the change is logged. Expenses of closed months cannot be
edited.

---

# ADR-012: Bazaar Approval Workflow

## Status

Accepted

## Decision

Bazaar expenses require approval.

Flow:

```text id="1w8y0v"
Member
↓
Submit Bazaar
↓
Manager Review
↓
Approve / Reject
```

Approved submissions automatically create expenses.

## Reason

- Expense validation
- Prevent unauthorized accounting entries

---

# ADR-013: Activity Logging Requirement

## Status

Accepted

## Decision

Every accounting action must generate an activity log.

Examples:

- Meal Added
- Meal Updated
- Expense Added
- Expense Updated
- Deposit Added
- Deposit Updated
- Member Added
- Member Removed

## Reason

- Traceability
- Accountability

## Amendment (Nov 2026)

Logs are written in the same `prisma.$transaction` as the change they
describe. See ADR-028 for volume and retention: one row per meal-day, and
12 months kept.

---

# ADR-014: Manager-Created Accounts

## Status

Accepted

## Decision

Managers may create accounts for members.

Process:

```text id="z0v6vk"
Manager
↓
Create User
↓
Temporary Password
↓
Member Setup
↓
manager_created = false
```

## Reason

- Easier onboarding
- Less friction for mess members

## Amendment (Nov 2026)

The manager chooses the initial password, so they know it. Such accounts get
`must_change_password = true`, and the dashboard shows a "Set your own
password" notice linking to Profile until the member changes it
(`PATCH /users/me/password` clears the flag).

---

# ADR-015: Join Verification Code System

## Status

Accepted

## Decision

Existing users join through a verification code workflow.

Implementation:

```text id="0sxf5r"
Redis
```

Code Length:

```text id="n4u5ja"
6 Digits
```

## Reason

- Prevent incorrect member assignment
- Verify identity

---

# ADR-016: Accounting First Architecture

## Status

Accepted

## Decision

The system is designed around accounting, not meals.

Priority:

```text id="g6m57q"
Accounting
↓
Expenses
↓
Deposits
↓
Balances
↓
Meals
```

## Reason

Meals exist to support accounting.

Accounting is the primary business domain.

---

# ADR-017: Shared Packages Policy

## Status

Accepted

## Decision

Shared logic must be placed inside packages.

Never duplicate logic between apps.

Shared packages:

```text id="g36uv2"
database
shared-types
shared-utils
validation
constants
```

## Reason

- Reusability
- Maintainability
- Mobile app compatibility

---

# ADR-018: Future Chat Support

## Status

Planned

## Decision

Future versions will support:

```text id="nkbwwy"
Mess Group Chat
```

Only group chat is planned.

Private chat is not currently planned.

---

# ADR-019: Future SaaS Support

## Status

Planned

## Decision

Architecture must remain SaaS-compatible.

Future support:

- Subscriptions
- Billing
- Super Admin Dashboard
- Usage Limits

## Reason

Avoid future rewrites.

---

# ADR-020: Documentation Driven Development

## Status

Accepted

## Decision

Code must follow documentation.

Priority:

```text
technical-flow.md
database-schema.md
features.md
process-tracker.md
design.md
```

Documentation must be updated whenever architecture changes.

## Reason

- Consistency
- AI Agent Reliability
- Long-term Maintainability

---

# ADR-021: JSONB Based Meal Storage

## Status

Accepted

## Decision

Daily meal selections are stored inside a JSONB column on `meal_entries`.

Store the calculated sum in a separate `total_meal` column.

Remove the `meal_entry_items` table entirely.

## Reason

- Simpler schema with fewer joins
- Matches the small, bounded set of meal types per mess
- Improves Prisma query ergonomics and developer experience
- Sufficient for Messenger, and reduces write/update overhead

## Consequences

- Application code must enforce that JSONB keys match active `meal_types` for
  the mess
- Reporting and filtering logic reads from a structured JSONB column instead of
  a relational child table

---

# ADR-022: JSONB Based Bazaar Item Storage

## Status

Accepted

## Decision

Bazaar item lists are stored inside a JSONB column on `bazaar_submissions`.

Store the calculated sum in a separate `total_amount` column.

Remove the `bazaar_items` table entirely.

## Reason

- Simpler schema with fewer joins
- Removes unnecessary item-level querying for MVP
- Improves Prisma query ergonomics and NestJS DTO design
- Lower maintenance cost

## Consequences

- Application code must enforce that `total_amount` equals the sum of line
  amounts in `items`
- Reporting remains fast thanks to the denormalized `total_amount`
- Cannot query individual bazaar line items without reading the JSONB payload

---

# ADR-023: Timestamp-Based Membership Lifecycle

## Status

Accepted

## Decision

Remove redundant membership tracking fields `status`, `joined_month_id`, and
`removed_month_id` from `mess_members`.

Membership state is now determined purely from timestamps:

- Active: `removed_at IS NULL`
- Removed: `removed_at IS NOT NULL`

Month participation eligibility:

```sql
SELECT *
FROM mess_members
WHERE joined_at <= month_end
  AND (
    removed_at IS NULL
    OR removed_at >= month_start
  )
```

Remove the `MemberStatus` enum entirely.

## Reason

- Simpler schema with fewer updates
- Eliminates synchronization risks between status fields and timestamps
- Cleaner and more reliable membership lifecycle
- Easier reporting and eligibility checks

## Consequences

- Application code must use timestamp-based checks instead of enum/status fields
- All membership history is preserved through `joined_at` and `removed_at`
- Member month eligibility query must be used for month summary generation

---

# ADR-024: OAuth Account Linking Policy

## Status

Accepted

## Decision

OAuth providers are never automatically linked during login.

Account linking must occur from an authenticated settings page.

## Reason

- Prevent accidental account linking
- Improve user control
- Simplify future OAuth provider support
- Reduce account takeover risk

---

# ADR-025: Device Sessions With Rotating Refresh Tokens

## Status

Accepted (Nov 2026)

## Decision

- Each sign-in creates a `user_sessions` row. Tokens are httpOnly cookies.
- Access tokens last 7 days and carry the session id (`sid`). `JwtStrategy`
  checks the session on every request, so logout revokes a session at once
  even though the token itself is long-lived.
- Refresh tokens rotate on every refresh. Each one carries a random `jti`, and
  only SHA-256 hashes are stored. The session expiry slides 30 days ahead on
  each refresh.
- A token that was just replaced is still accepted for 2 minutes and returns
  an access token only, so two tabs refreshing together don't sign the user
  out.

## Reason

People open a mess app a few times a week. Hourly expiry caused needless
refresh traffic and occasional sign-outs. Server-side session checks keep
revocation immediate.

## Consequences

One session lookup per authenticated request. A stolen access token works
until its session is revoked, not until it expires.

---

# ADR-026: Redis Read-Through Cache for Computed Mess Data

## Status

Accepted (Nov 2026)

## Decision

`CacheService` (`apps/api/src/common/cache/`) caches computed results per mess
in Redis, in two buckets:

- `live`: anything derived from the active month (active month, calculations,
  dashboards, summaries, activity). Every write under `/:messId/...` clears
  it.
- `closed`: reports of closed months. Only changes to people (names, avatars,
  membership) clear it.

`CacheInvalidationInterceptor` clears the bucket after every successful
non-GET request, **before** the response is sent, so the client's next read
never sees old numbers. Entries carry a version counter, so a result computed
during a write is never served. The cache fails open: without `REDIS_URL`, or
when Redis is slow (400 ms command timeout) or down, the loader just runs
against the database.

## Reason

Dashboards and summaries aggregate a whole month on every load. Neon
round trips from Vercel functions made them slow.

## Consequences

New endpoints that compute month data should use `cache.remember(...)`. New
write routes must include `:messId`, or rely on the per-user fallback that
clears every mess the user belongs to.

---

# ADR-027: Prerendered Dashboard, Client Reads Through a GET Bridge

## Status

Accepted (Nov 2026)

## Decision

- `app/(app)/` (all of `/dashboard`) is a separate root layout, prerendered as
  static pages. It never calls `cookies()`, `headers()` or `next-intl/server`.
  Language is chosen in the browser (`ClientIntlProvider`).
- Page data loads in the browser through TanStack Query. Reads go through
  `GET /api/[...path]` (`app/api/[...path]/route.ts`), which forwards to the
  Nest API with the httpOnly access token and returns an `ActionResult`.
  Next.js runs server actions one at a time, so reads made that way waited in
  a queue. Writes still use server actions.
- Every successful mutation invalidates all queries. Queries behind the
  dashboard home screen are refetched even when they are not on screen, so
  "Go to dashboard" after a save shows the new numbers at once.
- The last loaded data is kept in `localStorage` per user for 24 h
  (`lib/offline-cache.ts`), so the installed app opens straight to the
  last-known screen. It is wiped on logout.
- Moving between the two root layouts (sign-in to dashboard, logout) uses a
  full page load (`window.location`), not `router.push`.

## Reason

Dashboard navigation needs no server round trip, and a cold function no longer
blocks every page change.

## Consequences

`next build` must keep showing `○` (static) for `/dashboard/*`. Server-only
APIs are not allowed under `app/(app)/`.

---

# ADR-028: Activity Log Volume and Retention

## Status

Accepted (Nov 2026). Amends ADR-013.

## Decision

- A meal save writes one row per day (`entity_type: 'meal_day'`, member and
  meal counts in `details`), not one row per member.
- Activity older than 12 months (`ACTIVITY_RETENTION_MONTHS`) is deleted for
  a mess when that mess opens a new month. No scheduled job is needed.
- Deleted expenses keep a snapshot in `details`.

## Reason

`activity_logs` was the fastest-growing table. Closed months keep their full
numbers in `member_month_summaries`, so old activity isn't needed for the
accounts.

---

# ADR-029: Single Migration Baseline

## Status

Accepted (18 Nov 2026)

## Decision

Before launch, all migrations were squashed into one baseline
(`20261119000000_version_1`) and the production database was reset. From now
on migrations are only ever added on top of the baseline. Never squash again
once real users exist.

## Reason

There were no real users yet, and eight migrations of early iteration made
fresh setups slow and error-prone.

---

# ADR Template

Use this template for future decisions:

```md id="m6g8ch"
# ADR-XXX: Decision Title

## Status

Proposed | Accepted | Rejected | Planned

## Decision

Describe the decision.

## Reason

Explain why this decision was made.

## Consequences

List expected trade-offs.
```
