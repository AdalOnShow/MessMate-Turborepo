/*
  Warnings:

  - A unique constraint covering the columns `[user_id]` on the table `mess_members` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "idx_meal_entries_total_meal";

-- DropIndex
DROP INDEX "idx_mess_members_mess_user";

-- DropIndex
DROP INDEX "idx_messes_slug";

-- DropIndex
DROP INDEX "idx_users_email";

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "refresh_token" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "mess_members_user_id_key" ON "mess_members"("user_id") WHERE (removed_at IS NULL);
