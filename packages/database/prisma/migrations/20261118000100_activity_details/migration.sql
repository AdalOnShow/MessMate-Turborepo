-- Snapshot of a deleted record (e.g. an expense) for the activity list.
ALTER TABLE "activity_logs" ADD COLUMN "details" JSONB;
