# MessMate - Technical Flow

## Overview

MessMate is designed around a month-based accounting system where all meals,
expenses, deposits, and balances are tracked within an active month.

A mess always has exactly one active month.

Managers control the lifecycle of the month.

Members only view data while managers manage operational activities.

---

# System Architecture Flow

```text
User
 ↓
Authentication
 ↓
Mess Selection
 ↓
Active Month
 ↓
Meals
Expenses
Deposits
 ↓
Monthly Calculation
 ↓
Balance Generation
 ↓
New Month Creation
 ↓
Balance Carry Forward
```

---

# User Lifecycle

## User Registration

Users can register using:

- Email & Password
- Google Login

After registration:

```text
User
 ↓
No Mess
 ↓
Waiting State
```

The user dashboard will display:

```text
You are not currently a member of any mess.
```

---

## Manager Created User

Managers can create users directly.

Required fields:

- Name
- Email (must not already exist)
- Password
- Phone (optional)

Flow:

```text
Manager
 ↓
Create Account Page (/dashboard/members/create-account)
 ↓
Fills: Name, Email, Password, Phone
 ↓
POST /users/create-member
 ↓
Backend:
  1. Validates manager role
  2. Creates user (manager_created: true)
  3. Auto-adds to mess as MEMBER
  4. Logs activity: MEMBER_ADDED
 ↓
Redirect to /dashboard/members
```

The created user can then log in with the email/password set by the manager.

---

## Manager Created Account Restriction

Newly created accounts contain:

```text
manager_created = true
```

After first profile completion:

```text
manager_created = false
```

The user can change email only during first account setup.

After setup:

```text
Email becomes locked.
```

---

## Profile API Flow

Authenticated users can manage their profile via:

- GET /users/me - Get current user profile
- PATCH /users/me - Update profile (name, phone)
- PATCH /users/me/password - Change password
- POST /users/create-member - Manager creates member account (MANAGER only)

Profile response includes:

- id
- name
- email
- phone
- avatar
- manager_created
- email_verified

---

# OAuth Account Linking Flow

## Manual Account Linking (Required)

OAuth providers are never automatically linked during login. Account linking
must occur from an authenticated session inside Account Settings.

### Linking Flow

```text
User
↓
Login
↓
Settings
↓
Connected Accounts
↓
Connect Google
↓
Google Consent
↓
Link Success
```

### Auto-Linking Prohibition

```text
Auto-linking during login is prohibited.
```

#### Rationale

- Prevent accidental account linking
- Improve user control over connected identities
- Simplify future OAuth provider support
- Reduce account takeover risk from pre-hijacking attacks

#### Current Behavior (Login with Existing Email)

```text
Google Login
↓
Existing Email Found
↓
Reject Login
↓
Show Message:
"An account with this email already exists. Please sign in with your password first."
```

#### Future Planned Behavior

```text
User Login
↓
Account Settings
↓
Connected Accounts
↓
Connect Google
↓
Google OAuth Consent
↓
Link Account
```

---

# Mess Lifecycle

## Create Mess

Only a manager can create a mess.

Required:

- Mess Name
- Mess Description (optional)
- Initial Meal Configuration

Creator automatically becomes:

```text
MESS_MANAGER
```

---

## Manager Limits

Each mess can have:

```text
Minimum Managers: 1
Maximum Managers: 2
```

All managers have identical permissions.

There is no owner hierarchy.

---

## Manager Permissions

Managers can:

- Add/invite members
- Remove members
- Create member accounts
- Add meals
- Update meals
- Add deposits
- Add expenses
- Approve bazaar submissions
- Assign managers
- Remove managers
- Configure meal settings
- Start a new month

---

# Member Joining Flow

## Existing User Flow (Invite System)

Manager searches for a user by email.

```text
Manager opens Add Member dialog
 ↓
Types email in search
 ↓
User found?
  YES → Show user card → Manager clicks "Send Invite"
           ↓
      POST /invites { email }
           ↓
      Backend:
        1. Validates manager role
        2. Checks: not already member, no pending invite, not previously removed
        3. Creates join_requests row (status: PENDING)
        4. Logs activity: MEMBER_ADDED
           ↓
      Close dialog, show "Invite sent" success

  NO → Show "No account found" message
           ↓
      Link: "Create Account" → /dashboard/members/create-account?email=...
```

## Invited User Accepts

```text
User logs in
 ↓
Dashboard loads
 ↓
usePendingInvites() → GET /invites/pending
 ↓
Backend auto-expires invites older than 7 days
 ↓
Returns remaining PENDING invites
 ↓
InviteBanner renders with Accept/Reject buttons
 ↓
User clicks "Accept"
 ↓
POST /invites/:id/accept
 ↓
Backend transaction:
  1. CREATE mess_members (user → MEMBER)
  2. UPDATE join_requests SET status = ACCEPTED, verified_at = now()
  3. CREATE activity_logs MEMBER_ADDED
 ↓
Invalidate ['members', 'invites'] queries
 ↓
Banner disappears, member appears in table
```

## Invited User Rejects

```text
User clicks "Reject"
 ↓
POST /invites/:id/reject
 ↓
UPDATE join_requests SET status = REJECTED, verified_at = now()
 ↓
Invalidate ['invites'] query
 ↓
Banner disappears
```

## 7-Day Expiry

```text
getPendingInvites(userId) called
 ↓
Find invites WHERE user_id = me AND status = PENDING AND created_at < now() - 7 days
 ↓
UPDATE join_requests SET status = EXPIRED (bulk update)
 ↓
Return remaining PENDING invites
```

---

# Member Removal Flow

Managers can remove members at any time.

When removed:

```text
removed_at IS NOT NULL
```

Effects:

