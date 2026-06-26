"use server";

import { api } from "../lib/api-client";

export interface PendingInvite {
  id: string;
  mess_id: string;
  mess_name: string;
  requested_by: string;
  requester_name: string;
  requester_email: string;
  created_at: string;
}

export async function inviteUser(email: string) {
  return api.post<PendingInvite>("/invites", { email });
}

export async function getPendingInvites() {
  return api.get<PendingInvite[]>("/invites/pending");
}

export async function acceptInvite(inviteId: string) {
  return api.post<{ success: true }>(`/invites/${inviteId}/accept`, {});
}

export async function rejectInvite(inviteId: string) {
  return api.post<{ success: true }>(`/invites/${inviteId}/reject`, {});
}
