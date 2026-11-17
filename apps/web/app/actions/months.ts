"use server";

import type { CarryForwardOptions } from "@repo/shared";
import { api } from "../lib/api-client";

export interface MonthInfo {
  id: string;
  mess_id: string;
  title: string;
  month_status: "ACTIVE" | "ARCHIVED";
  started_at: string;
  ended_at: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface MemberMonthSummaryInfo {
  id: string;
  member_id: string;
  user: {
    id: string;
    name: string;
    email: string;
    avatar: string | null;
  };
  total_meals: number;
  meal_cost: number;
  shared_cost: number;
  individual_cost: number;
  deposit_amount: number;
  final_bill: number;
  final_balance: number;
  carried_in: number;
  removed: boolean;
}

export interface MonthSummaryTotalsInfo {
  member_count: number;
  total_meals: number;
  meal_rate: number;
  bazaar_cost: number;
  shared_cost: number;
  individual_cost: number;
  total_expense: number;
  total_deposits: number;
  carried_in_balance: number;
  carried_in_due: number;
  total_due: number;
  total_credit: number;
  closed_by: { id: string; name: string } | null;
}

export interface MonthSummaryInfo {
  month: MonthInfo;
  totals: MonthSummaryTotalsInfo;
  member_summaries: MemberMonthSummaryInfo[];
}

export interface CreateMonthPayload {
  title?: string;
  /** Left out: every balance carries (ADR-008). */
  carryForward?: CarryForwardOptions;
}

export async function createMonth(messId: string, data: CreateMonthPayload) {
  return api.post<MonthInfo>(`/months/${messId}`, data);
}
