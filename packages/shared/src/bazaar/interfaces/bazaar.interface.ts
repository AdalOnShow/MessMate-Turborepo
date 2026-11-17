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

export interface BazaarStatusCounts {
  pending: number;
  approved: number;
  rejected: number;
}

/** One cursor-paginated page of submissions for a single status. */
export interface BazaarSubmissionPage {
  items: BazaarSubmissionWithRelations[];
  /** Pass back as `cursor` to get the next page; null on the last page. */
  next_cursor: string | null;
  /** Per-status totals for the month; only sent with the first page. */
  counts: BazaarStatusCounts | null;
}
