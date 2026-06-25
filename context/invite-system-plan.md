# MessMate — Invite System Implementation Plan

## Overview

Replace the current direct `addMember` flow with a **DB-only invite system**
using the existing `join_requests` table. No Redis, no schema changes, no
email service. The invited user must explicitly **Accept** or **Reject** before
a `mess_members` row is created.

---

## Current State

| Component | Status |
|-----------|--------|
| `join_requests` table | Exists in Prisma schema, unused |
| Backend member endpoints | Direct add/remove/role (no invite step) |
| Frontend Members page | AddMemberDialog → immediate create |
| Dashboard notifications | None |
| Create member account page | None |

## Goal

- Manager searches user → invites them
- Non-registered user → manager creates account first
- Invited user sees **notification banner** on dashboard
- User clicks **Accept** → becomes member
- User clicks **Reject** → invite cancelled

---

# Backend Implementation

## 1. New Module: `InvitesModule`

File: `apps/api/src/invites/invites.module.ts`

```ts
import { Module } from '@nestjs/common';
import { InvitesController } from './invites.controller';
import { InvitesService } from './invites.service';

@Module({
  controllers: [InvitesController],
  providers: [InvitesService],
})
export class InvitesModule {}
```

Register in `apps/api/src/app.module.ts`:

```ts
import { InvitesModule } from './invites/invites.module';

@Module({
  imports: [
    // ... existing imports
    InvitesModule,
    UsersModule,
    MessesModule,
  ],
})
export class AppModule {}
```

---

## 2. Invite Service

File: `apps/api/src/invites/invites.service.ts`

```ts
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, prisma } from '@repo/database';
import type { UserProfile } from '../users/users.service';

type JoinRequestWithMess = {
  id: string;
  mess_id: string;
  user_id: string;
  requested_by: string;
  status: string;
  verified_at: string | null;
  created_at: string;
  mess: { id: string; name: string; slug: string };
  requested_by_user: { id: string; name: string; email: string };
};

type PendingInvite = {
  id: string;
  mess_id: string;
  mess_name: string;
  requested_by: string;
  requester_name: string;
  requester_email: string;
  created_at: string;
};

@Injectable()
export class InvitesService {
  async inviteUser(
    messId: string,
    actorId: string,
    userEmail: string,
  ): Promise<PendingInvite> {
    const user = await prisma.users.findFirst({
      where: { email: userEmail.trim().toLowerCase(), deleted_at: null },
      select: { id: true, name: true, email: true },
    });

    if (!user) {
      throw new NotFoundException(
        'User not found. Create an account for this email first.',
      );
    }

    await this.ensureCanInvite(messId, actorId, user.id);

    const request = await prisma.join_requests.create({
      data: {
        mess_id: messId,
        user_id: user.id,
        requested_by: actorId,
        status: 'PENDING',
      },
      include: {
        mess: { select: { id: true, name: true, slug: true } },
        requested_by_user: { select: { id: true, name: true, email: true } },
      },
    });

    await prisma.activity_logs.create({
      data: {
        mess_id: messId,
        actor_id: actorId,
        action: 'MEMBER_ADDED',
        entity_type: 'join_requests',
        entity_id: request.id,
      },
    });

    return {
      id: request.id,
      mess_id: request.mess_id,
      mess_name: request.mess.name,
      requested_by: request.requested_by,
      requester_name: request.requested_by_user.name,
      requester_email: request.requested_by_user.email,
      created_at: request.created_at.toISOString(),
    };
  }

  async acceptInvite(
    inviteId: string,
    userId: string,
  ): Promise<{ success: true }> {
    const invite = await prisma.join_requests.findFirst({
      where: { id: inviteId, user_id: userId, status: 'PENDING' },
      include: { mess: true },
    });

    if (!invite) {
      throw new BadRequestException('Invite not found or already processed');
    }

    await prisma.$transaction(async (tx) => {
      await tx.mess_members.create({
        data: {
          mess_id: invite.mess_id,
          user_id: userId,
          mess_role: 'MEMBER',
        },
      });

      await tx.join_requests.update({
        where: { id: inviteId },
        data: { status: 'ACCEPTED', verified_at: new Date() },
      });

      await tx.activity_logs.create({
        data: {
          mess_id: invite.mess_id,
          actor_id: userId,
          action: 'MEMBER_ADDED',
          entity_type: 'mess_members',
          entity_id: invite.mess_id,
        },
      });
    });

    return { success: true };
  }

  async rejectInvite(inviteId: string, userId: string): Promise<{ success: true }> {
    const invite = await prisma.join_requests.findFirst({
      where: { id: inviteId, user_id: userId, status: 'PENDING' },
    });

    if (!invite) {
      throw new BadRequestException('Invite not found or already processed');
    }

    await prisma.join_requests.update({
      where: { id: inviteId },
      data: { status: 'REJECTED', verified_at: new Date() },
    });

    return { success: true };
  }

  async getPendingInvites(userId: string): Promise<PendingInvite[]> {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    await prisma.join_requests.updateMany({
      where: {
        user_id: userId,
        status: 'PENDING',
        created_at: { lt: sevenDaysAgo },
      },
      data: { status: 'EXPIRED' },
    });

    const invites = await prisma.join_requests.findMany({
      where: { user_id: userId, status: 'PENDING' },
      include: {
        mess: { select: { id: true, name: true, slug: true } },
        requested_by_user: { select: { id: true, name: true, email: true } },
      },
      orderBy: { created_at: 'desc' },
    });

    return invites.map((r) => ({
      id: r.id,
      mess_id: r.mess_id,
      mess_name: r.mess.name,
      requested_by: r.requested_by,
      requester_name: r.requested_by_user.name,
      requester_email: r.requested_by_user.email,
      created_at: r.created_at.toISOString(),
    }));
  }

  async ensureCanInvite(messId: string, actorId: string, targetUserId: string) {
    const membership = await prisma.mess_members.findFirst({
      where: {
        mess_id: messId,
        user_id: targetUserId,
        deleted_at: null,
      },
    });

    if (membership && membership.removed_at === null) {
      throw new ConflictException('User is already an active member of this mess');
    }

    if (membership && membership.removed_at !== null) {
      throw new ConflictException(
        'User was previously removed. Ask them to request re-entry.',
      );
    }

    const pending = await prisma.join_requests.findFirst({
      where: {
        mess_id: messId,
        user_id: targetUserId,
        status: 'PENDING',
      },
    });

    if (pending) {
      throw new ConflictException('An invite is already pending for this user');
    }
  }
}
```

