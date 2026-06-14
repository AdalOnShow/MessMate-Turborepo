# MessMate AI Agent Rules

## Mission

You are contributing to the MessMate project.

MessMate is a production-grade mess management and accounting platform built
using:

- Next.js 16
- TypeScript
- NestJS
- Prisma ORM
- PostgreSQL
- Turborepo
- Tailwind CSS
- shadcn/ui

Your goal is to build maintainable, scalable, and production-ready software.

Never optimize for speed of coding at the expense of architecture quality.

---

# Source Of Truth

Always follow documents in this order:

## 1. technical-flow.md

Highest priority for business logic.

Contains:

- Accounting rules
- Month lifecycle
- Member lifecycle
- Balance carry-forward logic
- Approval workflow
- Business requirements

Never violate rules defined in this file.

---

## 2. database-schema.md

Highest priority for database design.

Contains:

- Database structure
- Relations
- Constraints
- Enums
- Indexes

Never invent new database structures without updating this file.

---

## 3. features.md

Feature specification source.

Contains:

- Feature requirements
- Permissions
- Module definitions
- MVP scope

---

## 4. process-tracker.md

Development roadmap.

Contains:

- Current progress
- Task status
- Active phase

Always update task status when work is completed.

---

## 5. design.md

UI and UX source of truth.

Contains:

- Color system
- Design language
- Component styling
- Layout rules
- Spacing rules

Never introduce UI that conflicts with design.md.

---

# Required Skills

Before implementing any feature, load and follow relevant skills.

## Monorepo & Workspace Management

### Required Skills:

- turborepo
- monorepo-management

### When to load these skills:

Whenever working with:

- workspace architecture
- package management
- shared libraries
- build pipelines
- task orchestration
- dependency management

---

## Frontend UI

Required Skills:

- frontend-design
- ui-ux-pro-max
- web-design-guidelines

Use for:

- Layouts
- Pages
- Components
- Responsive Design
- Accessibility

---

## Next.js

Required Skills:

- nextjs-app-router-patterns
- vercel-react-best-practices

Use for:

- Routing
- Server Components
- Client Components
- Data Fetching
- Performance Optimization

---

## NestJS Backend

Required Skills:

- nestjs-best-practices
- nestjs-patterns

Use for:

- Module Design
- Dependency Injection
- Repository Pattern
- Service Architecture
- Authorization
- Validation

---

## Database & Shared Packages

Describe and follow shared-package boundaries:

- packages/database
- packages/shared-types
- packages/validation
- packages/constants
- packages/shared-utils

Rules:

