# MessMate - Database Schema

## Database

PostgreSQL, managed through Prisma ORM.

This document is the single source of truth for all database structure. Any changes to tables, columns, enums, constraints, or indexes must be reflected here before implementation.

---

## Design Principles

- Soft deletes on every major entity.
- Murmur-friendly activity logging.
- Accounting month lifecycle.
- Balance carry-forward.
- No recalculation of historical data.
- Expansibility for SaaS, mobile, and notifications without schema redesign.
- Immutable audit trail for all accounting actions.

---

## Enums

### SystemRole

```text
ADMIN
USER
```

### MessRole

```text
MANAGER
MEMBER
```

### MonthStatus

```text
ACTIVE
ARCHIVED
```

### ExpenseType

```text
BAZAAR
SHARED
INDIVIDUAL
```

### BazaarStatus

```text
PENDING
APPROVED
REJECTED
```

### CarryForwardType

```text
PREVIOUS_DUE
PREVIOUS_BALANCE
```

---

## Entities

### users

Platform-wide user table. Each row represents a person who may own or participate in metses.

| Field | Type | Nullable | Default | Notes |
| --- | --- | --- | --- | --- |
| id | UUID | false | gen_random_uuid() | Primary key |
| name | TEXT | false | - | Full name |
| email | TEXT | false | - | Unique, used for OAuth and login |
| password | TEXT | true | null | Nullable for OAuth-only users |
| phone | TEXT | true | null | Optional contact number |
| avatar | TEXT | true | null | URL to profile image |
| system_role | SystemRole | false | USER | ADMIN or USER |
| manager_created | BOOLEAN | false | false | True if setup was initiated by a mess manager |
| email_verified | BOOLEAN | false | false | OAuth or invite verification |
| created_at | TIMESTAMPTZ | false | now() | Audit timestamp |
| updated_at | TIMESTAMPTZ | false | now() | Audit timestamp |
| deleted_at | TIMESTAMPTZ | true | null | Soft delete |

Indexes:

- `idx_users_email` UNIQUE on (`email`) where `deleted_at IS NULL`.
- `idx_users_system_role` on (`system_role`).

Business constraints:

- `email` is unique and immutable per user.
- Only one pair of `MANAGER` entries allowed per mess.

---

### oauth_accounts

Social login linkage. One user may have multiple linked providers.

| Field | Type | Nullable | Default | Notes |
| --- | --- | --- | --- | --- |
| id | UUID | false | gen_random_uuid() | Primary key |
| user_id | UUID | false | - | FK to `users.id` |
| provider | TEXT | false | - | GOOGLE, FACEBOOK, etc. |
| provider_user_id | TEXT | false | - | Provider-side account ID |
| created_at | TIMESTAMPTZ | false | now() | - |

Indexes:

- `idx_oauth_accounts_user_provider` UNIQUE on (`user_id`, `provider`).
- `idx_oauth_accounts_provider` on (`provider`, `provider_user_id`).

Foreign keys:

- `user_id` references `users(id)` ON DELETE CASCADE.

---

### messes

Each mess represents a household or shared-living entity.

| Field | Type | Nullable | Default | Notes |
| --- | --- | --- | --- | --- |
| id | UUID | false | gen_random_uuid() | Primary key |
| name | TEXT | false | - | Mess display name |
| slug | TEXT | false | - | URL-safe unique identifier |
| description | TEXT | true | null | Optional description |
| created_by | UUID | false | - | FK to `users.id` |
| created_at | TIMESTAMPTZ | false | now() | - |
| updated_at | TIMESTAMPTZ | false | now() | - |
| deleted_at | TIMESTAMPTZ | true | null | Soft delete |

Indexes:

- `idx_messes_slug` UNIQUE on (`slug`) where `deleted_at IS NULL`.
- `idx_messes_created_by` on (`created_by`).

Foreign keys:

- `created_by` references `users(id`).

---

### mess_members

Membership history for every user within each mess. Replaces a `members` sub-object on `messes`.