---

## 3. Invite Controller

File: `apps/api/src/invites/invites.controller.ts`

| Method | Path | Auth | Permission | Description |
|--------|------|------|------------|-------------|
| POST | `/invites` | JWT + MANAGER | Send invite | Invite existing user |
| GET | `/invites/pending` | JWT | Any user | List my pending invites |
| POST | `/invites/:id/accept` | JWT | Any user | Accept invite |
| POST | `/invites/:id/reject` | JWT | Any user | Reject invite |

```ts
import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Request } from 'express';
import { AuthUser } from '../auth/auth.service';
import { Roles } from '../auth/guards/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { InvitesService } from './invites.service';

type AuthenticatedRequest = Request & {
  user?: AuthUser;
};

@Controller('invites')
@UseGuards(AuthGuard('jwt'))
export class InvitesController {
  constructor(private readonly invitesService: InvitesService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles('MANAGER')
  async inviteUser(
    @Req() req: AuthenticatedRequest,
    @Body('email') email: string,
  ) {
    const messMembership = await prisma.mess_members.findFirst({
      where: { user_id: req.user!.id, removed_at: null, deleted_at: null },
      select: { mess_id: true },
    });

    if (!messMembership) {
      throw new BadRequestException('You are not part of any active mess');
    }

    return this.invitesService.inviteUser(
      messMembership.mess_id,
      req.user!.id,
      email,
    );
  }

  @Get('pending')
  async getPendingInvites(@Req() req: AuthenticatedRequest) {
    return this.invitesService.getPendingInvites(req.user!.id);
  }

  @Post(':id/accept')
  async acceptInvite(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.invitesService.acceptInvite(id, req.user!.id);
  }

  @Post(':id/reject')
  async rejectInvite(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.invitesService.rejectInvite(id, req.user!.id);
  }
}
```

---

# Frontend Implementation

## 1. Server Actions

File: `apps/web/app/actions/invites.ts`

```ts
"use server";

import { getCurrentUser } from "./auth";
import { api } from "../lib/api-client";

export async function inviteUser(email: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");
  return api.post<{ success: boolean; data: PendingInvite }>("/invites", { email });
}

export async function getPendingInvites() {
  const user = await getCurrentUser();
  if (!user) return [];
  return api.get<{ success: boolean; data: PendingInvite[] }>("/invites/pending");
}

export async function acceptInvite(inviteId: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");
  return api.post<{ success: boolean }>(`/invites/${inviteId}/accept`, {});
}

export async function rejectInvite(inviteId: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");
  return api.post<{ success: boolean }>(`/invites/${inviteId}/reject`, {});
}

export interface PendingInvite {
  id: string;
  mess_id: string;
  mess_name: string;
  requested_by: string;
  requester_name: string;
  requester_email: string;
  created_at: string;
}
```

