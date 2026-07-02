-- AlterEnum
ALTER TYPE "activity_action" ADD VALUE 'DEFAULT_MEALS_UPDATED';

-- DropForeignKey
ALTER TABLE "meal_entry_items" DROP CONSTRAINT "meal_entry_items_meal_entry_id_fkey";

-- DropIndex
DROP INDEX "idx_meal_entry_items_entry";

-- AlterTable: Rename meal_entry_id to mess_id
ALTER TABLE "meal_entry_items" DROP COLUMN "meal_entry_id";
ALTER TABLE "meal_entry_items" ADD COLUMN "mess_id" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "meal_entry_items" ADD CONSTRAINT "meal_entry_items_mess_id_fkey" FOREIGN KEY ("mess_id") REFERENCES "messes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateIndex
CREATE UNIQUE INDEX "idx_meal_entry_items_mess_type" ON "meal_entry_items"("mess_id", "meal_type_id");