- Shared code must live in **packages/**.
- Shared logic must never be duplicated between apps—extract into **packages/**.

---

# Architecture Rules

Always follow:

- Feature-based architecture
- Modular architecture
- Clean architecture principles
- Separation of concerns
- Single responsibility principle

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

- TypeScript
- App Router
- TanStack Query
- Zustand
- shadcn/ui

Always:

- Create reusable components
- Use feature folders
- Handle loading states
- Handle error states
- Handle empty states

Never:

- Hardcode data
- Duplicate components
- Put business logic in UI

---

# Backend Rules

Use:

- NestJS Modules
- DTO Validation
- Prisma ORM

Always:

- Keep business logic in services
- Validate all requests
- Use proper exceptions
- Log important actions (with emoji prefixes)
- Use `@nestjs/common` Logger in every service and controller
- Use `res.status().json()` when `@Res()` decorator is used (never bare
  `return`)

Never:

- Put business logic in controllers
- Skip validation
- Directly expose database models
- Suppress logs in production (use `logger: false` in `NestFactory.create` for
  production)

### Logging Convention (Emoji Prefixes)

Every new NestJS service and controller MUST include a `Logger` instance and log
all actions with emoji prefixes.

**Required pattern:**

```typescript
private readonly logger = new Logger(ClassName.name);
```

**Emoji guide:**

| Emoji | Use for                                                  |
| ----- | -------------------------------------------------------- |
| ✅    | Success events (created, updated, deleted, logged in)    |
| ❌    | Errors (failures, exceptions, critical issues)           |
| ⚠️    | Warnings (not found, validation issues, fallbacks)       |
| 📝    | Creation attempts (signup, create record)                |
| 🔍    | Read/fetch operations (find, query, lookup)              |
| 🔑    | Token/auth operations (token issued, refreshed)          |
| 🔐    | Authentication events (login attempt, login success)     |
| 🔄    | Update/refresh operations (token refresh, status change) |
| 🚪    | Logout / teardown events                                 |
| 📊    | Analytics / aggregation operations                       |

**Examples:**

```typescript
// Service
this.logger.log(`📝 Creating expense for month: ${monthId}`);
this.logger.log(`✅ Expense created: ${expense.id}`);
this.logger.warn(`⚠️ Month not found: ${monthId}`);
this.logger.error(`❌ Failed to create expense: ${error.message}`);

// Controller
this.logger.log(`📝 POST /api/expenses - user: ${userId}`);
this.logger.log(`✅ Expense created successfully: ${expenseId}`);
this.logger.error(`❌ POST /api/expenses failed: ${error.message}`);
```

**Production behavior:**

In `main.ts`, configure the NestJS logger to suppress all output in production:

```typescript
const app = await NestFactory.create(AppModule, {
  logger: isDev ? ["log", "error", "warn", "debug", "verbose"] : false,
});
```

The `LoggingInterceptor` (request/response logging) is only registered in
development mode.

---

# Database Rules

Use:

- Prisma
- PostgreSQL

Always:

- Use soft delete
- Create indexes where needed
- Follow database-schema.md

Never:

- Remove historical accounting data
- Break month history
- Recalculate historical expenses

---

# Accounting Rules

Critical Section.

Never modify without updating technical-flow.md.

Rules:

- Historical months are immutable
- Member balances carry forward
- Historical expenses never recalculate
- Removed members keep history
- Every accounting action must be traceable

---

# Activity Logging

Every accounting action must create activity logs.

Examples:

- Member Added
- Member Removed
- Meal Added
- Meal Updated
- Expense Added
- Expense Updated
- Deposit Added
- Deposit Updated
- Bazaar Approved
- Manager Assigned

Never bypass activity logging.

---

# Security Rules

Always:

- Validate inputs
- Sanitize user data
- Use authorization guards
- Protect routes
- Hash passwords
- Apply rate limiting on authentication endpoints
- Store JWT tokens in httpOnly cookies only (never in client-side storage)

Never:

- Store plain text passwords
- Trust client data
- Expose sensitive information
- Store access tokens in Zustand or localStorage

### Rate Limiting

The API uses `@nestjs/throttler` for rate limiting:

- **Global default:** 10 requests per minute
- **Auth endpoints (signup/signin):** 5 requests per minute

When adding new endpoints, consider rate limiting for:

- Public endpoints
- Resource-intensive operations
- File upload endpoints

### JWT Token Storage

Access tokens are stored exclusively in httpOnly cookies:

- **Server-side (Next.js Server Actions):** Tokens set via `cookies().set()`
- **Client-side:** Uses `credentials: 'include'` in fetch requests
- **Never store in:** Zustand, localStorage, sessionStorage, or React state

This prevents XSS attacks from accessing tokens.

---

# CI/CD Rules

The project uses GitHub Actions for CI/CD:

- **Trigger:** Push to `main` branch or pull requests
- **Build:** Turborepo with remote caching
- **Deployment:** Vercel (web) and Vercel (API - serverless)

When modifying build pipeline:

1. Update `turbo.json` for task configuration
2. Test locally with `pnpm turbo build --filter=[origin/main]`
3. Verify CI passes before merging

---

# Environment Variables

Environment variables are managed as follows:

- **Root `.env`:** Shared variables (DATABASE_URL)
- **`apps/api/.env`:** API-specific variables (JWT secrets, CORS, PORT)
- **`packages/database/.env`:** Deprecated (use root `.env`)

When adding new environment variables:

1. Add to `.env.example` files
2. Document in deployment guide
3. Add to CI/CD secrets if sensitive

---

# Code Quality Rules

Always:

- Use strict TypeScript
- Use meaningful names
- Remove dead code
- Write self-documenting code

Never:

- Use any
- Leave TODO comments without tracker updates
- Introduce duplicate logic

---

# Performance Rules

Always:

- Paginate large data
- Select only required fields
- Use database indexes
- Use React Query caching

Never:

- Fetch unnecessary data
- Create N+1 query problems
- Over-fetch relations

---

# Documentation Rules

Whenever architecture changes:

Update:

- technical-flow.md
- database-schema.md
- features.md

If implementation status changes:

Update:

- process-tracker.md

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

- Backend implemented
- Frontend implemented
- Validation implemented
- Authorization implemented
- Activity logging implemented
- Error handling implemented
- Loading states implemented
- Empty states implemented
- Documentation updated
- process-tracker.md updated

Only then mark the task complete.
