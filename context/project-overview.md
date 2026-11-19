# MessMate - Project Overview

## Introduction

MessMate is a modern mess management platform designed to simplify meal tracking, expense management, deposit tracking, member management, and monthly accounting for shared living environments such as bachelor messes, hostels, and shared accommodations.

The primary goal of MessMate is to eliminate manual calculations, reduce accounting errors, and provide a transparent system where every member can easily track their meals, expenses, deposits, balances, and monthly reports.

**Status (Nov 2026):** live at https://messmate.sadal.dev and launch-ready
after five rounds of pre-production QA. English and Bangla, installable as a
PWA.

The platform is being designed with a SaaS-ready architecture, allowing future expansion into a multi-tenant mess management solution without requiring major system redesign.

---

## Core Objectives

- Simplify meal management.
- Automate monthly bill calculation.
- Track deposits and balances.
- Manage shared and individual expenses.
- Maintain transparent accounting.
- Keep a complete activity history.
- Provide role-based management.
- Support future mobile applications.
- Support future SaaS expansion.

---

## User Roles

### System Admin

System administrators are responsible for managing the overall SaaS platform.

Responsibilities:

- Manage platform settings.
- Manage global configurations.
- Monitor platform usage.
- Manage future subscription plans.

> System Admin does not participate in day-to-day mess operations.

---

### Mess Manager

Mess managers are responsible for operating a specific mess.

Responsibilities:

- Create and manage a mess.
- Add and remove members.
- Assign or remove manager permissions.
- Record meals.
- Manage expenses.
- Manage deposits.
- Approve or reject bazaar submissions.
- Start a new month (which closes the current one).
- Configure meal settings.
- Hand the manager role over to another member.
- Review activity history.

Each mess can have a maximum of **two managers**.

All managers have equal permissions.

---

### Member

Members are regular users of a mess.

Responsibilities:

- View meals.
- View expenses.
- View deposits.
- View balances.
- View monthly reports.
- View activity history.
- Submit bazaar purchases for approval.

Members cannot change any other accounting data.

---

## Key Features

### Authentication

- Email & Password Login
- Google Login
- httpOnly cookie sessions: 7-day access tokens, rotating 30-day refresh
  tokens, revocable per device

---

### Mess Management

- Create Mess
- Join Mess by invite, or get an account created by the manager
- Member Management
- Manager Management
- Active Member Tracking
- Member History Tracking

---

### Meal Management

- Daily Meal Entry
- Custom Meal Types
- Bulk Meal Entry
- Meal Updates
- Meal History

---

### Expense Management

#### Bazaar Expenses

- Bazaar Submission
- Structured Item List (JSONB)
- Bazaar Approval Workflow
- Bazaar History

#### Shared Expenses

Examples:

- Gas
- Electricity
- Internet
- Utility Bills

Managers choose which members share an expense; it is split equally to the
paisa.

#### Individual Expenses

Examples:

- Previous Due
- Personal Purchases
- Custom Charges

Expenses can be assigned to specific members.

---

### Deposit Management

- Member Deposit Tracking
- Deposit History
- Balance Calculation
- Carry Forward Support

---

### Monthly Accounting

- Automatic Meal Rate Calculation
- Automatic Bill Calculation
- Member-wise Summary
- Monthly Report
- Balance Carry Forward

Formula:

```text
Meal Rate   = Total Bazaar Cost ÷ Total Meals
Member Bill = Meal Cost (bazaar split by meals) + Shared + Individual
Balance     = Deposits − Member Bill
```

---

### Activity Tracking

Every important action is recorded, in the same transaction as the change.
Activity is kept for 12 months.

Examples:

- Member Joined
- Member Removed
- Meal Added
- Meal Updated
- Expense Added
- Expense Updated
- Deposit Added
- Manager Assigned
- Manager Removed

Each activity will store the responsible user.

---

### Reports

- Active Month Report
- Previous Month Reports
- Member Summary
- Expense Summary
- Deposit Summary
- Balance Summary

---

## Future Roadmap

### Phase 2

- Real-time Group Chat
- Push Notifications
- File Sharing
- PDF Export
- Excel Export

### Phase 3

- Mobile Application
- Subscription Plans
- Advanced Analytics
- Smart Financial Insights

(Multi-language support, English and Bangla, already shipped.)

---

## Technology Stack

### Frontend

- Next.js 16 (App Router; dashboard prerendered as static pages)
- TypeScript
- Tailwind CSS v4 (custom design system, Radix primitives, Lucide icons)
- TanStack Query (with a per-user offline cache)
- Zustand
- next-intl (English, Bangla)

### Backend

- NestJS 11
- Prisma 7.8 ORM with the Neon adapter
- PostgreSQL
- Passport (JWT, Google OAuth), sessions in `user_sessions`
- Zod validation shared through `@repo/shared`
- Socket.IO (future realtime features)

### Infrastructure

- Turborepo + pnpm monorepo
- Vercel (web and API as serverless functions)
- Neon PostgreSQL
- Redis read-through cache (optional)
- Cloudinary (avatars)
- Cloudflare (DNS, in front of messmate.sadal.dev)
- GitHub Actions CI (build, lint, check-types)

---

## Project Vision

MessMate aims to become a complete mess management and accounting platform that provides transparency, automation, and simplicity for both managers and members while remaining scalable enough to evolve into a full SaaS product in the future.
