-- One migration for the November 2026 release (replaces four that were
-- never applied anywhere).

-- 1. member_month_summaries.total_meals: half meals (0.5) were truncated
--    when a month closed because the column was an integer.
ALTER TABLE "member_month_summaries"
  ALTER COLUMN "total_meals" SET DATA TYPE DECIMAL(10,2);

--    Recompute closed months' per-member totals from their meal entries,
--    restoring the lost half meals.
UPDATE "member_month_summaries" AS s
SET "total_meals" = COALESCE((
  SELECT SUM(e."total_meal")
  FROM "meal_entries" AS e
  WHERE e."month_id" = s."month_id"
    AND e."member_id" = s."member_id"
    AND e."deleted_at" IS NULL
), 0);

-- 2. activity_logs.details: what an entry was about (deleted expense,
--    a saved meal day's member and meal counts).
ALTER TABLE "activity_logs" ADD COLUMN "details" JSONB;

--    Every query filters by mess and time (idx_activity_logs_mess_created);
--    these two indexes were never used and only cost space and writes.
DROP INDEX IF EXISTS "idx_activity_logs_action";
DROP INDEX IF EXISTS "idx_activity_logs_entity";

-- 3. users.must_change_password: accounts a manager created (with a
--    password the manager chose) are asked to set their own.
ALTER TABLE "users" ADD COLUMN "must_change_password" BOOLEAN NOT NULL DEFAULT false;

--    Existing manager-created accounts can't be told apart from ones whose
--    owner already changed the password, so remind them all once.
UPDATE "users"
SET "must_change_password" = true
WHERE "manager_created" = true AND "password" IS NOT NULL AND "deleted_at" IS NULL;

-- 4. Refresh-token rotation: the replaced token stays valid for a short
--    grace period so parallel refreshes (two tabs) don't sign out.
ALTER TABLE "user_sessions" ADD COLUMN "previous_token_hash" TEXT;
ALTER TABLE "user_sessions" ADD COLUMN "rotated_at" TIMESTAMP(3);
