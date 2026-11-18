-- Half meals (0.5) were truncated when a month closed: total_meals was an
-- integer column. Store it like meal_entries.total_meal.
ALTER TABLE "member_month_summaries"
  ALTER COLUMN "total_meals" SET DATA TYPE DECIMAL(10,2);

-- Recompute already-closed months' per-member meal totals from their
-- (unchanged) meal entries, restoring the lost half meals.
UPDATE "member_month_summaries" AS s
SET "total_meals" = COALESCE((
  SELECT SUM(e."total_meal")
  FROM "meal_entries" AS e
  WHERE e."month_id" = s."month_id"
    AND e."member_id" = s."member_id"
    AND e."deleted_at" IS NULL
), 0);