| Field | Type | Nullable | Default | Notes |
| --- | --- | --- | --- | --- |
| id | UUID | false | gen_random_uuid() | Primary key |
| mess_id | UUID | false | - | FK to `messes.id` |
| user_id | UUID | false | - | FK to `users.id` |
| mess_role | MessRole | false | - | MANAGER or MEMBER |
| joined_at | TIMESTAMPTZ | false | now() | - |
| removed_at | TIMESTAMPTZ | true | null | Membership end timestamp; NULL means active |
| created_at | TIMESTAMPTZ | false | now() | - |
| updated_at | TIMESTAMPTZ | false | now() | - |
| deleted_at | TIMESTAMPTZ | true | null | Soft delete |

Indexes:

- `idx_mess_members_mess_user` UNIQUE on (`mess_id`, `user_id`) where `deleted_at IS NULL`.
- `idx_mess_members_mess_active` on (`mess_id`, `removed_at`) where `deleted_at IS NULL`.
- `idx_mess_members_user` on (`user_id`).

Foreign keys:

- `mess_id` references `messes(id` ON DELETE CASCADE.
- `user_id` references `users(id` ON DELETE CASCADE.

Business constraints:

- A user may have only one ACTIVE membership per mess at a time.
- Only two MANAGER rows per mess at any point in time.
- Active membership is determined by `removed_at IS NULL`.
- Month participation is determined by: `joined_at <= month_end AND (removed_at IS NULL OR removed_at >= month_start)`

---

### months

Accounting periods. Each month contains meal entries, expenses, deposits, and approvals for a single mess.

| Field | Type | Nullable | Default | Notes |
| --- | --- | --- | --- | --- |
| id | UUID | false | gen_random_uuid() | Primary key |
| mess_id | UUID | false | - | FK to `messes.id` |
| title | TEXT | false | - | Display title (ex. July 2026) |
| month_status | MonthStatus | false | - | ACTIVE or ARCHIVED |
| started_at | DATE | false | - | First day of period |
| ended_at | DATE | true | null | Closing date |
| created_by | UUID | false | - | FK to `users.id` |
| created_at | TIMESTAMPTZ | false | now() | - |
| updated_at | TIMESTAMPTZ | false | now() | - |
| deleted_at | TIMESTAMPTZ | true | null | Soft delete |

Indexes:

- `idx_months_mess_status` UNIQUE on (`mess_id`) where `month_status = ACTIVE`.
- `idx_months_mess` on (`mess_id`).
- `idx_months_dates` on (`started_at`, `ended_at`).

Foreign keys:

- `mess_id` references `messes(id` ON DELETE CASCADE.
- `created_by` references `users(id`).

Business constraints:

- Only one ACTIVE month per mess.

---

### meal_types

Configurable per-mess meal types with economy values. Active `name` keys for a mess define the `meals` JSONB keys on `meal_entries`.

| Field | Type | Nullable | Default | Notes |
| --- | --- | --- | --- | --- |
| id | UUID | false | gen_random_uuid() | Primary key |
| mess_id | UUID | false | - | FK to `messes.id` |
| name | TEXT | false | - | ex. BREAKFAST |
| value | DECIMAL(5, 2) | false | - | Economy weight (ex. 0.5, 1.0) |
| is_active | BOOLEAN | false | true | Enable or disable |
| created_at | TIMESTAMPTZ | false | now() | - |
| updated_at | TIMESTAMPTZ | false | now() | - |
| deleted_at | TIMESTAMPTZ | true | null | Soft delete |

Indexes:

- `idx_meal_types_mess_name` UNIQUE on (`mess_id`, `name`) where `deleted_at IS NULL` and `is_active = true`.
- `idx_meal_types_is_active` on (`is_active`).

Foreign keys:

- `mess_id` references `messes(id` ON DELETE CASCADE.

Business constraints:

- `value` must be positive.

---

### meal_entries

A daily meal record for one member. Stores selected meal types inside a JSONB column and the precomputed total meal value.

