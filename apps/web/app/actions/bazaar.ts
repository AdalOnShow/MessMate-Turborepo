"use server";

import { api } from "../lib/api-client";

export interface BazaarItemInfo {
  name: string;
  amount: number;
}

export interface BazaarSubmissionInfo {
  id: string;
  mess_id: string;
  month_id: string;
  submitted_by: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  description: string | null;
  items: BazaarItemInfo[];
  total_amount: number;
  expense_date: string;
  approved_by: string | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
  submitter: {
    id: string;
    name: string;
    email: string;
    avatar: string | null;
  };
  approver: {
    id: string;
    name: string;
    email: string;
    avatar: string | null;
  } | null;
}

export interface BazaarHistoryInfo {
  pending: BazaarSubmissionInfo[];
  approved: BazaarSubmissionInfo[];
  rejected: BazaarSubmissionInfo[];
}

export interface CreateBazaarPayload {
  items: BazaarItemInfo[];
  description?: string;
  expense_date: string;
}

export interface UpdateBazaarPayload {
  items?: BazaarItemInfo[];
  description?: string;
  expense_date?: string;
}

export async function submitBazaar(
  messId: string,
  monthId: string,
  data: CreateBazaarPayload,
) {
  return api.post<BazaarSubmissionInfo>(`/bazaar/${messId}/${monthId}`, data);
}

export async function getBazaarHistory(messId: string, monthId: string) {
  return api.get<BazaarHistoryInfo>(`/bazaar/${messId}/${monthId}`);
}

export async function updateBazaar(
  messId: string,
  submissionId: string,
  data: UpdateBazaarPayload,
) {
  return api.patch<BazaarSubmissionInfo>(
    `/bazaar/${messId}/${submissionId}`,
    data,
  );
}

export async function deleteBazaar(messId: string, submissionId: string) {
  return api.delete(`/bazaar/${messId}/${submissionId}`);
}

export async function approveBazaar(messId: string, submissionId: string) {
  return api.post<BazaarSubmissionInfo>(
    `/bazaar/${messId}/${submissionId}/approve`,
  );
}

export async function rejectBazaar(messId: string, submissionId: string) {
  return api.post<BazaarSubmissionInfo>(
    `/bazaar/${messId}/${submissionId}/reject`,
  );
}