- No new meals
- No new expenses
- No new deposits
- Cannot access current mess

History remains intact.

Old reports remain visible.

---

# Active Month System

## Core Principle

MessMate does NOT automatically create months.

Managers manually control month transitions.

Example:

```text
June 2026
Status: ACTIVE
```

This month remains active until:

```text
Start New Month
```

is executed.

---

# New Month Creation Flow

Manager clicks:

```text
Start New Month
```

System:

```text
Current Month
 ↓
Calculation
 ↓
Final Balances
 ↓
Archive Month
 ↓
Create New Month
```

---

# Balance Carry Forward

Only member balances are carried forward.

Nothing else is carried forward.

Example:

```text
Adal

Deposit: 5000
Bill: 5200

Balance: -200
```

Next month:

```text
Individual Expense

Title:
Previous Month Due

Amount:
200
```

---

Example:

```text
Adal

Deposit: 5500
Bill: 5000

Balance: +500
```

Next month:

```text
Deposit

Title:
Previous Month Balance

Amount:
500
```

---

# Meal System

## Meal Configuration

Meal types are configurable.

Default:

```text
Breakfast
Lunch
Dinner
```

Managers may create:

```text
Sehri
Iftar
Brunch
```

Each meal type contains:

```text
Name
Value
```

Example:

```text
Breakfast = 0.5
Lunch = 1
Dinner = 1
```

These names become the JSONB keys in `meal_entries.meals`.

---

# Daily Meal Entry

Managers add meals using a date-based entry form.

Each member gets one row per date with a JSONB payload.

Example payload:

```json
{
  "breakfast": 0.5,
  "lunch": 1,
  "dinner": 1
}
```

Example:

```text
Date:
2026-06-10

Member: Adal
Meals:
{
  "breakfast": 0.5,
  "lunch": 1,
  "dinner": 1
}

Member: Rahim
Meals:
{
  "breakfast": 0.5,
  "lunch": 1
}
```

System calculates `total_meal` automatically.

Adal:

```text
0.5 + 1 + 1 = 2.5
```

Rahim:

```text
0.5 + 1 = 1.5
```

---

# Meal Update Flow

Managers may edit any meal entry.

Each edit replaces the JSONB payload and recalculates `total_meal`.

Every modification creates:

```text
Activity Log
```

Example:

```text
Fahad updated meal entry

Date:
2026-06-10

Old:
{
  "lunch": 0
}

New:
{
  "lunch": 1,
  "dinner": 1
}

Old total_meal: 0
New total_meal: 2
```

---

# Bazaar Workflow

## Bazaar Submission

Any active member may submit a bazaar.

Required:

- At least one item

Optional:

- Description
- Date

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

Submitted status:

```text
PENDING
```

---

## Bazaar Approval

Managers review submission.

Options:

```text
Approve
Reject
```

After approval:

```text
Expense Created
```

and accounting is updated.

---

# Shared Expense Flow

Examples:

- Gas
- Electricity
- Internet
- Cleaning

Managers select affected members.

Example:

```text
Gas Bill = 1000

Members:
☑ Adal
☑ Rahim
☑ Fahad
```

Distribution:

```text
1000 / 3
```

This member selection becomes permanent.

Future member changes do not affect historical calculations.

---

# Individual Expense Flow

Used for:

- Personal purchases
- Previous month due
- Custom charges

Example:

```text
Adal

Shampoo
150
```

Only affects that member.

---

# Deposit Flow

Managers record deposits.

Example:

```text
Member:
Adal

Amount:
3000
```

Deposit immediately updates balance calculations.

---

# Monthly Calculation Engine

## Membership Eligibility Rule

Before generating any monthly calculation, determine which members participated
in the month.

Active membership rule:

```text
A member is active when removed_at IS NULL
```

Month participation rule:

```sql
SELECT *
FROM mess_members
WHERE joined_at <= month_end
  AND (
    removed_at IS NULL
    OR removed_at >= month_start
  )
```

Scenarios:

- Joined during the month: included.
- Left during the month: included.
- Joined after month end: excluded.
- Left before month start: excluded.

This query is the authoritative source for month summary membership.

---

## Step 1

Calculate total meal cost.

Read all APPROVED bazaars for the month.

```text
Total Bazaar Cost
```

---

## Step 2

Calculate total meals.

```text
Sum of meal_entries.total_meal
for all members for the month
```

---

## Step 3

Meal Rate

Formula:

```text
Meal Rate =
Total Meal Cost
/
Total Meals
```

---

## Step 4

Shared Expenses

```text
Expense
/
Selected Members
```

---

## Step 5

Member Bill

Formula:

```text
(
Member total_meal × Meal Rate
)
+
Shared Expenses
+
Individual Expenses
```

---

## Step 6

Final Balance

Formula:

```text
Deposits
-
Total Bill
```

---

# Dashboard Flow

Managers and members can see:

- Current Meal Rate
- Total Members
- Total Meals
- Total Expenses
- Total Deposits
- Current Balance
- Active Month Status
- Recent Activities

---

# Activity Logging

Every accounting action creates an activity.

Tracked Actions:

- Member Added
- Member Removed
- Meal Added
- Meal Updated
- Bazaar Submitted
- Bazaar Approved
- Expense Added
- Expense Updated
- Deposit Added
- Deposit Updated
- Manager Assigned
- Manager Removed

Each log contains:

```text
Who
What
When
Target
```

Example:

```text
Adal

Updated Expense

Internet Bill

2026-06-15 10:42 PM
```

---

# Future Extensions

Database design must support:

- Group Chat
- Notifications
- Mobile Apps
- SaaS Subscriptions
- Push Notifications
- Analytics
- Report Exports

without major schema redesign.