| Field | Type | Nullable | Default | Notes |
| --- | --- | --- | --- | --- |
| id | UUID | false | gen_random_uuid() | Primary key |
| month_id | UUID | false | - | FK to `months.id` |
| member_id | UUID | false | - | FK to `mess_members.id` |
| date | DATE | false | - | Meal date |
| meals | JSONB | false | - | Map of active meal type keys to selected values |
| total_meal | DECIMAL(10, 2) | false | 0 | Sum of selected meal values for the date |
| created_by | UUID | false | - | FK to `users.id` |
| created_at | TIMESTAMPTZ | false | now() | - |
| updated_at | TIMESTAMPTZ | false | now() | - |
| deleted_at | TIMESTAMPTZ | true | null | Soft delete |

Indexes:

- `idx_meal_entries_month_date` on (`month_id`, `date`).
- `idx_meal_entries_member` on (`member_id`).
- `idx_meal_entries_unique` UNIQUE on (`month_id`, `member_id`, `date`) where `deleted_at IS NULL`.

Foreign keys:

- `month_id` references `months(id` ON DELETE CASCADE.
- `member_id` references `mess_members(id`).
- `created_by` references `users(id`).

Business constraints:

- `member_id` must belong to the mess represented by `month_id`.
- `meals` keys must be limited to active meal types for the mess.
- `total_meal` must equal the sum of values stored in `meals`.

---

### bazaar_submissions

Manager-submitted bazaar expenses pending approval or finalized. Item details are stored in a JSONB array; total amount is denormalized for fast reporting.

| Field | Type | Nullable | Default | Notes |
| --- | --- | --- | --- | --- |
| id | UUID | false | gen_random_uuid() | Primary key |
| mess_id | UUID | false | - | FK to `messes.id` |
| month_id | UUID | false | - | FK to `months.id` |
| submitted_by | UUID | false | - | FK to `users.id` |
| status | BazaarStatus | false | PENDING | PENDING, APPROVED, REJECTED |
| description | TEXT | true | null | Optional narrative |
| items | JSONB | false | - | Ordered list of `{ "name": string, "amount": number }` |
| total_amount | DECIMAL(12, 2) | false | - | Sum of `items[].amount` |
| expense_date | DATE | false | - | Date of purchase |
| approved_by | UUID | true | null | FK to `users.id` |
| approved_at | TIMESTAMPTZ | true | null | - |
| created_at | TIMESTAMPTZ | false | now() | - |
| updated_at | TIMESTAMPTZ | false | now() | - |
| deleted_at | TIMESTAMPTZ | true | null | Soft delete |

Indexes:

- `idx_bazaar_submissions_mess_month` on (`mess_id`, `month_id`).
- `idx_bazaar_submissions_status` on (`status`).
- `idx_bazaar_submissions_approved` on (`approved_at`, `approved_by`) where `status = APPROVED`.

Foreign keys:

- `mess_id` references `messes(id` ON DELETE CASCADE.
- `month_id` references `months(id`).
- `submitted_by` references `users(id`.
- `approved_by` references `users(id`) nullable.

Business constraints:

- Only a MANAGER may submit and approve bazaars.
- `total_amount` must equal the sum of amounts in `items`.
- `items` must be a non-empty array when `status != REJECTED`.

---

### expenses

Canonical expense ledger backed by bazaar submissions, shared costs, and individual charges.

| Field | Type | Nullable | Default | Notes |
| --- | --- | --- | --- | --- |
| id | UUID | false | gen_random_uuid() | Primary key |
| mess_id | UUID | false | - | FK to `messes.id` |
| month_id | UUID | false | - | FK to `months.id` |
| type | ExpenseType | false | - | BAZAAR, SHARED, INDIVIDUAL |
| title | TEXT | false | - | Short description |
| amount | DECIMAL(12, 2) | false | - | Total expense amount |
| created_by | UUID | false | - | FK to `users.id` |
| expense_date | DATE | false | - | When the spend occurred |
| created_at | TIMESTAMPTZ | false | now() | - |
| updated_at | TIMESTAMPTZ | false | now() | - |

Indexes:

- `idx_expenses_mess_month` on (`mess_id`, `month_id`).
- `idx_expenses_type` on (`type`).
- `idx_expenses_created` on (`created_by`).

