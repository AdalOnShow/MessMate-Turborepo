"use server";

import { api } from "../lib/api-client";

export interface DepositInfo {
  id: string;
  mess_id: string;
  month_id: string;
  member_id: string;
  amount: number;
  deposit_date: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  member: {
    id: string;
    name: string;
    email: string;
    avatar: string | null;
  };
  creator: {
    id: string;
    name: string;
    email: string;
    avatar: string | null;
  };
}

export interface DepositListInfo {
  items: DepositInfo[];
  total: number;
  count: number;
}

export interface DepositMemberSummaryInfo {
  member_id: string;
  user: {
    id: string;
    name: string;
    email: string;
    avatar: string | null;
  };
  amount: number;
  count: number;
}

export interface DepositSummaryResponseInfo {
  total: number;
  count: number;
  per_member: DepositMemberSummaryInfo[];
}

export interface CreateDepositPayload {
  member_id: string;
  amount: number;
  deposit_date: string;
}

export interface UpdateDepositPayload {
  member_id?: string;
  amount?: number;
  deposit_date?: string;
}

export async function getDeposits(messId: string, monthId: string) {
  return api.get<DepositListInfo>(`/deposits/${messId}/${monthId}`);
}

export async function getDepositSummary(messId: string, monthId: string) {
  return api.get<DepositSummaryResponseInfo>(
    `/deposits/${messId}/${monthId}/summary`,
  );
}

export async function createDeposit(
  messId: string,
  monthId: string,
  data: CreateDepositPayload,
) {
  return api.post<DepositInfo>(`/deposits/${messId}/${monthId}`, data);
}

export async function updateDeposit(
  messId: string,
  depositId: string,
  data: UpdateDepositPayload,
) {
  return api.patch<DepositInfo>(`/deposits/${messId}/${depositId}`, data);
}

export async function deleteDeposit(messId: string, depositId: string) {
  return api.delete(`/deposits/${messId}/${depositId}`);
}
