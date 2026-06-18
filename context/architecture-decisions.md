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
