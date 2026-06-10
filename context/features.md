# MessMate - Features Specification

## Overview

This document defines all MVP features, modules, permissions, and future
features of MessMate.

The purpose of this document is to provide a clear feature reference for
developers, AI coding agents, and future contributors.

---

# MVP Features

## Authentication

### User Registration

- Register using email and password
- Register using Google account
- Register using Facebook account

### User Login

- Email login
- Google login
- Facebook login

### Account Security

- JWT authentication
- Refresh token support
- Protected routes
- Session management

### Profile Management

- Update name
- Update avatar
- Update phone number
- Update password

---

# User Management

## User Profile

Required Fields:

- Name
- Email

Optional Fields:

- Avatar
- Phone

### Manager Created Account

Managers can create accounts for members.

Features:

- Create member account
- Generate temporary password
- Share credentials with member
- First-time profile completion
- One-time email update

---

# Mess Management

## Create Mess

Managers can:

- Create a mess
- Configure initial settings
- Become first manager automatically

---

## Mess Membership

Features:

- Add member
- Remove member
- View active members
- View removed members
- Membership history tracking

---

## Join Verification

Features:

- Search existing user
- Send join request
- Generate 6-digit verification code
- Redis verification flow
- Join request history

---

## Manager Management

Features:

- Assign manager
- Remove manager
- Maximum 2 managers per mess
- Equal permissions for all managers

---

# Dashboard

## Manager Dashboard

Display:

- Current Month Name
- Current Month Status
- Total Members
- Total Meals
- Total Expenses
- Total Deposits
- Meal Rate
- Current Month Balance
- Recent Activities

---

## Member Dashboard

Display:

- Personal Total Meals
- Personal Deposits
- Personal Expenses
- Personal Balance
- Current Meal Rate
- Bazaar Due Information
- Monthly Summary

---

# Month Management

## Active Month

Features:

- View active month
- View month details
- Track monthly statistics

---

## Start New Month

Features:

- Manual month creation
- Close previous month
- Generate summaries
- Carry forward balances
- Archive previous month

---

## Previous Months

Features:

- View historical months
- View archived reports
- View member summaries

---

# Meal Management

## Meal Types

Features:

- Dynamic meal types
- Custom meal values
- Enable/disable meal types

Examples:

- Breakfast
- Lunch
- Dinner
- Sehri
- Iftar

---

## Meal Entry

Features:

- Daily meal entry
- Bulk meal update
- Per-member meal tracking
- Date-based meal records

---

## Meal Updates

Features:

- Edit meals
- Recalculate totals
- Create activity logs

---

## Meal Reports

Features:

- Daily meal report
- Member meal report
- Monthly meal summary

---

# Bazaar Management

## Bazaar Submission

Members can:

- Submit bazaar
- Add item list
- Add description
- Select date

Requirements:

- Minimum one item required

---

## Bazaar Approval

Managers can:

- Approve bazaar
- Reject bazaar

After approval:

- Expense is automatically created

---

## Bazaar History

Features:

- View submitted bazaars
- View approved bazaars
- View rejected bazaars

---

# Expense Management

## Shared Expenses

Examples:

- Gas Bill
- Electricity Bill
- Internet Bill
- Cleaning Cost

Features:

- Create expense
- Select affected members
- Fixed allocation tracking
- Edit expense

---

## Individual Expenses

Examples:

- Previous Month Due
- Personal Purchase
- Custom Charge

Features:

- Assign expense to member
- Edit expense
- View expense history

---

## Expense Reports

Features:

- Expense summary
- Expense history
- Member expense breakdown

---

# Deposit Management

## Deposits

Features:

- Add deposit
- Edit deposit
- View deposit history

---

## Deposit Reports

Features:

- Member deposit summary
- Monthly deposit summary
- Deposit history

---

# Balance Management

## Automatic Balance Calculation

Formula:

```text
Balance =
Deposits
-
(
Meal Cost
+
Shared Cost
+
Individual Cost
)
```

---

## Balance Carry Forward

Positive Balance:

- Converted into deposit next month

Negative Balance:

- Converted into individual expense next month

---

# Activity Logs

## Tracked Events

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

---

## Activity Log Details

Each activity stores:

- Actor
- Action
- Target Entity
- Timestamp
- Previous Value (if applicable)
- New Value (if applicable)

---

# Reports

## Monthly Reports

Features:

- Monthly summary
- Member summary
- Meal summary
- Expense summary
- Deposit summary
- Balance summary

---

## Historical Reports

Features:

- Previous month reports
- Archived reports
- Member accounting history

---

# Notifications

Status:

```text
Future Feature
```

Planned Features:

- In-app notifications
- Push notifications
- Activity alerts

---

# Chat System

Status:

```text
Future Feature
```

Planned Features:

- Mess group chat
- Message history
- File sharing

---

# Mobile Application

Status:

```text
Future Feature
```

Planned Platforms:

- Android
- iOS

---

# SaaS Features

Status:

```text
Future Feature
```

Planned Features:

- Subscription plans
- Usage limits
- Billing system
- Super admin dashboard

---

# Permissions Matrix

## Manager

Allowed:

- Manage members
- Manage managers
- Manage meals
- Manage expenses
- Manage deposits
- Manage months
- Approve bazaars
- View reports

---

## Member

Allowed:

- View meals
- View expenses
- View deposits
- View balances
- Submit bazaar
- View reports

Not Allowed:

- Modify accounting data
- Manage members
- Manage managers
- Manage months

---

# Technical Notes

Frontend:

- Next.js 16
- TypeScript
- Tailwind CSS
- TanStack Query
- Zustand
- shadcn/ui

Backend:

- NestJS
- Prisma ORM
- PostgreSQL
- JWT Authentication

Infrastructure:

- Docker
- Redis
- Cloudinary

---

# Out of Scope (MVP)

- Mobile App
- Chat System
- Push Notifications
- Subscription Billing
- PDF Export
- Excel Export
- Advanced Analytics
- AI Insights
