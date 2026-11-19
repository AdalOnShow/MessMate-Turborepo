# MessMate - Features Specification

## Overview

What MessMate does today, who may do it, and what is planned. Checkboxes mark
built (`[x]`) and planned (`[ ]`) items. For how each flow works, see
`technical-flow.md`; for the build log, see `process_tracker.md`.

Status: **launch-ready** after the final pre-production QA on 18 Nov 2026
(see process_tracker.md → Pre-Production QA).

---

# Authentication

- [x] Sign up / sign in with email and password
- [x] Sign in with Google (an email that already has a password account is
      refused; no auto-linking, ADR-024)
- [x] httpOnly cookie sessions: 7-day access token, 30-day sliding refresh
      token rotated on every refresh, one session per device (ADR-025)
- [x] Logout revokes the session immediately
- [x] Expired session anywhere in the app → toast + sign-in page
- [x] Stricter rate limits on auth routes; 120 requests/min per user overall

# Profile

- [x] Name, phone, avatar (Cloudinary upload, JPEG/PNG/WebP, size limit)
- [x] Change password
- [x] Account status (manager-created, email verified)

## Manager-Created Accounts

- [x] Manager creates a member account (name, email, password, phone) and
      the member is added to the mess
- [x] `must_change_password`: the dashboard shows "Set your own password"
      with a link to Profile until the member sets one only they know
- [ ] Generated temporary password / sharing credentials from the app

---

# Mess Management

## Create Mess

- [x] Any user without an active mess creates one and becomes its manager
- [x] Starts with default meal types (Lunch, Dinner)
- [x] One active mess per user (database-enforced, ADR-003)
- [x] Edit mess name and description (Settings)

## Members

- [x] Members page with live per-member calculation cards (meals, meal cost,
      shared, individual, deposits, balance)
- [x] Remove member (not yourself, not the last manager)
- [x] Removed members keep their history and are billed for the month they
      left in

## Invites

- [x] Search users by name or email (every word must match; emails masked)
- [x] Invite by search result or typed email (5 per minute)
- [x] Invitee sees pending invites on the dashboard; accept or reject
- [x] Invites expire after 7 days
- [x] No duplicate invites; users already in a mess can't be invited

## Managers

- [x] Promote / demote (1 to 2 managers, equal permissions, ADR-004)
- [x] Hand over the manager role to another member in one step

---

# Month Management

- [x] Manual lifecycle: Start Month (closes the current month first), ADR-006
- [x] Close preview: every member's bill and balance before confirming
- [x] Carry forward balances, with an option to switch it off or exclude
      members who settled in cash (ADR-008)
- [x] Pending bazaar is rejected on close (warned in the preview)
- [x] Double-submit guard (60 s) and unique month titles
- [x] Months page: history of every month with its frozen statement
      (overview, meal rate, expense breakdown, member summaries with a
      separate "Carried in" column)
- [ ] Month selector on Reports to browse a closed month's detailed lists
      (QA item B9; the Months page shows closed-month statements today)

---

# Meals

## Meal Types (Settings)

- [x] Add, rename, deactivate, delete meal types (ADR-005)
- [x] Each type has a default count used to pre-fill the grid
- [x] Every meal counts as 1 toward the bill

## Daily Entry (Meals page, managers)

- [x] Day-by-day grid, one row per active member, steps of 0.5
- [x] "Everyone" row to change one meal type for all members at once
- [x] Pre-filled with meal-type defaults; unsaved changes highlighted
- [x] Only days that have ended (yesterday or earlier, Asia/Dhaka)
- [x] Only days of the active month (first month: 31-day back-fill). The
      date picker offers only those days; on the opening day of a month it
      explains that no day can be filled in yet
- [x] A saved day is read-only here; it is changed from Reports
- [x] Phone layout: one card per member with large steppers

## Editing (Reports → Meals)

- [x] Edit a whole saved day
- [x] Edit or delete one member's meals for a day
- [x] Active month only; every change is logged

---

# Bazaar

