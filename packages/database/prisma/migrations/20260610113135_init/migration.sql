-- CreateEnum
CREATE TYPE "SystemRole" AS ENUM ('ADMIN', 'USER');

-- CreateEnum
CREATE TYPE "MessRole" AS ENUM ('MANAGER', 'MEMBER');

-- CreateEnum
CREATE TYPE "MonthStatus" AS ENUM ('ACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ExpenseType" AS ENUM ('BAZAAR', 'SHARED', 'INDIVIDUAL');

-- CreateEnum
CREATE TYPE "BazaarStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "CarryForwardType" AS ENUM ('PREVIOUS_DUE', 'PREVIOUS_BALANCE');

-- CreateEnum
CREATE TYPE "activity_action" AS ENUM ('MEMBER_ADDED', 'MEMBER_REMOVED', 'MANAGER_ASSIGNED', 'MEAL_ADDED', 'MEAL_UPDATED', 'MEAL_DELETED', 'EXPENSE_ADDED', 'EXPENSE_UPDATED', 'DEPOSIT_ADDED', 'DEPOSIT_UPDATED', 'MONTH_OPENED', 'MONTH_CLOSED', 'MEMBER_BALANCE_CREATED');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT,
    "phone" TEXT,
    "avatar" TEXT,
    "system_role" "SystemRole" NOT NULL DEFAULT 'USER',
    "manager_created" BOOLEAN NOT NULL DEFAULT false,
    "email_verified" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "oauth_accounts" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "provider_user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "oauth_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messes" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "messes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mess_members" (
    "id" TEXT NOT NULL,
    "mess_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "mess_role" "MessRole" NOT NULL,
    "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "removed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "mess_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "months" (
    "id" TEXT NOT NULL,
    "mess_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "month_status" "MonthStatus" NOT NULL,
    "started_at" TIMESTAMP(3) NOT NULL,
    "ended_at" TIMESTAMP(3),
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "months_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "meal_types" (
    "id" TEXT NOT NULL,
    "mess_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "value" DECIMAL(5,2) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "meal_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "meal_entries" (
    "id" TEXT NOT NULL,
    "month_id" TEXT NOT NULL,
    "member_id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "meals" JSONB NOT NULL,
    "total_meal" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "meal_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "meal_entry_items" (
    "id" TEXT NOT NULL,
    "meal_entry_id" TEXT NOT NULL,
    "meal_type_id" TEXT NOT NULL,
    "meal_value" DECIMAL(5,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "meal_entry_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bazaar_submissions" (
    "id" TEXT NOT NULL,
    "mess_id" TEXT NOT NULL,
    "month_id" TEXT NOT NULL,
    "submitted_by" TEXT NOT NULL,
    "status" "BazaarStatus" NOT NULL DEFAULT 'PENDING',
    "description" TEXT,
    "items" JSONB NOT NULL,
    "total_amount" DECIMAL(12,2) NOT NULL,
    "expense_date" TIMESTAMP(3) NOT NULL,
    "approved_by" TEXT,
    "approved_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "bazaar_submissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "expenses" (
    "id" TEXT NOT NULL,
    "mess_id" TEXT NOT NULL,
    "month_id" TEXT NOT NULL,
    "type" "ExpenseType" NOT NULL,
    "title" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "created_by" TEXT NOT NULL,
    "expense_date" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "expenses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "expense_members" (
    "id" TEXT NOT NULL,
    "expense_id" TEXT NOT NULL,
    "member_id" TEXT NOT NULL,
    "allocated_amount" DECIMAL(12,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "expense_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deposits" (
    "id" TEXT NOT NULL,
    "mess_id" TEXT NOT NULL,
    "month_id" TEXT NOT NULL,
    "member_id" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "note" TEXT,
    "deposit_date" TIMESTAMP(3) NOT NULL,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "deposits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "member_month_summaries" (
    "id" TEXT NOT NULL,
    "month_id" TEXT NOT NULL,
    "member_id" TEXT NOT NULL,
    "total_meals" INTEGER NOT NULL DEFAULT 0,
    "meal_cost" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "shared_cost" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "individual_cost" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "deposit_amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "final_bill" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "final_balance" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "member_month_summaries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "carry_forward_balances" (
    "id" TEXT NOT NULL,
    "source_month_id" TEXT NOT NULL,
    "target_month_id" TEXT NOT NULL,
    "member_id" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "carry_forward_type" "CarryForwardType" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "carry_forward_balances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity_logs" (
    "id" TEXT NOT NULL,
    "mess_id" TEXT NOT NULL,
    "month_id" TEXT,
    "actor_id" TEXT NOT NULL,
    "action" "activity_action" NOT NULL,
    "entity_type" TEXT,
    "entity_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activity_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "join_requests" (
    "id" TEXT NOT NULL,
    "mess_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "requested_by" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "verified_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "join_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "idx_users_email" ON "users"("email");

-- CreateIndex
CREATE INDEX "idx_users_system_role" ON "users"("system_role");

-- CreateIndex
CREATE INDEX "idx_oauth_accounts_provider" ON "oauth_accounts"("provider", "provider_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "idx_oauth_accounts_user_provider" ON "oauth_accounts"("user_id", "provider");

-- CreateIndex
CREATE UNIQUE INDEX "messes_slug_key" ON "messes"("slug");

-- CreateIndex
CREATE INDEX "idx_messes_created_by" ON "messes"("created_by");

-- CreateIndex
CREATE INDEX "idx_messes_slug" ON "messes"("slug") WHERE (deleted_at IS NULL);

-- CreateIndex
CREATE INDEX "idx_mess_members_mess_active" ON "mess_members"("mess_id", "removed_at") WHERE (deleted_at IS NULL);

-- CreateIndex
CREATE INDEX "idx_mess_members_user" ON "mess_members"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "idx_mess_members_mess_user" ON "mess_members"("mess_id", "user_id") WHERE (deleted_at IS NULL);

-- CreateIndex
CREATE INDEX "idx_months_mess" ON "months"("mess_id");

-- CreateIndex
CREATE INDEX "idx_months_dates" ON "months"("started_at", "ended_at");

-- CreateIndex
CREATE UNIQUE INDEX "idx_months_mess_status" ON "months"("mess_id") WHERE (month_status = 'ACTIVE');

-- CreateIndex
CREATE INDEX "idx_meal_types_is_active" ON "meal_types"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX "idx_meal_types_mess_name" ON "meal_types"("mess_id", "name") WHERE (deleted_at IS NULL AND is_active = true);

-- CreateIndex
CREATE INDEX "idx_meal_entries_month_date" ON "meal_entries"("month_id", "date");

-- CreateIndex
CREATE INDEX "idx_meal_entries_member" ON "meal_entries"("member_id");

-- CreateIndex
CREATE INDEX "idx_meal_entries_total_meal" ON "meal_entries"("total_meal");

-- CreateIndex
CREATE UNIQUE INDEX "idx_meal_entries_unique" ON "meal_entries"("month_id", "member_id", "date") WHERE (deleted_at IS NULL);

-- CreateIndex
CREATE UNIQUE INDEX "idx_meal_entry_items_entry" ON "meal_entry_items"("meal_entry_id", "meal_type_id");

-- CreateIndex
CREATE INDEX "idx_bazaar_submissions_mess_month" ON "bazaar_submissions"("mess_id", "month_id");

-- CreateIndex
CREATE INDEX "idx_bazaar_submissions_status" ON "bazaar_submissions"("status");

-- CreateIndex
CREATE INDEX "idx_bazaar_submissions_approved" ON "bazaar_submissions"("approved_at", "approved_by") WHERE (status = 'APPROVED');

-- CreateIndex
CREATE INDEX "idx_bazaar_submissions_total_amount" ON "bazaar_submissions"("total_amount");

-- CreateIndex
CREATE INDEX "idx_expenses_mess_month" ON "expenses"("mess_id", "month_id");

-- CreateIndex
CREATE INDEX "idx_expenses_type" ON "expenses"("type");

-- CreateIndex
CREATE INDEX "idx_expenses_created" ON "expenses"("created_by");

-- CreateIndex
CREATE INDEX "idx_expense_members_expense" ON "expense_members"("expense_id");

-- CreateIndex
CREATE INDEX "idx_expense_members_member" ON "expense_members"("member_id");

-- CreateIndex
CREATE UNIQUE INDEX "idx_expense_members_unique" ON "expense_members"("expense_id", "member_id");

-- CreateIndex
CREATE INDEX "idx_deposits_mess_month" ON "deposits"("mess_id", "month_id");

-- CreateIndex
CREATE INDEX "idx_deposits_member" ON "deposits"("member_id");

-- CreateIndex
CREATE INDEX "idx_deposits_date" ON "deposits"("deposit_date");

-- CreateIndex
CREATE INDEX "idx_member_month_summaries_month" ON "member_month_summaries"("month_id");

-- CreateIndex
CREATE INDEX "idx_member_month_summaries_balance" ON "member_month_summaries"("final_balance");

-- CreateIndex
CREATE UNIQUE INDEX "idx_member_month_summaries_month_member" ON "member_month_summaries"("month_id", "member_id");

-- CreateIndex
CREATE INDEX "idx_carry_forward_member_months" ON "carry_forward_balances"("member_id", "source_month_id", "target_month_id");

-- CreateIndex
CREATE INDEX "idx_carry_forward_target" ON "carry_forward_balances"("target_month_id");

-- CreateIndex
CREATE INDEX "idx_activity_logs_mess_created" ON "activity_logs"("mess_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "idx_activity_logs_actor" ON "activity_logs"("actor_id");

-- CreateIndex
CREATE INDEX "idx_activity_logs_entity" ON "activity_logs"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "idx_activity_logs_action" ON "activity_logs"("action");

-- CreateIndex
CREATE INDEX "idx_join_requests_user" ON "join_requests"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "idx_join_requests_mess_user" ON "join_requests"("mess_id", "user_id") WHERE (status = 'PENDING');

-- AddForeignKey
ALTER TABLE "oauth_accounts" ADD CONSTRAINT "oauth_accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messes" ADD CONSTRAINT "messes_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mess_members" ADD CONSTRAINT "mess_members_mess_id_fkey" FOREIGN KEY ("mess_id") REFERENCES "messes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mess_members" ADD CONSTRAINT "mess_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "months" ADD CONSTRAINT "months_mess_id_fkey" FOREIGN KEY ("mess_id") REFERENCES "messes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "months" ADD CONSTRAINT "months_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meal_types" ADD CONSTRAINT "meal_types_mess_id_fkey" FOREIGN KEY ("mess_id") REFERENCES "messes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meal_entries" ADD CONSTRAINT "meal_entries_month_id_fkey" FOREIGN KEY ("month_id") REFERENCES "months"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meal_entries" ADD CONSTRAINT "meal_entries_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "mess_members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meal_entries" ADD CONSTRAINT "meal_entries_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meal_entry_items" ADD CONSTRAINT "meal_entry_items_meal_entry_id_fkey" FOREIGN KEY ("meal_entry_id") REFERENCES "meal_entries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meal_entry_items" ADD CONSTRAINT "meal_entry_items_meal_type_id_fkey" FOREIGN KEY ("meal_type_id") REFERENCES "meal_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bazaar_submissions" ADD CONSTRAINT "bazaar_submissions_mess_id_fkey" FOREIGN KEY ("mess_id") REFERENCES "messes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bazaar_submissions" ADD CONSTRAINT "bazaar_submissions_month_id_fkey" FOREIGN KEY ("month_id") REFERENCES "months"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bazaar_submissions" ADD CONSTRAINT "bazaar_submissions_submitted_by_fkey" FOREIGN KEY ("submitted_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bazaar_submissions" ADD CONSTRAINT "bazaar_submissions_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_mess_id_fkey" FOREIGN KEY ("mess_id") REFERENCES "messes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_month_id_fkey" FOREIGN KEY ("month_id") REFERENCES "months"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expense_members" ADD CONSTRAINT "expense_members_expense_id_fkey" FOREIGN KEY ("expense_id") REFERENCES "expenses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expense_members" ADD CONSTRAINT "expense_members_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "mess_members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deposits" ADD CONSTRAINT "deposits_mess_id_fkey" FOREIGN KEY ("mess_id") REFERENCES "messes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deposits" ADD CONSTRAINT "deposits_month_id_fkey" FOREIGN KEY ("month_id") REFERENCES "months"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deposits" ADD CONSTRAINT "deposits_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "mess_members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deposits" ADD CONSTRAINT "deposits_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "member_month_summaries" ADD CONSTRAINT "member_month_summaries_month_id_fkey" FOREIGN KEY ("month_id") REFERENCES "months"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "member_month_summaries" ADD CONSTRAINT "member_month_summaries_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "mess_members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "carry_forward_balances" ADD CONSTRAINT "carry_forward_balances_source_month_id_fkey" FOREIGN KEY ("source_month_id") REFERENCES "months"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "carry_forward_balances" ADD CONSTRAINT "carry_forward_balances_target_month_id_fkey" FOREIGN KEY ("target_month_id") REFERENCES "months"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "carry_forward_balances" ADD CONSTRAINT "carry_forward_balances_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "mess_members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_mess_id_fkey" FOREIGN KEY ("mess_id") REFERENCES "messes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_month_id_fkey" FOREIGN KEY ("month_id") REFERENCES "months"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "join_requests" ADD CONSTRAINT "join_requests_mess_id_fkey" FOREIGN KEY ("mess_id") REFERENCES "messes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "join_requests" ADD CONSTRAINT "join_requests_requested_by_fkey" FOREIGN KEY ("requested_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "join_requests" ADD CONSTRAINT "join_requests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
