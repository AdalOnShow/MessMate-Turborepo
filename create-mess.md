# Create Mess Feature Plan

## Scope
Create Mess feature: authenticated users can create a new mess and become its first manager.

## Decisions
- **Slug**: auto-generated from name (lowercase, hyphenated), unique per mess.
- **Names are immutable**: no update endpoint for now.
- **No initial meal types**: mess created with zero meal types; manager adds them later.
- **Activity log**: on creation, log `MANAGER_ASSIGNED` against the new `mess_members` row. No schema change required.
- **Frontend trigger**: "Create Mess" button on dashboard Quick Actions opens a modal. After success, redirect to dashboard.
- **Return shape**: created mess object plus `current_user_role` and `member_id`.

## Backend Tasks

### 1. Shared DTOs (`packages/shared/src/messes/`)
- `create-mess.dto.ts` — Zod schema: `name` (2-80 chars), `description` (optional, max 300 chars).
- `mess-response.interface.ts` — `id`, `name`, `slug`, `description`, `created_at`, `updated_at`, `current_user_role`, `member_id`.

### 2. Messes Module (`apps/api/src/messes/`)
- `messes.controller.ts`
  - `POST /messes` — authenticated, creates mess, assigns creator as `MANAGER`.
  - `GET /messes/me` — returns the user’s active mess (or first joined mess).
- `messes.service.ts`
  - `createMess(userId, dto)` — transaction: create `messes`, then create `mess_members` with `MANAGER`, then log activity.
  - `getMyMess(userId)` — query with `mess_members` where `removed_at IS NULL`, order by `joined_at DESC`, limit 1.
- `messes.module.ts` — imports `PrismaModule` (or uses `@repo/database`), register controller/service.
- Update `apps/api/src/app.module.ts` — import `MessesModule`.

### 3. Data Flow
1. Validate DTO via global validation pipe.
2. Generate slug from `name` (e.g., `slugify(name)` + append short UUID suffix if collision).
3. Prisma transaction:
   ```ts
   prisma.messes.create({ data: { name, slug, description, created_by: userId } })
       .then(mess =>
         prisma.mess_members.create({
           data: { mess_id: mess.id, user_id: userId, mess_role: 'MANAGER' }
         })
       )
       .then(mm =>
         prisma.activity_logs.create({
           data: {
             mess_id: mm.mess_id,
             actor_id: userId,
             action: 'MANAGER_ASSIGNED',
             entity_type: 'mess_members',
             entity_id: mm.id
           }
         })
       )
   ```
4. Return mess + `current_user_role: 'MANAGER'`.

### 4. Validation & Errors
- `400` if `name` missing/empty.
- `409` if unique constraint fails (slug collision unlikely but handled by DB; translate to 409).
- `401` if unauthenticated (handled by `AuthGuard('jwt')`).

## Frontend Tasks

### 1. Shared Update
- Re-export new mess DTOs from `packages/shared/src/index.ts`.

### 2. API Client (`apps/web/app/lib/api-client.ts`)
- Add `messesApi.create(data)` and `messesApi.getMyMess()` using existing authenticated fetch helper.

### 3. React Query Hooks (`apps/web/app/hooks/`)
- `use-messes.ts` — `useCreateMess`, `useGetMyMess`.

### 4. Dashboard UI (`apps/web/app/dashboard/page.tsx`)
- Update "Quick Actions" card: replace static list with a "Create Mess" primary button.
- Add `CreateMessModal` component (local modal in dashboard page for MVP).
  - Form: name input, description textarea, submit button.
  - On success: `queryClient.invalidateQueries({ queryKey: ['my-mess'] })`, close modal, show success toast (inline text).

### 5. Mess Display
- If user already has an active mess, show a small info banner on dashboard: "Current mess: [name]" instead of or above Create Mess button.

## Documentation Tasks
- Update `context/features.md`: mark "Create Mess" as MVP complete.
- Update `context/process_tracker.md`: check off Phase 3 items for Mess creation.

## Out of Scope (explicitly)
- Update mess / delete mess.
