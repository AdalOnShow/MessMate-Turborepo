"use server";

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
}

export interface MonthSummaryInfo {
  month: MonthInfo;
  member_summaries: MemberMonthSummaryInfo[];
}

export interface CreateMonthPayload {
  title?: string;
}

export async function getActiveMonth(messId: string) {
  return api.get<MonthInfo | null>(`/months/${messId}/active`);
}

export async function createMonth(messId: string, data: CreateMonthPayload) {
  return api.post<MonthInfo>(`/months/${messId}`, data);
}

export async function getMonthHistory(messId: string) {
  return api.get<MonthInfo[]>(`/months/${messId}/history`);
}

export async function getMonthSummary(messId: string, monthId: string) {
  return api.get<MonthSummaryInfo>(`/months/${messId}/${monthId}/summary`);
}