Foreign keys:

- `mess_id` references `messes(id` ON DELETE CASCADE.
- `month_id` references `months(id`).
- `created_by` references `users(id`.

Business constraints:

- Once created, `expenses` rows are never updated.
- Bazaar expenses are always created atomically when the bazaar is approved.

---

### expense_members

Splits an expense across eligible members with immutable allocations. The authoritative source for historical share calculations.

| Field | Type | Nullable | Default | Notes |
| --- | --- | --- | --- | --- |
| id | UUID | false | gen_random_uuid() | Primary key |
| expense_id | UUID | false | - | FK to `expenses.id` |
| member_id | UUID | false | - | FK to `mess_members.id` |
| allocated_amount | DECIMAL(12, 2) | false | - | Member portion |
| created_at | TIMESTAMPTZ | false | now() | - |

Indexes:

- `idx_expense_members_expense` on (`expense_id`).
- `idx_expense_members_member` on (`member_id`).
- `idx_expense_members_unique` UNIQUE on (`expense_id`, `member_id`).

Foreign keys:

- `expense_id` references `expenses(id` ON DELETE CASCADE.
- `member_id` references `mess_members(id`).

Business constraints:

- `allocated_amount` values for one expense must sum to the expense `amount`.
- Historical allocations are immutable.

---

### deposits

Member cash deposits toward their ongoing balance.

| Field | Type | Nullable | Default | Notes |
| --- | --- | --- | --- | --- |
| id | UUID | false | gen_random_uuid() | Primary key |
| mess_id | UUID | false | - | FK to `messes.id` |
| month_id | UUID | false | - | FK to `months.id` |
| member_id | UUID | false | - | FK to `mess_members.id` |
| amount | DECIMAL(12, 2) | false | - | Positive deposit amount |
| note | TEXT | true | null | Optional explanation |
| deposit_date | DATE | false | - | Date of deposit |
| created_by | UUID | false | - | FK to `users.id` |
| created_at | TIMESTAMPTZ | false | now() | - |
| updated_at | TIMESTAMPTZ | false | now() | - |
| deleted_at | TIMESTAMPTZ | true | null | Soft delete |

Indexes:

- `idx_deposits_mess_month` on (`mess_id`, `month_id`).
- `idx_deposits_member` on (`member_id`).
- `idx_deposits_date` on (`deposit_date`).

Foreign keys:

- `mess_id` references `messes(id` ON DELETE CASCADE.
- `month_id` references `months(id`).
- `member_id` references `mess_members(id`).
- `created_by` references `users(id`.

Business constraints:

- `amount` must be positive.

---

### member_month_summaries

Account snapshot generated when a month is closed. This is the primary balance statement.

| Field | Type | Nullable | Default | Notes |
| --- | --- | --- | --- | --- |
| id | UUID | false | gen_random_uuid() | Primary key |
| month_id | UUID | false | - | FK to `months.id` |
| member_id | UUID | false | - | FK to `mess_members.id` |
| total_meals | INT | false | 0 | Aggregated meal count |
| meal_cost | DECIMAL(12, 2) | false | 0.00 | Sum of meal costs |
| shared_cost | DECIMAL(12, 2) | false | 0.00 | Shared expense share |
| individual_cost | DECIMAL(12, 2) | false | 0.00 | Individual expense share |
| deposit_amount | DECIMAL(12, 2) | false | 0.00 | Total deposits in month |
| final_bill | DECIMAL(12, 2) | false | 0.00 | Net billing |
| final_balance | DECIMAL(12, 2) | false | 0.00 | Outstanding balance |
| created_at | TIMESTAMPTZ | false | now() | Generated timestamp |

Indexes:

- `idx_member_month_summaries_month_member` UNIQUE on (`month_id`, `member_id`).
- `idx_member_month_summaries_month` on (`month_id`).
- `idx_member_month_summaries_balance` on (`final_balance`).

Foreign keys:

- `month_id` references `months(id` ON DELETE CASCADE.
- `member_id` references `mess_members(id`.

Business constraints:

