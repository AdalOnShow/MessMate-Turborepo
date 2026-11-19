# MessMate - Database Schema

## Database

PostgreSQL on Neon (serverless), accessed through Prisma 7.8 with the Neon
adapter. The Prisma schema lives in `packages/database/prisma/schema.prisma`.

This document describes that schema in words. When the two disagree, the Prisma
schema is right and this file must be updated. Change both in the same PR.

### Migrations

Migration history was squashed on 18 Nov 2026 into a single baseline,
`packages/database/prisma/migrations/20261119000000_version_1`, and the
production database was reset. A database created from the old history cannot
migrate across the squash; recreate it from the baseline instead. Every change
after that is a normal `prisma migrate dev` migration on top of the baseline.

---

## Design Principles

- Soft deletes (`deleted_at`) on most major entities (ADR-010). Expenses are
  the exception: they are hard-deleted, with a snapshot kept in
  `activity_logs.details`.
- Accounting is organised by month (ADR-006). Closed months are never
  recalculated (ADR-009).
- Balances carry forward through `carry_forward_balances` (ADR-008).
- Meals and bazaar items are JSONB (ADR-021, ADR-022).
- Every accounting change writes an `activity_logs` row in the same
  transaction (ADR-013). Activity older than 12 months is purged (ADR-028).
- Money is `DECIMAL(12,2)`, meal counts `DECIMAL(10,2)`.
- Calendar dates (meal, expense, deposit, bazaar dates) are stored as UTC
  midnight of the chosen day.

---

## Enums

| Enum               | Values                                                    |
| ------------------ | --------------------------------------------------------- |
| `SystemRole`       | `ADMIN`, `USER`                                           |
| `MessRole`         | `MANAGER`, `MEMBER`                                       |
| `MonthStatus`      | `ACTIVE`, `ARCHIVED` (archived = closed)                  |
| `ExpenseType`      | `BAZAAR`, `SHARED`, `INDIVIDUAL`                          |
| `BazaarStatus`     | `PENDING`, `APPROVED`, `REJECTED`                         |
| `CarryForwardType` | `PREVIOUS_DUE` (member owed), `PREVIOUS_BALANCE` (credit) |

### activity_action

```text
MEMBER_ADDED            MEMBER_REMOVED
MANAGER_ASSIGNED        MANAGER_REMOVED
MEAL_ADDED              MEAL_UPDATED            MEAL_DELETED
EXPENSE_ADDED           EXPENSE_UPDATED         EXPENSE_DELETED
DEPOSIT_ADDED           DEPOSIT_UPDATED         DEPOSIT_DELETED
MONTH_OPENED            MONTH_CLOSED
MEMBER_BALANCE_CREATED  DEFAULT_MEALS_UPDATED
BAZAAR_SUBMITTED        BAZAAR_UPDATED          BAZAAR_APPROVED
BAZAAR_REJECTED         BAZAAR_DELETED
```

---

## Entities

All ids are UUIDs (`@default(uuid())`). `created_at` and `updated_at` default to
`now()`.

### users

A person on the platform.

| Field                | Type        | Null | Default | Notes                                                     |
| -------------------- | ----------- | ---- | ------- | --------------------------------------------------------- |
| id                   | UUID        | no   | uuid    | PK                                                        |
| name                 | TEXT        | no   |         |                                                           |
| email                | TEXT        | no   |         | Unique                                                    |
| password             | TEXT        | yes  | null    | bcrypt hash; null for Google-only accounts                |
| refresh_token        | TEXT        | yes  | null    | Legacy, unused since `user_sessions`                      |
| phone                | TEXT        | yes  | null    |                                                           |
| avatar               | TEXT        | yes  | null    | Cloudinary URL                                            |
| system_role          | SystemRole  | no   | USER    |                                                           |
| manager_created      | BOOLEAN     | no   | false   | Account was created by a mess manager                     |
| must_change_password | BOOLEAN     | no   | false   | Set for manager-created accounts; cleared on own password |
| email_verified       | BOOLEAN     | no   | false   | True for Google sign-ins                                  |
| created_at           | TIMESTAMPTZ | no   | now()   |                                                           |
| updated_at           | TIMESTAMPTZ | no   | now()   |                                                           |
| deleted_at           | TIMESTAMPTZ | yes  | null    | Soft delete                                               |

