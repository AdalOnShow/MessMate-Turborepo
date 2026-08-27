export interface ExpenseMemberAllocation {
  member_id: string;
  allocated_amount: number;
  member: {
    id: string;
    name: string;
    email: string;
    avatar: string | null;
  };
}

export interface Expense {
  id: string;
  mess_id: string;
  month_id: string;
  type: "BAZAAR" | "SHARED" | "INDIVIDUAL";
  title: string;
  amount: number;
  created_by: string;
  expense_date: string;
  created_at: string;
  updated_at: string;
}

export interface ExpenseWithRelations extends Expense {
  creator: {
    id: string;
    name: string;
    email: string;
    avatar: string | null;
  };
  members: ExpenseMemberAllocation[];
}

export interface ExpenseSummary {
  total: number;
  shared_total: number;
  individual_total: number;
  bazaar_total: number;
  count: number;
}

export interface ExpenseListResponse {
  items: ExpenseWithRelations[];
  summary: ExpenseSummary;
}
