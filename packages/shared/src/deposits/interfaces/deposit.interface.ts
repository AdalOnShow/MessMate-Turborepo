export interface Deposit {
  id: string;
  mess_id: string;
  month_id: string;
  member_id: string;
  amount: number;
  deposit_date: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface DepositWithRelations extends Deposit {
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

export interface DepositSummary {
  total: number;
  count: number;
}

export interface DepositListResponse {
  items: DepositWithRelations[];
  total: number;
  count: number;
}