Indexes: `users_email_key` UNIQUE (`email`); `idx_users_system_role`.

### oauth_accounts

Linked social logins (Google today). Auto-linking at login is prohibited
(ADR-024).

| Field            | Type        | Null | Notes                    |
| ---------------- | ----------- | ---- | ------------------------ |
| id               | UUID        | no   | PK                       |
| user_id          | UUID        | no   | FK users, cascade delete |
| provider         | TEXT        | no   | `google`                 |
| provider_user_id | TEXT        | no   | Provider's account id    |
| created_at       | TIMESTAMPTZ | no   |                          |

Indexes: `idx_oauth_accounts_user_provider` UNIQUE (`user_id`, `provider`);
`idx_oauth_accounts_provider` (`provider`, `provider_user_id`).

### user_sessions

One row per signed-in device (ADR-025). The refresh token carries the session
id; only SHA-256 hashes are stored.

| Field               | Type        | Null | Notes                                                    |
| ------------------- | ----------- | ---- | -------------------------------------------------------- |
| id                  | UUID        | no   | PK, also the access token's `sid`                        |
| user_id             | UUID        | no   | FK users, cascade delete                                 |
| token_hash          | TEXT        | no   | Hash of the current refresh token                        |
| previous_token_hash | TEXT        | yes  | Token replaced by the last rotation (2-minute grace)     |
| rotated_at          | TIMESTAMPTZ | yes  | When the last rotation happened                          |
| user_agent          | TEXT        | yes  |                                                          |
| created_at          | TIMESTAMPTZ | no   |                                                          |
| last_used_at        | TIMESTAMPTZ | no   |                                                          |
| expires_at          | TIMESTAMPTZ | no   | Slides 30 days ahead on every refresh                    |
| revoked_at          | TIMESTAMPTZ | yes  | Set on logout; the JWT strategy rejects revoked sessions |

Indexes: `idx_user_sessions_user`; `idx_user_sessions_expires`.

### messes

A shared household.

| Field       | Type        | Null | Notes                       |
| ----------- | ----------- | ---- | --------------------------- |
| id          | UUID        | no   | PK                          |
| name        | TEXT        | no   |                             |
| slug        | TEXT        | no   | Unique, generated from name |
| description | TEXT        | yes  |                             |
| created_by  | UUID        | no   | FK users                    |
| created_at  | TIMESTAMPTZ | no   |                             |
| updated_at  | TIMESTAMPTZ | no   |                             |
| deleted_at  | TIMESTAMPTZ | yes  | Soft delete                 |

Indexes: `messes_slug_key` UNIQUE (`slug`); `idx_messes_created_by`.

### mess_members

Membership history of users in messes (ADR-023).

| Field      | Type        | Null | Notes                           |
| ---------- | ----------- | ---- | ------------------------------- |
| id         | UUID        | no   | PK; meals/deposits reference it |
| mess_id    | UUID        | no   | FK messes, cascade delete       |
| user_id    | UUID        | no   | FK users, cascade delete        |
| mess_role  | MessRole    | no   |                                 |
| joined_at  | TIMESTAMPTZ | no   | now()                           |
| removed_at | TIMESTAMPTZ | yes  | null = active member            |
| created_at | TIMESTAMPTZ | no   |                                 |
| updated_at | TIMESTAMPTZ | no   |                                 |
| deleted_at | TIMESTAMPTZ | yes  | Soft delete                     |

Indexes:

- `mess_members_user_id_key` UNIQUE (`user_id`) WHERE `removed_at IS NULL`:
  the database enforces one active mess per user (ADR-003).
- `idx_mess_members_mess_active` (`mess_id`, `removed_at`) WHERE
  `deleted_at IS NULL`.
- `idx_mess_members_user` (`user_id`).

Rules:

- At most 2 `MANAGER` rows per mess and at least 1 (ADR-004, enforced in the
  service). Handover swaps roles in one transaction.
- Active membership checks filter `removed_at IS NULL AND deleted_at IS NULL`.
- Month participation:
  `joined_at <= month_end AND (removed_at IS NULL OR removed_at >= month_start)`.

### months

Accounting periods.

