/**
 * Role a user holds within a specific mess.
 * Mirrors the `MessRole` enum in the Prisma schema (MANAGER | MEMBER).
 * Defined as a literal union here so `@repo/shared` stays decoupled from
 * `@repo/database`.
 */
export type MessRole = "MANAGER" | "MEMBER";

export interface MessResponse {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  created_at: string;
  updated_at: string;
  current_user_role: MessRole;
  member_id: string;
}
