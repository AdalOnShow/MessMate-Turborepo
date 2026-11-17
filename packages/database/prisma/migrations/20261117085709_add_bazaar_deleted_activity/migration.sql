/*
  Warnings:

  - You are about to drop the column `note` on the `deposits` table. All the data in the column will be lost.
  - You are about to drop the `meal_entry_items` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "activity_action" ADD VALUE 'EXPENSE_DELETED';
ALTER TYPE "activity_action" ADD VALUE 'BAZAAR_DELETED';

-- DropForeignKey
ALTER TABLE "meal_entry_items" DROP CONSTRAINT "meal_entry_items_meal_type_id_fkey";

-- DropForeignKey
ALTER TABLE "meal_entry_items" DROP CONSTRAINT "meal_entry_items_mess_id_fkey";

-- AlterTable
ALTER TABLE "deposits" DROP COLUMN "note";

-- DropTable
DROP TABLE "meal_entry_items";