| Field        | Type        | Null | Notes                                          |
| ------------ | ----------- | ---- | ---------------------------------------------- |
| id           | UUID        | no   | PK                                             |
| mess_id      | UUID        | no   | FK messes, cascade delete                      |
| title        | TEXT        | no   | Unique per mess ("November 2026 (2)" on clash) |
| month_status | MonthStatus | no   |                                                |
| started_at   | TIMESTAMPTZ | no   | When the manager started it                    |
| ended_at     | TIMESTAMPTZ | yes  | Set on close                                   |
| created_by   | UUID        | no   | FK users                                       |
| created_at   | TIMESTAMPTZ | no   |                                                |
| updated_at   | TIMESTAMPTZ | no   |                                                |
| deleted_at   | TIMESTAMPTZ | yes  |                                                |

Indexes: `idx_months_mess_status` UNIQUE (`mess_id`) WHERE
`month_status = 'ACTIVE'` (one active month per mess); `idx_months_mess`;
`idx_months_dates` (`started_at`, `ended_at`).

### meal_types

Per-mess meal types (ADR-005).

| Field      | Type         | Null | Notes                                      |
| ---------- | ------------ | ---- | ------------------------------------------ |
| id         | UUID         | no   | PK; the key used in `meal_entries.meals`   |
| mess_id    | UUID         | no   | FK messes, cascade delete                  |
| name       | TEXT         | no   |                                            |
| value      | DECIMAL(5,2) | no   | Default count the meal grid is filled with |
| is_active  | BOOLEAN      | no   | true                                       |
| created_at | TIMESTAMPTZ  | no   |                                            |
| updated_at | TIMESTAMPTZ  | no   |                                            |
| deleted_at | TIMESTAMPTZ  | yes  |                                            |

Every meal counts as 1 toward the bill; `value` is only the grid's default.

Indexes: `idx_meal_types_mess_name` UNIQUE (`mess_id`, `name`) WHERE
`deleted_at IS NULL AND is_active = true`; `idx_meal_types_is_active`.

### meal_entries

One member's meals for one day (ADR-021).

| Field      | Type          | Null | Notes                                       |
| ---------- | ------------- | ---- | ------------------------------------------- |
| id         | UUID          | no   | PK                                          |
| month_id   | UUID          | no   | FK months                                   |
| member_id  | UUID          | no   | FK mess_members                             |
| date       | TIMESTAMPTZ   | no   | UTC midnight of the day                     |
| meals      | JSONB         | no   | `{ "<meal_type_id>": count }`, steps of 0.5 |
| total_meal | DECIMAL(10,2) | no   | Sum of `meals`                              |
| created_by | UUID          | no   | FK users                                    |
| created_at | TIMESTAMPTZ   | no   |                                             |
| updated_at | TIMESTAMPTZ   | no   |                                             |
| deleted_at | TIMESTAMPTZ   | yes  |                                             |

Indexes: `idx_meal_entries_unique` UNIQUE (`month_id`, `member_id`, `date`)
WHERE `deleted_at IS NULL`; `idx_meal_entries_month_date`;
`idx_meal_entries_member`.

Rules (enforced in `apps/api/src/meals/meal-entries.ts`):

- Only days that have ended (yesterday or earlier, Asia/Dhaka) can be saved.
- A day must fall in the active month. A mess's first month may back-fill 31
  days before it started; later months start on their own start day, because
  earlier days belong to a closed month.
- A day is saved once (`POST`); after that it is edited in Reports
  (`PUT .../day`), one member or one day at a time.

### bazaar_submissions

Grocery purchases awaiting approval (ADR-012, ADR-022).

| Field        | Type          | Null | Notes                                          |
| ------------ | ------------- | ---- | ---------------------------------------------- |
| id           | UUID          | no   | PK                                             |
| mess_id      | UUID          | no   | FK messes, cascade delete                      |
| month_id     | UUID          | no   | FK months                                      |
| submitted_by | UUID          | no   | FK users; any active member may submit         |
| status       | BazaarStatus  | no   | PENDING                                        |
| description  | TEXT          | yes  |                                                |
| items        | JSONB         | no   | `[{ name, amount }]`                           |
| total_amount | DECIMAL(12,2) | no   | Sum of item amounts                            |
| expense_date | TIMESTAMPTZ   | no   | UTC midnight                                   |
| approved_by  | UUID          | yes  | FK users; the manager who approved or rejected |
| approved_at  | TIMESTAMPTZ   | yes  |                                                |
| created_at   | TIMESTAMPTZ   | no   |                                                |
| updated_at   | TIMESTAMPTZ   | no   |                                                |
| deleted_at   | TIMESTAMPTZ   | yes  |                                                |

