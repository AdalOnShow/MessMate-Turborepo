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
  /** Mess-wide figures for the month. */
  totals: MonthSummaryTotals;
  member_summaries: MemberMonthSummary[];
}

export interface MonthSummaryTotals {
  member_count: number;
  total_meals: number;
  /** Bazaar spend / total meals. */
  meal_rate: number;
  bazaar_cost: number;
  shared_cost: number;
  individual_cost: number;
  /** bazaar + shared + individual expenses recorded in the month. */
  total_expense: number;
  /** Deposits made during the month (excludes carried balances). */
  total_deposits: number;
  /** Positive balances carried in from the previous month. */
  carried_in_balance: number;
  /** Dues carried in from the previous month. */
  carried_in_due: number;
  /** Sum of members' negative final balances, as a positive number. */
  total_due: number;
  /** Sum of members' positive final balances. */
  total_credit: number;
  /** User who closed the month, if known. */
  closed_by: { id: string; name: string } | null;
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
  /** Balance carried in from the previous month: positive = credit, negative = due. */
  carried_in: number;
  /** True if the member has left the mess since. */
  removed: boolean;
}
