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

export interface DailyMealReport {
  date: string;
  entries: {
    member_id: string;
    user: {
      id: string;
      name: string;
      email: string;
      avatar: string | null;
    };
    meals: Record<string, number>;
    total_meal: number;
  }[];
  summary: {
    total_members: number;
    total_meals: number;
    meal_type_totals: Record<string, number>;
  };
}

export interface MemberMealReport {
  member_id: string;
  user: {
    id: string;
    name: string;
    email: string;
    avatar: string | null;
  };
  month_id: string;
  entries: {
    date: string;
    meals: Record<string, number>;
    total_meal: number;
  }[];
  summary: {
    total_entries: number;
    total_meals: number;
    meal_type_totals: Record<string, number>;
    average_meals_per_day: number;
  };
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

export async function getDailyMealReport(
  messId: string,
  monthId: string,
  date: string,
) {
  return api.get<DailyMealReport>(
    `/meals/${messId}/${monthId}/daily?date=${date}`,
  );
}

export async function getMemberMealReport(
  messId: string,
  monthId: string,
  memberId: string,
) {
  return api.get<MemberMealReport>(
    `/meals/${messId}/${monthId}/member/${memberId}`,
  );
}

export async function getMonthMealSummary(messId: string, monthId: string) {
  return api.get<MonthMealSummary>(`/meals/${messId}/${monthId}/summary`);
}