---

## 2. React Query Hooks

File: `apps/web/app/hooks/use-invites.ts`

```ts
"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  acceptInvite,
  getPendingInvites,
  inviteUser,
  rejectInvite,
  type PendingInvite,
} from "../actions/invites";

export function usePendingInvites() {
  return useQuery({
    queryKey: ["invites", "pending"],
    queryFn: async () => {
      const result = await getPendingInvites();
      return result;
    },
  });
}

export function useInviteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: inviteUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invites"] });
    },
  });
}

export function useAcceptInvite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: acceptInvite,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invites"] });
      queryClient.invalidateQueries({ queryKey: ["members"] });
    },
  });
}

export function useRejectInvite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: rejectInvite,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invites"] });
    },
  });
}

export { type PendingInvite };
```

---

## 3. Dashboard Notification Banner

File: `apps/web/app/dashboard/page.tsx` (modify)

Add at the top of the dashboard content:

```tsx
import { usePendingInvites, useAcceptInvite, useRejectInvite } from "../hooks/use-invites";

function InviteBanner() {
  const { data: invites } = usePendingInvites();
  const accept = useAcceptInvite();
  const reject = useRejectInvite();

  if (!invites || invites.length === 0) return null;

  return (
    <div className="mb-6 space-y-3">
      {invites.map((invite) => (
        <div
          key={invite.id}
          className="rounded-xl border border-primary/30 bg-primary/10 p-4"
        >
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold text-foreground">
                You have been invited to join <span className="text-primary">{invite.mess_name}</span>
              </p>
              <p className="mt-1 text-xs text-foreground-muted">
                by {invite.requester_name} ({invite.requester_email})
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => accept.mutate(invite.id)}
                disabled={accept.isPending}
                className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-primary-hover disabled:opacity-60"
              >
                {accept.isPending ? "Accepting..." : "Accept"}
              </button>
              <button
                type="button"
                onClick={() => reject.mutate(invite.id)}
                disabled={reject.isPending}
                className="rounded-lg border border-foreground-muted/20 px-3 py-1.5 text-xs font-semibold text-foreground-muted transition-colors hover:bg-surface-raised disabled:opacity-60"
              >
                {reject.isPending ? "Rejecting..." : "Reject"}
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
```

Place `<InviteBanner />` right after the "Welcome back" heading inside
`DashboardContent`.

---

## 4. Modify AddMemberDialog — Invite Flow

Current flow: search → select → immediate create  
New flow: search → select → **send invite**

File: `apps/web/app/dashboard/members/page.tsx`

Replace the direct `addMember` mutation in `AddMemberDialog`:

```tsx
// Before (direct add):
const addMember = useAddMember(messId ?? "");

// After (send invite):
const inviteUser = useInviteUser();
```

In the dialog's "Add Member" button:

```tsx
// Before:
onClick={() => selectedUser && onAdd(selectedUser.id)}

// After:
onClick={() => selectedUser && inviteUser.mutate(selectedUser.email)}
```

Show success message and close dialog after invite is sent.

---

## 5. Not-Found-User → Create Account Flow

When `searchUsers` returns no results and query is an email format:

```tsx
// In AddMemberDialog, after search results check:
const isEmail = searchQuery.includes("@") && searchQuery.length >= 3;

if (!searching && isEmail && searchResults.length === 0) {
  return (
    <div className="mb-4 rounded-lg border border-accent-warm/30 bg-accent-warm/10 p-4">
      <p className="text-sm font-medium text-foreground">
        No account found for <span className="font-semibold">{searchQuery}</span>
      </p>
      <p className="mt-1 text-xs text-foreground-muted">
        Would you like to create an account for this person?
      </p>
      <Link
        href={`/dashboard/members/create-account?email=${encodeURIComponent(searchQuery)}`}
        className="mt-3 inline-flex rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-primary-hover"
      >
        Create Account
      </Link>
    </div>
  );
}
```

---

## 6. Create Member Account Page

New page: `apps/web/app/dashboard/members/create-account/page.tsx`

Manager fills:
- Name (required)
- Email (pre-filled from query param, locked)
- Password (generated or manual)
- Phone (optional)

On submit:
- Server action calls backend endpoint
- Backend creates user with `manager_created: true`
- Auto-adds to current mess as MEMBER

