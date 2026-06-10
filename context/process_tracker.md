# MessMate - Process Tracker

## Project Status

```text
Project Name: MessMate

Status: Planning Phase

Frontend:
Next.js 16
TypeScript
Tailwind CSS
TanStack Query
Zustand
shadcn/ui

Backend:
NestJS
Prisma
PostgreSQL
JWT Authentication

Architecture:
Turborepo Monorepo
```

---

# Phase 0 - Project Foundation

## Monorepo Setup

* [ ] Initialize Turborepo
* [ ] Configure pnpm workspace
* [ ] Create apps/web
* [ ] Create apps/api
* [ ] Create packages/database
* [ ] Create packages/shared-types
* [ ] Create packages/shared-utils
* [ ] Create packages/validation
* [ ] Create packages/constants

---

## Tooling Setup

* [ ] ESLint
* [ ] Prettier
* [ ] Husky
* [ ] Commitlint
* [ ] Environment Validation
* [ ] Path Aliases

---

## Documentation

* [x] project-overview.md
* [x] technical-flow.md
* [x] database-schema.md
* [x] features.md
* [ ] API Documentation

---

# Phase 1 - Database Layer

## PostgreSQL Setup

* [ ] Configure PostgreSQL
* [ ] Configure Prisma
* [ ] Create Prisma Client Package

---

## Schema Implementation

### Core

* [ ] users
* [ ] oauth_accounts
* [ ] messes
* [ ] mess_members

### Month System

* [ ] months

### Meal System

* [ ] meal_types
* [ ] meal_entries
* [ ] meal_entry_items

### Bazaar System

* [ ] bazaar_submissions
* [ ] bazaar_items

### Expense System

* [ ] expenses
* [ ] expense_members

### Deposit System

* [ ] deposits

### Accounting System

* [ ] member_month_summaries
* [ ] carry_forward_balances

### Activity System

* [ ] activity_logs

### Notification System

* [ ] notifications

### Join Request System

* [ ] join_requests

---

## Database Tasks

* [ ] Create Enums
* [ ] Create Indexes
* [ ] Configure Soft Deletes
* [ ] Seed Initial Data
* [ ] Generate Prisma Client

---

# Phase 2 - Authentication Module

## Backend

* [ ] Register API
* [ ] Login API
* [ ] Refresh Token API
* [ ] Logout API

---

## OAuth

* [ ] Google Login
* [ ] Facebook Login

---

## Profile

* [ ] Get Profile
* [ ] Update Profile
* [ ] Update Password
* [ ] Upload Avatar

---

## Manager Created Account

* [ ] Create Member Account
* [ ] Temporary Password Flow
* [ ] First Time Setup Flow
* [ ] One Time Email Update Logic

---

# Phase 3 - Mess Management

## Mess

* [ ] Create Mess
* [ ] Update Mess
* [ ] View Mess

---

## Members

* [ ] Add Member
* [ ] Remove Member
* [ ] Active Members List
* [ ] Removed Members List

---

## Manager Assignment

* [ ] Assign Manager
* [ ] Remove Manager
* [ ] Enforce Max Two Managers

---

## Join Request

* [ ] Generate Verification Code
* [ ] Redis Storage
* [ ] Verify Join Request
* [ ] Join Request History

---

# Phase 4 - Month Management

## Active Month

* [ ] Create Month
* [ ] Get Active Month
* [ ] Active Month Dashboard

---

## Month Closing

* [ ] Calculate Final Summary
* [ ] Generate Member Summary
* [ ] Generate Carry Forward Balances
* [ ] Archive Month

---

## Month History

* [ ] View Previous Months
* [ ] View Archived Reports

---

# Phase 5 - Meal Management

## Meal Types

* [ ] Create Meal Type
* [ ] Update Meal Type
* [ ] Disable Meal Type

---

## Meal Entry

* [ ] Create Daily Meal Entry
* [ ] Bulk Meal Entry
* [ ] Update Meal Entry
* [ ] Delete Meal Entry