- Rows are created only once when the corresponding month is closed.
- Never subject to recalculation after creation.

---

### carry_forward_balances

Records balance movement from one month to the next so that carry-forward history is audit-able.

| Field | Type | Nullable | Default | Notes |
| --- | --- | --- | --- | --- |
| id | UUID | false | gen_random_uuid() | Primary key |
| source_month_id | UUID | false | - | FK to `months.id` |
| target_month_id | UUID | false | - | FK to `months.id` |
| member_id | UUID | false | - | FK to `mess_members.id` |
| amount | DECIMAL(12, 2) | false | - | Balance value carried |
| carry_forward_type | CarryForwardType | false | - | PREVIOUS_DUE or PREVIOUS_BALANCE |
| created_at | TIMESTAMPTZ | false | now() | - |

Indexes:

- `idx_carry_forward_member_months` on (`member_id`, `source_month_id`, `target_month_id`).
- `idx_carry_forward_target` on (`target_month_id`).

Foreign keys:

- `source_month_id` references `months(id`).
- `target_month_id` references `months(id`).
- `member_id` references `mess_members(id).

Business constraints:

- `amount` must be non-negative.
- Created only during month close.

---

### activity_logs

Recorder of all significant accounting and member changes. Immutable after creation. Never bypassed for any accounting action.

| Field | Type | Nullable | Default | Notes |
| --- | --- | --- | --- | --- |
| id | UUID | false | gen_random_uuid() | Primary key |
| mess_id | UUID | false | - | FK to `messes.id` |
| month_id | UUID | true | null | FK to `months.id` |
| actor_id | UUID | false | - | FK to `users.id` |
| action | activity_action | false | - | ex. EXPENSE_APPROVED |
| entity_type | TEXT | true | null | ex. EXPENSE |
| entity_id | UUID | true | null | PK of the affected record |
| created_at | TIMESTAMPTZ | false | now() | - |

Indexes:

- `idx_activity_logs_mess_created` on (`mess_id`, `created_at` DESC).
- `idx_activity_logs_actor` on (`actor_id`).
- `idx_activity_logs_entity` on (`entity_type`, `entity_id`).
- `idx_activity_logs_action` on (`action`).

Foreign keys:

- `mess_id` references `messes(id` ON DELETE CASCADE.
- `month_id` references `months(id`) nullable.
- `actor_id` references `users(id`.

---

### join_requests

Stores join request history. Primary validation happens in Redis with 10-minute TTL. This table is primarily for audit and retry after expiration.

| Field | Type | Nullable | Default | Notes |
| --- | --- | --- | --- | --- |
| id | UUID | false | gen_random_uuid() | Primary key |
| mess_id | UUID | false | - | FK to `messes.id` |
| user_id | UUID | false | - | FK to `users.id` |
| requested_by | UUID | false | - | FK to `users.id` |
| status | TEXT | false | - | PENDING, APPROVED, REJECTED, EXPIRED |
| verified_at | TIMESTAMPTZ | true | null | Manager approval timestamp |
| created_at | TIMESTAMPTZ | false | now() | - |

Indexes:

- `idx_join_requests_mess_user` UNIQUE on (`mess_id`, `user_id`) where `status = PENDING`.
- `idx_join_requests_user` on (`user_id`).

Foreign keys:

- `mess_id` references `messes(id` ON DELETE CASCADE.
- `user_id` references `users(id` ON DELETE CASCADE.
- `requested_by` references `users(id`.

Business constraints:

- TTL enforcement is the responsibility of the backend without a database-side reminder.

---

## Additional Enums

### ApprovedAction

```text
BAZAAR_APPROVED
BAZAAR_REJECTED
```

### action

```text
MEMBER_ADDED
MEMBER_REMOVED
MANAGER_ASSIGNED
MEAL_ADDED
MEAL_UPDATED
MEAL_DELETED
EXPENSE_ADDED
EXPENSE_UPDATED
DEPOSIT_ADDED
DEPOSIT_UPDATED
MONTH_OPENED
MONTH_CLOSED
MEMBER_BALANCE_CREATED
```

---

## Index Summary

| Table | Index | Type | Columns |
|------ | --- | --- | --- |
| users | `idx_users_email` | Unique | `email` (partial) |
| users | `idx_users_system_role` | Normal | `system_role` |
| oauth_accounts | `idx_oauth_accounts_user_provider` | Unique | `user_id, provider` |
| messes | `idx_messes_slug` | Unique | `slug` (partial) |
| mess_members | `idx_mess_members_mess_user` | Unique | `mess_id, user_id` (partial) |
| mess_members | `idx_mess_members_mess_active` | Normal | `mess_id, removed_at` (partial) |
| mess_members | `idx_mess_members_user` | Normal | `user_id` |
| months | `idx_months_mess_status` | Unique | `mess_id` (partial) |
| months | `idx_months_mess` | Normal | `mess_id` |
| months | `idx_months_dates` | Normal | `started_at, ended_at` |
| meal_types | `idx_meal_types_mess_name` | Unique | `mess_id, name` (partial) |
| meal_entries | `idx_meal_entries_month_date` | Normal | `month_id, date` |
| meal_entries | `idx_meal_entries_member` | Normal | `member_id` |
| meal_entries | `idx_meal_entries_unique` | Unique | `month_id, member_id, date` (partial) |
| meal_entries | `idx_meal_entries_total_meal` | Normal | `total_meal` |
| bazaar_submissions | `idx_bazaar_submissions_mess_month` | Normal | `mess_id, month_id` |
| bazaar_submissions | `idx_bazaar_submissions_status` | Normal | `status` |
| bazaar_submissions | `idx_bazaar_submissions_approved` | Normal | `approved_at`, `approved_by` (partial) |
| bazaar_submissions | `idx_bazaar_submissions_total_amount` | Normal | `total_amount` |
| expenses | `idx_expenses_mess_month` | Normal | `mess_id, month_id` |
| expenses | `idx_expenses_type` | Normal | `type` |
| deposits | `idx_deposits_mess_month` | Normal | `mess_id, month_id` |
| deposits | `idx_deposits_member` | Normal | `member_id` |
| deposits | `idx_deposits_date` | Normal | `deposit_date` |
| member_month_summaries | `idx_member_month_summaries_month_member` | Unique | `month_id, member_id` |
| member_month_summaries | `idx_member_month_summaries_month` | Normal | `month_id` |
| carry_forward_balances | `idx_carry_forward_months` | Normal | `source_month_id, target_month_id` |
| carry_forward_balances | `idx_carry_forward_target` | Normal | `target_month_id` |
| activity_logs | `idx_activity_logs_mess_created` | Normal | `mess_id, created_at DESC` |
| activity_logs | `idx_activity_logs_actor` | Normal | `actor_id` |
| activity_logs | `idx_activity_logs_entity` | Normal | `entity_type, entity_id` |
| activity_logs | `idx_activity_logs_action` | Normal | `action` |
| join_requests | `idx_join_requests_mess_user` | Unique | `mess_id, user_id` (partial) |

---

## Soft Delete Strategy

Every major table stores a `deleted_at` timestamp:

```text
NULL  -> Active
NOT NULL -> Deleted
```

Delete operations never physically remove rows. Use partial indexes on critical unique keys so soft-deleted rows do not block new inserts.

---

## Immutability Rules

- `expense_members` allocations must never change after creation.
- `activity_logs` rows must never be deleted or modified.
- `member_month_summaries` is created only once at month close and is never recalculated.
- `meal_entries`, `carry_forward_balances` are append-only once written.

---

## Future Expansion Compatibility

This schema already supports:

- Multi-tenant SaaS without structural changes.
- Mobile app integration through singular `users` source of truth.
- Unified activity feed through `activity_logs` serves notification-center use cases without a separate `notifications` table.
- Multiple OAuth providers through the `oauth_accounts` table.
- Recurring expense templates through the `expenses` table with new flags.
- Structured bazaar payloads through the `bazaar_submissions.items` JSONB column.
- Analytics and reporting due to immutable `activity_logs` and explicit timestamps.
