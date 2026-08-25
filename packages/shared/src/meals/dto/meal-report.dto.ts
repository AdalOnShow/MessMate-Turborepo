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
