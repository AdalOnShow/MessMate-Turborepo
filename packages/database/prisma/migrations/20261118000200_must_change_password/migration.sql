-- Accounts a manager created with a password the manager chose: the user
-- is asked (dashboard notice) to set their own. Cleared on password change.
ALTER TABLE "users" ADD COLUMN "must_change_password" BOOLEAN NOT NULL DEFAULT false;

-- Existing manager-created accounts can't be told apart from ones whose
-- owner already changed the password, so remind them all once.
UPDATE "users"
SET "must_change_password" = true
WHERE "manager_created" = true AND "password" IS NOT NULL AND "deleted_at" IS NULL;