Server actions (`apps/web/app/actions/members.ts`):

```ts
export async function createMemberAccount(data: {
  name: string;
  email: string;
  password: string;
  phone?: string;
  messId: string;
}) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  return api.post<{ success: boolean; data: UserProfile }>(
    "/users/create-member",
    data
  );
}
```

Backend endpoint: `POST /users/create-member` (MANAGER only)

```ts
// In UsersController
@Post('create-member')
@UseGuards(RolesGuard)
@Roles('MANAGER')
async createMember(@Body() body: CreateMemberDto) {
  return this.usersService.createMemberAccount(body, req.user!.id);
}
```

---

# File Changes Summary

## New Files

| File | Purpose |
|------|---------|
| `context/invite-system-plan.md` | This plan |
| `apps/api/src/invites/invites.module.ts` | Invites NestJS module |
| `apps/api/src/invites/invites.service.ts` | Invite logic (no Redis) |
| `apps/api/src/invites/invites.controller.ts` | Invite endpoints |
| `apps/web/app/actions/invites.ts` | Server actions |
| `apps/web/app/hooks/use-invites.ts` | React Query hooks |
| `apps/web/app/dashboard/members/create-account/page.tsx` | Manager creates account |
| `packages/shared/src/invites/invites.dto.ts` | Shared DTOs (optional) |

## Modified Files

| File | Changes |
|------|---------|
| `apps/api/src/app.module.ts` | Register InvitesModule |
| `apps/api/src/users/users.service.ts` | Add `createMemberAccount` method |
| `apps/api/src/users/users.controller.ts` | Add `POST /users/create-member` |
| `apps/web/app/dashboard/members/page.tsx` | Replace AddMemberDialog direct add → invite flow |
| `apps/web/app/dashboard/page.tsx` | Add InviteBanner |

## No Schema Changes

Uses existing `join_requests` table. No Prisma migration needed.

---

# Flow Diagrams

## Manager Invites Existing User

```text
Manager types email in AddMemberDialog
    ↓
searchUsers(email)
    ↓
User found?
    YES → Show user card → Manager clicks "Send Invite"
              ↓
         POST /invites { email }
              ↓
         join_requests PENDING created
              ↓
         Activity log: MEMBER_ADDED
              ↓
         Close dialog, show success

    NO → Show "Not registered" message
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
join_requests WHERE user_id = me AND status = PENDING
    ↓
InviteBanner renders
    ↓
User clicks "Accept"
    ↓
POST /invites/:id/accept
    ↓
prisma.$transaction:
  1. CREATE mess_members (MANAGER → MEMBER)
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

## 7-Day Expiry (Code-only, no schema change)

```text
getPendingInvites(userId)
    ↓
Find invites WHERE user_id = me AND status = PENDING AND created_at < now() - 7 days
    ↓
UPDATE join_requests SET status = EXPIRED (bulk update)
    ↓
Then return remaining PENDING invites
```

---

# Error Handling

| Scenario | Response | Frontend |
|----------|----------|----------|
| User not found | 404 | "Not registered. Create account?" |
| Already active member | 409 | "Already a member" toast |
| Already pending invite | 409 | "Invite already sent" toast |
| Previously removed | 409 | "Was removed — ask to re-request" |
| Invite not found | 400 | "Invite expired or processed" |
| Accept after expiry | 400 | Auto-expired, show error |
| Network error | — | Retry toast |

---

# Phased Implementation

### Phase 1: Backend (1–2 hours)

1. Create `InvitesModule` + `InvitesService` + `InvitesController`
2. Add `POST /users/create-member` to UsersController + UsersService
3. Register InvitesModule in AppModule

### Phase 2: Invite Flow (1 hour)

1. Modify `AddMemberDialog` → search not found → show create-account link
2. Add `inviteMember` action to `actions/invites.ts`
3. Add `useInviteUser` hook
4. Wire up dialog → send invite on "Add"

### Phase 3: Dashboard Notification (30 min)

1. Add `usePendingInvites` query to dashboard
2. Create `InviteBanner` component
3. Add Accept/Reject buttons with mutation hooks

### Phase 4: Create Account Page (1 hour)

1. Create `dashboard/members/create-account/page.tsx`
2. Server action `createMemberAccount`
3. Auto-join as MEMBER after creation

### Phase 5: Test & Polish (30 min)

1. Test full flow: invite → accept → reject → expiry
2. Add loading states to banner buttons
3. Verify 7-day expiry logic
4. Verify role guards on all new endpoints