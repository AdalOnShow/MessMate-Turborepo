export interface BazaarItem {
  name: string;
  amount: number;
}

export interface BazaarSubmission {
  id: string;
  mess_id: string;
  month_id: string;
  submitted_by: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  description: string | null;
  items: BazaarItem[];
  total_amount: number;
  expense_date: string;
  approved_by: string | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface BazaarSubmissionWithRelations extends BazaarSubmission {
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

export interface BazaarHistory {
  pending: BazaarSubmissionWithRelations[];
  approved: BazaarSubmissionWithRelations[];
  rejected: BazaarSubmissionWithRelations[];
}