Indexes: `idx_bazaar_submissions_mess_month`; `idx_bazaar_submissions_status`;
`idx_bazaar_submissions_approved` (`approved_at`, `approved_by`) WHERE
`status = 'APPROVED'`; `idx_bazaar_submissions_total_amount`.

Rules: the submitter or a manager may edit or delete a submission while it is
PENDING. Approval creates a `BAZAAR` expense in the same transaction. Closing
a month rejects every submission still PENDING.

### expenses

The expense ledger. Hard-deleted (no `deleted_at`).

| Field        | Type          | Null | Notes                     |
| ------------ | ------------- | ---- | ------------------------- |
| id           | UUID          | no   | PK                        |
| mess_id      | UUID          | no   | FK messes, cascade delete |
| month_id     | UUID          | no   | FK months                 |
| type         | ExpenseType   | no   |                           |
| title        | TEXT          | no   |                           |
| amount       | DECIMAL(12,2) | no   |                           |
| created_by   | UUID          | no   | FK users                  |
| expense_date | TIMESTAMPTZ   | no   | UTC midnight              |
| created_at   | TIMESTAMPTZ   | no   |                           |
| updated_at   | TIMESTAMPTZ   | no   |                           |

Indexes: `idx_expenses_mess_month`; `idx_expenses_type`; `idx_expenses_created`.

Rules: managers may edit or delete expenses of the active month. An edit
replaces the expense's `expense_members` rows. A delete removes the expense
and its allocations and logs `EXPENSE_DELETED` with a snapshot in `details`.

### expense_members

How a SHARED or INDIVIDUAL expense is split.

| Field            | Type          | Null | Notes                    |
| ---------------- | ------------- | ---- | ------------------------ |
| id               | UUID          | no   | PK                       |
| expense_id       | UUID          | no   | FK expenses, cascade     |
| member_id        | UUID          | no   | FK mess_members          |
| allocated_amount | DECIMAL(12,2) | no   | Shares sum to the amount |
| created_at       | TIMESTAMPTZ   | no   |                          |

Indexes: `idx_expense_members_unique` UNIQUE (`expense_id`, `member_id`);
`idx_expense_members_expense`; `idx_expense_members_member`.

BAZAAR expenses have no allocations: they are shared by meals through the
meal rate.

### deposits

Money a member paid into the mess.

| Field        | Type          | Null | Notes                     |
| ------------ | ------------- | ---- | ------------------------- |
| id           | UUID          | no   | PK                        |
| mess_id      | UUID          | no   | FK messes, cascade delete |
| month_id     | UUID          | no   | FK months                 |
| member_id    | UUID          | no   | FK mess_members           |
| amount       | DECIMAL(12,2) | no   | Positive                  |
| deposit_date | TIMESTAMPTZ   | no   | UTC midnight              |
| created_by   | UUID          | no   | FK users                  |
| created_at   | TIMESTAMPTZ   | no   |                           |
| updated_at   | TIMESTAMPTZ   | no   |                           |
| deleted_at   | TIMESTAMPTZ   | yes  | Soft delete               |

Indexes: `idx_deposits_mess_month`; `idx_deposits_member`; `idx_deposits_date`.

### member_month_summaries

Each member's statement, written once when a month closes (ADR-009).

| Field           | Type          | Notes                                     |
| --------------- | ------------- | ----------------------------------------- |
| id              | UUID          | PK                                        |
| month_id        | UUID          | FK months, cascade delete                 |
| member_id       | UUID          | FK mess_members                           |
| total_meals     | DECIMAL(10,2) |                                           |
| meal_cost       | DECIMAL(12,2) | Bazaar split by meals (largest remainder) |
| shared_cost     | DECIMAL(12,2) | Sum of SHARED allocations                 |
| individual_cost | DECIMAL(12,2) | INDIVIDUAL allocations + carried-in due   |
| deposit_amount  | DECIMAL(12,2) | Deposits + carried-in balance             |
| final_bill      | DECIMAL(12,2) | meal + shared + individual                |
| final_balance   | DECIMAL(12,2) | deposit_amount − final_bill               |
| created_at      | TIMESTAMPTZ   |                                           |

