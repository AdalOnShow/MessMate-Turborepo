"use server";

import { api } from "../lib/api-client";

export interface MealEntryInfo {
  id: string;
  month_id: string;
  member_id: string;
  date: string;
  meals: Record<string, number>;
  total_meal: number;
  created_by: string;
  created_at: string;
  updated_at: string;
  member: {
    id: string;
    user: {
      id: string;
      name: string;
      email: string;
      avatar: string | null;
    };
  };
}

export interface BulkMealEntryItem {
  memberId: string;
  date: string;
  meals: Record<string, number>;
}

export interface BulkMealEntriesPayload {
  entries: BulkMealEntryItem[];
}

export async function bulkSaveMealEntries(
  messId: string,
  monthId: string,
  data: BulkMealEntriesPayload,
) {
  return api.post<MealEntryInfo[]>(`/meals/${messId}/${monthId}`, data);
}

export async function getMealEntries(
  messId: string,
  monthId: string,
  startDate: string,
  endDate: string,
) {
  return api.get<MealEntryInfo[]>(
    `/meals/${messId}/${monthId}?startDate=${startDate}&endDate=${endDate}`,
  );
}

export async function deleteMealEntry(messId: string, entryId: string) {
  return api.delete(`/meals/${messId}/${entryId}`);
}
