# MessMate AI Agent Rules

## Mission

You are contributing to the MessMate project.

MessMate is a production-grade mess management and accounting platform built using:

* Next.js 16
* TypeScript
* NestJS
* Prisma ORM
* PostgreSQL
* Turborepo
* Tailwind CSS
* shadcn/ui

Your goal is to build maintainable, scalable, and production-ready software.

Never optimize for speed of coding at the expense of architecture quality.

---

# Source Of Truth

Always follow documents in this order:

## 1. technical-flow.md

Highest priority for business logic.

Contains:

* Accounting rules
* Month lifecycle
* Member lifecycle
* Balance carry-forward logic
* Approval workflow
* Business requirements

Never violate rules defined in this file.

---

## 2. database-schema.md

Highest priority for database design.

Contains:

* Database structure
* Relations
* Constraints
* Enums
* Indexes

Never invent new database structures without updating this file.

---

## 3. features.md

Feature specification source.

Contains:

* Feature requirements
* Permissions
* Module definitions
* MVP scope

---

## 4. process-tracker.md

Development roadmap.

Contains:

* Current progress
* Task status
* Active phase

Always update task status when work is completed.

---

## 5. design.md

UI and UX source of truth.

Contains:

* Color system
* Design language
* Component styling
* Layout rules
* Spacing rules

Never introduce UI that conflicts with design.md.

---

# Required Skills

Before implementing any feature, load and follow relevant skills.

---

## Frontend UI

Required Skills:

* frontend-design
* ui-ux-pro-max
* web-design-guidelines

Use for:

* Layouts
* Pages
* Components
* Responsive Design
* Accessibility

---

## Next.js

Required Skills:

* nextjs-app-router-patterns
* vercel-react-best-practices

Use for:

* Routing
* Server Components
* Client Components
* Data Fetching
* Performance Optimization

---

## NestJS Backend

Required Skills:

* nestjs-best-practices
* nestjs-patterns

Use for:

* Module Design
* Dependency Injection
* Repository Pattern
* Service Architecture
* Authorization
* Validation

---

# Architecture Rules

Always follow:

* Feature-based architecture
* Modular architecture
* Clean architecture principles
* Separation of concerns
* Single responsibility principle

Never create large files containing unrelated logic.

---

# Monorepo Rules

Project structure:

```text
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

Never place shared code inside apps.

Shared code must live inside packages.

---

# Frontend Rules

Use:

* TypeScript
* App Router
* TanStack Query
* Zustand
* shadcn/ui

Always:

* Create reusable components
* Use feature folders
* Handle loading states
* Handle error states
* Handle empty states

Never:

* Hardcode data
* Duplicate components
* Put business logic in UI

---

# Backend Rules

Use:

* NestJS Modules
* DTO Validation
* Prisma ORM

Always:

* Keep business logic in services
* Validate all requests
* Use proper exceptions
* Log important actions

Never:

* Put business logic in controllers
* Skip validation
* Directly expose database models

---

# Database Rules

Use:

* Prisma
* PostgreSQL

Always:

* Use soft delete
* Create indexes where needed
* Follow database-schema.md

Never:

* Remove historical accounting data
* Break month history
* Recalculate historical expenses

---

# Accounting Rules

Critical Section.

Never modify without updating technical-flow.md.

Rules:

* Historical months are immutable
* Member balances carry forward
* Historical expenses never recalculate
* Removed members keep history
* Every accounting action must be traceable

---

# Activity Logging

Every accounting action must create activity logs.

Examples:

* Member Added
* Member Removed
* Meal Added
* Meal Updated
* Expense Added
* Expense Updated
* Deposit Added
* Deposit Updated
* Bazaar Approved
* Manager Assigned

Never bypass activity logging.

---

# Security Rules

Always:

* Validate inputs
* Sanitize user data
* Use authorization guards
* Protect routes
* Hash passwords

Never:

* Store plain text passwords
* Trust client data
* Expose sensitive information

---

# Code Quality Rules

Always:

* Use strict TypeScript
* Use meaningful names
* Remove dead code
* Write self-documenting code

Never:

* Use any
* Leave TODO comments without tracker updates
* Introduce duplicate logic

---

# Performance Rules

Always:

* Paginate large data
* Select only required fields
* Use database indexes
* Use React Query caching

Never:

* Fetch unnecessary data
* Create N+1 query problems
* Over-fetch relations

---

# Documentation Rules

Whenever architecture changes:

Update:

* technical-flow.md
* database-schema.md
* features.md

If implementation status changes:

Update:

* process-tracker.md

Documentation must stay synchronized with code.

---

# Decision Hierarchy

When conflicts occur:

1. technical-flow.md
2. database-schema.md
3. features.md
4. process-tracker.md
5. design.md

Follow the highest priority document.

---

# Definition Of Done

A task is NOT complete until:

* Backend implemented
* Frontend implemented
* Validation implemented
* Authorization implemented
* Activity logging implemented
* Error handling implemented
* Loading states implemented
* Empty states implemented
* Documentation updated
* process-tracker.md updated

Only then mark the task complete.
