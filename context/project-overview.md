# MessMate - Project Overview

## Introduction

MessMate is a modern mess management platform designed to simplify meal tracking, expense management, deposit tracking, member management, and monthly accounting for shared living environments such as bachelor messes, hostels, and shared accommodations.

The primary goal of MessMate is to eliminate manual calculations, reduce accounting errors, and provide a transparent system where every member can easily track their meals, expenses, deposits, balances, and monthly reports.

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
- Start a new month.
- Configure meal settings.
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

Members cannot modify accounting data.

---

## Key Features

### Authentication

- Email & Password Login
- Google Login
- JWT Authentication
- Refresh Token Support

---

### Mess Management

- Create Mess
- Join Mess
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

Managers can choose which members will share a specific expense.

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

Meal Rate = Total Meal Cost ÷ Total Meals

Member Bill =

(Member Meals × Meal Rate)

- Shared Expenses
- Individual Expenses

---

### Activity Tracking

Every important action will be recorded.

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
- Multi-Language Support

---

## Technology Stack

### Frontend

- Next.js 16
- TypeScript
- Tailwind CSS
- TanStack Query
- Zustand

### Backend

- NestJS
- Prisma ORM
- PostgreSQL
- JWT Authentication
- Socket.IO (Future Realtime Features)

### Infrastructure

- Docker
- Cloudinary
- Redis
- PostgreSQL

---

## Project Vision

MessMate aims to become a complete mess management and accounting platform that provides transparency, automation, and simplicity for both managers and members while remaining scalable enough to evolve into a full SaaS product in the future.
