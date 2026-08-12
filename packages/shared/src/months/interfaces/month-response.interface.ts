export interface MonthResponse {
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

export interface MonthSummaryResponse {
  month: MonthResponse;
  member_summaries: MemberMonthSummary[];
}

export interface MemberMonthSummary {
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