---

## Meal Reports

* [ ] Daily Meal Report
* [ ] Member Meal Report
* [ ] Monthly Meal Report

---

# Phase 6 - Bazaar Management

## Bazaar Submission

* [ ] Submit Bazaar
* [ ] Add Bazaar Items
* [ ] Edit Bazaar Submission

---

## Bazaar Approval

* [ ] Approve Bazaar
* [ ] Reject Bazaar

---

## Bazaar History

* [ ] Submitted Bazaar List
* [ ] Approved Bazaar List
* [ ] Rejected Bazaar List

---

# Phase 7 - Expense Management

## Shared Expenses

* [ ] Create Shared Expense
* [ ] Select Members
* [ ] Allocate Expense
* [ ] Update Expense

---

## Individual Expenses

* [ ] Create Individual Expense
* [ ] Assign Member
* [ ] Update Individual Expense

---

## Expense Reports

* [ ] Expense Summary
* [ ] Expense History
* [ ] Member Expense Breakdown

---

# Phase 8 - Deposit Management

## Deposits

* [ ] Add Deposit
* [ ] Update Deposit
* [ ] Deposit History

---

## Reports

* [ ] Member Deposit Summary
* [ ] Monthly Deposit Summary

---

# Phase 9 - Accounting Engine

## Meal Rate Calculation

* [ ] Calculate Total Meals
* [ ] Calculate Total Meal Cost
* [ ] Calculate Meal Rate

---

## Bill Calculation

* [ ] Shared Cost Calculation
* [ ] Individual Cost Calculation
* [ ] Deposit Calculation
* [ ] Final Balance Calculation

---

## Carry Forward

* [ ] Previous Due Logic
* [ ] Previous Balance Logic

---

# Phase 10 - Dashboard

## Manager Dashboard

* [ ] Current Month
* [ ] Total Members
* [ ] Total Meals
* [ ] Total Deposits
* [ ] Total Expenses
* [ ] Meal Rate
* [ ] Balance
* [ ] Recent Activities

---

## Member Dashboard

* [ ] Personal Meals
* [ ] Personal Deposits
* [ ] Personal Expenses
* [ ] Personal Balance
* [ ] Bazaar Information
* [ ] Monthly Summary

---

# Phase 11 - Activity Logs

## Logging

* [ ] Member Added
* [ ] Member Removed
* [ ] Meal Added
* [ ] Meal Updated
* [ ] Expense Added
* [ ] Expense Updated
* [ ] Deposit Added
* [ ] Deposit Updated
* [ ] Bazaar Submitted
* [ ] Bazaar Approved
* [ ] Manager Assigned
* [ ] Manager Removed

---

## Activity Feed

* [ ] Recent Activities API
* [ ] Activity Feed UI

---

# Phase 12 - Reports

## Member Reports

* [ ] Member Summary
* [ ] Member Balance
* [ ] Member Expenses

---

## Month Reports

* [ ] Monthly Summary
* [ ] Meal Summary
* [ ] Expense Summary
* [ ] Deposit Summary

---

# Future Features

## Notifications

* [ ] In-App Notifications
* [ ] Activity Notifications

---

## Chat

* [ ] Group Chat
* [ ] Message History
* [ ] File Sharing

---

## Mobile

* [ ] React Native App
* [ ] Android App
* [ ] iOS App

---

## SaaS

* [ ] Subscription Plans
* [ ] Billing System
* [ ] Super Admin Dashboard

---

# Definition of Done

A task can be marked complete only if:

* [ ] Backend API completed
* [ ] Frontend UI completed
* [ ] Validation completed
* [ ] Authorization completed
* [ ] Activity logging implemented
* [ ] Error handling implemented
* [ ] Loading states implemented
* [ ] Empty states implemented
* [ ] Documentation updated

---

# Current Focus

```text
Current Phase:
Phase 0

Current Priority:
Project Setup
Database Design
Authentication Foundation
```
