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

/** Edit a day that is already saved (Reports). All entries share one date. */
export async function updateMealDay(
  messId: string,
  monthId: string,
  data: BulkMealEntriesPayload,
) {
  return api.put<MealEntryInfo[]>(`/meals/${messId}/${monthId}/day`, data);
}

export async function deleteMealEntry(messId: string, entryId: string) {
  return api.delete(`/meals/${messId}/${entryId}`);
}

export interface MonthMealSummary {
  month_id: string;
  title: string;
  total_entries: number;
  total_meals: number;
  member_summaries: {
    member_id: string;
    user: {
      id: string;
      name: string;
      email: string;
      avatar: string | null;
    };
    total_meals: number;
    meal_type_totals: Record<string, number>;
    entry_count: number;
  }[];
  meal_type_totals: Record<string, number>;
  active_days: number;
}
