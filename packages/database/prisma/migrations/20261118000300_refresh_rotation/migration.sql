-- Refresh-token rotation: the replaced token stays valid for a short grace
-- period so parallel refreshes (two tabs) do not sign the user out.
ALTER TABLE "user_sessions" ADD COLUMN "previous_token_hash" TEXT;
ALTER TABLE "user_sessions" ADD COLUMN "rotated_at" TIMESTAMP(3);