- [x] Any member submits a bazaar: items (name, amount), date, description
- [x] Submitter or manager edits or deletes while pending
- [x] Managers approve (creates a BAZAAR expense) or reject, on the Bazaar
      page or from the dashboard's approvals card
- [x] Pending / Approved / Rejected tabs with counts, 4 per page, "Load more"

---

# Expenses

- [x] SHARED: split equally across chosen members, to the paisa, with a
      live preview of each share
- [x] INDIVIDUAL: one member
- [x] Edit or delete (active month, managers, from Reports)
- [x] Expense summary and history (filter by type, paginated)

# Deposits

- [x] Managers record deposits for a member
- [x] Edit or delete (active month, from Reports)
- [x] Deposit summary per member and history (paginated)

---

# Balances

```text
Meal rate  = total bazaar / total meals
Bill       = meal cost + shared + individual (+ carried-in due)
Balance    = deposits (+ carried-in balance) − bill
```

- [x] Live during the month (Members, dashboard), frozen at close
      (`member_month_summaries`)
- [x] Bazaar split by meals to the paisa, so parts add up exactly
- [x] Money shown with `formatMoney` (whole taka) or `formatMoneyExact`
      (৳1,000 / ৳333.30) everywhere, including success dialogs

---

# Reports (current month)

- [x] Tabs: Meals (per day, editable), Expenses, Deposits, Bazaar
- [x] Per-member summary table (meals, meal cost, shared, individual, bill,
      deposit, balance)
- [x] Edit / delete entries, each with a success dialog

---

# Dashboard

- [x] Manager: mess balance with share of deposits spent, meals, meal rate,
      days with meals, bazaar approvals, own summary, meals by member,
      recent activity, quick actions
- [x] Member: own balance, meals, meal rate, own summary, recent activity
- [x] No-mess, no-month and invite states; set-password notice
- [x] Fresh numbers right after any save (ADR-027)

---

# Activity

- [x] Every state change logged in the same transaction (ADR-013)
- [x] One row per meal-day; snapshots for deleted expenses (ADR-028)
- [x] 12-month retention, purged when a month opens
- [x] Dashboard: recent 10; Activity page: full history, paginated
- [x] Unread badge in the navigation

---

# App Experience

- [x] Success dialog after adding, editing or deleting deposits, expenses,
      bazaar and meals: a summary, plus Go to dashboard / Stay here
- [x] Toasts for other successes and every failure (with Retry for
      transient errors and a reference id for server errors)
- [x] Load failures show an error state with Retry, never an empty state
- [x] English and Bangla, switched in place (no reload)
- [x] Light / dark / system theme (sidebar on desktop, More menu on phones)
- [x] In-app tips on every page, with an on/off switch
- [x] Installable PWA (`/install` guide; Chrome/Safari), offline banner, and
      last-known data shown instantly on launch (24 h, per user)
- [x] Public pages: landing, user guide (`/guide`), about (`/about`),
      install guide, global 404

---

# Permissions Matrix

| Action                                     | Manager | Member |
| ------------------------------------------ | :-----: | :----: |
| View dashboard, own balance, activity      |    ✓    |   ✓    |
| View Reports and Months                    |    ✓    |   ✓    |
| Submit bazaar; edit/delete own pending one |    ✓    |   ✓    |
| Approve / reject bazaar                    |    ✓    |        |
| Record / edit meals                        |    ✓    |        |
| Add / edit / delete expenses and deposits  |    ✓    |        |
| Invite, create accounts, remove members    |    ✓    |        |
| Promote, demote, hand over manager role    |    ✓    |        |
| Meal types, mess settings                  |    ✓    |        |
| Start / close months                       |    ✓    |        |

---

# Future Features

- [ ] Connected Accounts: link/unlink Google from Settings (never at login)
- [ ] Reports month selector for closed months (B9)
- [ ] Mess group chat
- [ ] Push notifications
- [ ] Native Android / iOS apps
- [ ] SaaS plans, billing, super-admin dashboard
- [ ] PDF / Excel export, analytics

# Out of Scope (MVP)

Mobile apps, chat, push notifications, billing, exports, advanced analytics,
AI insights.
