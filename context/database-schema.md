# MessMate - Database Schema Design

## Database

```text
PostgreSQL
```

---

# Design Principles

* Soft Delete Support
* Audit Logging
* Month Based Accounting
* Future SaaS Ready
* Future Mobile App Ready
* Future Chat Ready
* Activity Tracking First
* Accounting First Design

---

# Enums

## SystemRole

```text
ADMIN
USER
```

---

## MessRole

```text
MANAGER
MEMBER
```

---

## MemberStatus

```text
ACTIVE
REMOVED
```

---

## MonthStatus

```text
ACTIVE
ARCHIVED
```

---

## ExpenseType

```text
BAZAAR
SHARED
INDIVIDUAL
```

---

## BazaarStatus

```text
PENDING
APPROVED
REJECTED
```

---

# users

Stores all platform users.

```text
id (uuid)

name
email
password

phone
avatar

system_role

manager_created
email_verified

created_at
updated_at
deleted_at
```

---

## Notes

* Email must be unique.
* Password nullable for OAuth users.
* manager_created controls first-time setup flow.
* Only one active mess allowed through business validation.

---

# oauth_accounts

Supports social login.

```text
id

user_id

provider
provider_user_id

created_at
```

---

Examples:

```text
GOOGLE
FACEBOOK
```

---

# messes

Stores mess information.

```text
id

name
slug

description

created_by

created_at
updated_at
deleted_at
```

---

# mess_members

Tracks membership history.

```text
id

mess_id
user_id

role

status

joined_month_id
removed_month_id

joined_at
removed_at

created_at
updated_at
deleted_at
```

---

## Notes

Used instead of storing members directly inside messes.

Supports:

* Join History
* Remove History
* Future Membership Tracking

---

# months

Represents accounting periods.

```text
id

mess_id

title

status

started_at
ended_at

created_by

created_at
updated_at
deleted_at
```

---

Example

```text
June 2026
July 2026
```

Only one ACTIVE month per mess.

---

# meal_types

Configurable meal settings.

```text
id

mess_id

name

value

is_active

created_at
updated_at
deleted_at
```

---

Examples

```text
Breakfast = 0.5

Lunch = 1

Dinner = 1
```

---

# meal_entries

Daily meal records.

```text
id

month_id

member_id

date

created_by

created_at
updated_at
deleted_at
```

---

# meal_entry_items

Stores meal type selections.

```text
id

meal_entry_id

meal_type_id

meal_value

created_at
```

---

Example

```text
2026-06-10

Breakfast
Lunch
Dinner
```

---

# bazaar_submissions

Submitted bazaars.

```text
id

mess_id

month_id

submitted_by

status

description

expense_date

approved_by

approved_at

created_at
updated_at
deleted_at
```

---

# bazaar_items

Individual bazaar items.

```text
id

submission_id

item_name

amount

created_at
```

---

Example

```text
Rice
1200

Oil
350

Vegetables
400
```

---

# expenses

Unified expense table.

```text
id

mess_id
month_id

type

title

description

amount

created_by

expense_date

created_at
updated_at
deleted_at
```

---

Examples

```text
Gas Bill

Internet Bill

Previous Month Due

Rice Purchase
```

---

# expense_members

Tracks who shares an expense.

```text
id

expense_id

member_id

allocated_amount

created_at
```

---

Purpose:

```text
Gas = 1000

Members:
Adal
Rahim
Fahad

Allocation:
333.33
333.33
333.34
```

Historical calculations never change.

---

# deposits

Member deposits.

```text
id

mess_id

month_id

member_id

amount

note

deposit_date

created_by

created_at
updated_at
deleted_at
```

---

Example

```text
Adal

3000 BDT
```

---

# member_month_summaries

Most important accounting table.

Generated when month closes.

```text
id

month_id

member_id

total_meals

meal_cost

shared_cost

individual_cost

deposit_amount

final_bill

final_balance

created_at
```

---

Example

```text
Meal Cost = 2500

Shared Cost = 800

Individual Cost = 200

Deposit = 4000

Balance = +500
```

---

# carry_forward_balances

Stores previous month balances.

```text
id

source_month_id

target_month_id

member_id

amount

type

created_at
```

---

Examples

```text
PREVIOUS_DUE

PREVIOUS_BALANCE
```

---

# activity_logs

System audit trail.

```text
id

mess_id

month_id

actor_id

action

entity_type

entity_id

old_data

new_data

created_at
```

---

Examples

```text
MEAL_UPDATED

EXPENSE_CREATED

DEPOSIT_ADDED

MEMBER_REMOVED
```

---

# notifications

Future notification system.

```text
id

user_id

title

message

is_read

created_at
```

---

# join_requests

Redis-backed verification flow.

Database stores history only.

```text
id

mess_id

user_id

requested_by

status

verified_at

created_at
```

---

Redis Key

```text
join_request:583214
```

TTL:

```text
10 Minutes
```

---

# Index Recommendations

## users

```text
email
```

---

## mess_members

```text
mess_id
user_id
status
```

---

## months

```text
mess_id
status
```

---

## meal_entries

```text
member_id
date
month_id
```

---

## expenses

```text
mess_id
month_id
type
```

---

## deposits

```text
member_id
month_id
```

---

## activity_logs

```text
mess_id
created_at
```

---

# Soft Delete Strategy

Every major table contains:

```text
deleted_at
```

Rules:

```text
NULL
=
Active

NOT NULL
=
Deleted
```

Data is never permanently removed.

---

# Future Expansion Compatibility

Current schema already supports:

* Mobile Apps
* Multi Tenant SaaS
* Real-time Chat
* Push Notifications
* Subscription Plans
* Analytics
* Report Exports
* Multiple OAuth Providers

without major database redesign.

---

# Important Business Rules

1. One user can have only one ACTIVE mess membership.

2. One mess can have maximum two managers.

3. One mess can have only one ACTIVE month.

4. Only managers can create accounting records.

5. Member balances carry forward.

6. Historical expenses never recalculate.

7. Removed members keep historical data.

8. Every accounting action must create an activity log.

9. Bazaar submissions require manager approval.

10. Meal types are dynamic and configurable.