Indexes: `idx_member_month_summaries_month_member` UNIQUE (`month_id`,
`member_id`); `idx_member_month_summaries_month`;
`idx_member_month_summaries_balance` (`final_balance`).

The maths lives in `apps/api/src/months/month-summary.ts`.

### carry_forward_balances

Balances moved from a closed month into the next one (ADR-008).

| Field              | Type             | Notes                                          |
| ------------------ | ---------------- | ---------------------------------------------- |
| id                 | UUID             | PK                                             |
| source_month_id    | UUID             | FK months (the closed month)                   |
| target_month_id    | UUID             | FK months (the new month)                      |
| member_id          | UUID             | FK mess_members                                |
| amount             | DECIMAL(12,2)    | Always positive                                |
| carry_forward_type | CarryForwardType | PREVIOUS_BALANCE = credit, PREVIOUS_DUE = owed |
| created_at         | TIMESTAMPTZ      |                                                |

Indexes: `idx_carry_forward_member_months` (`member_id`, `source_month_id`,
`target_month_id`); `idx_carry_forward_target`.

Carries are not written as deposit or expense rows. The summary maths and the
live calculations count PREVIOUS_BALANCE as a deposit and PREVIOUS_DUE as an
individual cost. The UI shows them in a separate "Carried in" column. Members
removed before the close are not carried; the manager may also switch carry
forward off or exclude members (`carryForward` on `POST /months/:messId`).

### activity_logs

Audit trail and activity feed (ADR-013).

| Field       | Type            | Null | Notes                                        |
| ----------- | --------------- | ---- | -------------------------------------------- |
| id          | UUID            | no   | PK                                           |
| mess_id     | UUID            | no   | FK messes, cascade delete                    |
| month_id    | UUID            | yes  | FK months                                    |
| actor_id    | UUID            | no   | FK users                                     |
| action      | activity_action | no   |                                              |
| entity_type | TEXT            | yes  | e.g. `deposits`, `meal_day`                  |
| entity_id   | TEXT            | yes  | Affected record                              |
| details     | JSONB           | yes  | Snapshot (deleted expenses, meal-day counts) |
| created_at  | TIMESTAMPTZ     | no   |                                              |

Indexes: `idx_activity_logs_mess_created` (`mess_id`, `created_at` DESC);
`idx_activity_logs_actor`.

Volume rules: a meal save writes one row per day (`entity_type: 'meal_day'`,
member and meal counts in `details`), not one per member. Rows older than 12
months are deleted for a mess when it opens a new month
(`ACTIVITY_RETENTION_MONTHS`, ADR-028).

### join_requests

Invites from a manager to an existing user (ADR-015).

| Field        | Type        | Null | Notes                                  |
| ------------ | ----------- | ---- | -------------------------------------- |
| id           | UUID        | no   | PK                                     |
| mess_id      | UUID        | no   | FK messes, cascade delete              |
| user_id      | UUID        | no   | Invited user, FK users, cascade delete |
| requested_by | UUID        | no   | Inviting manager, FK users             |
| status       | TEXT        | no   | PENDING, ACCEPTED, REJECTED, EXPIRED   |
| verified_at  | TIMESTAMPTZ | yes  | When accepted or rejected              |
| created_at   | TIMESTAMPTZ | no   |                                        |

Indexes: `idx_join_requests_mess_user` UNIQUE (`mess_id`, `user_id`) WHERE
`status = 'PENDING'`; `idx_join_requests_user`.

Pending invites older than 7 days are marked EXPIRED when the invitee's
pending list is read.

---

## Soft Delete Strategy

`deleted_at IS NULL` means active. Soft-deleted rows stay for history, and
partial unique indexes ignore them so a new row can take their place.
`expenses` and `expense_members` are hard-deleted; the activity log keeps the
record.

## Immutability Rules

- `member_month_summaries` is written once at month close and never
  recalculated.
- Closed (ARCHIVED) months accept no meals, expenses, deposits or bazaar
  changes.
- Changes to the active month (editing meals, expenses, deposits) are allowed
  and always logged in `activity_logs`.
- `activity_logs` rows are never edited; they are deleted only by the
  12-month retention purge.
