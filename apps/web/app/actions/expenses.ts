"use server";

import { api } from "../lib/api-client";

export interface ExpenseMemberAllocationInfo {
  member_id: string;
  allocated_amount: number;
  member: {
    id: string;
    name: string;
    email: string;
    avatar: string | null;
  };
}

export interface ExpenseInfo {
  id: string;
  mess_id: string;
  month_id: string;
  type: "BAZAAR" | "SHARED" | "INDIVIDUAL";
  title: string;
  amount: number;
  created_by: string;
  expense_date: string;
  note: string | null;
  created_at: string;
  updated_at: string;
  creator: {
    id: string;
    name: string;
    email: string;
    avatar: string | null;
  };
  members: ExpenseMemberAllocationInfo[];
}

export interface ExpenseSummaryInfo {
  total: number;
  shared_total: number;
  individual_total: number;
  bazaar_total: number;
  count: number;
}

export interface ExpenseListInfo {
  items: ExpenseInfo[];
  summary: ExpenseSummaryInfo;
}

export interface CreateExpensePayload {
  type: "SHARED" | "INDIVIDUAL";
  title: string;
  amount: number;
  expense_date: string;
  member_ids: string[];
  note?: string;
}

export interface UpdateExpensePayload {
  type?: "SHARED" | "INDIVIDUAL";
  title?: string;
  amount?: number;
  expense_date?: string;
  member_ids?: string[];
  note?: string;
}

export async function getExpenses(messId: string, monthId: string) {
  return api.get<ExpenseListInfo>(`/expenses/${messId}/${monthId}`);
}

export async function createExpense(
  messId: string,
  monthId: string,
  data: CreateExpensePayload,
) {
  return api.post<ExpenseInfo>(`/expenses/${messId}/${monthId}`, data);
}

export async function updateExpense(
  messId: string,
  expenseId: string,
  data: UpdateExpensePayload,
) {
  return api.patch<ExpenseInfo>(`/expenses/${messId}/${expenseId}`, data);
}

export async function deleteExpense(messId: string, expenseId: string) {
  return api.delete(`/expenses/${messId}/${expenseId}`);
}
