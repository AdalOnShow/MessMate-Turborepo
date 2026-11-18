export type ActivityAction = ActivityLog["action"];

/**
 * What an activity was about, for a one-line description ("Gas Bill ·
 * ৳1,000"). Every field is optional: older entries, or ones whose record
 * no longer exists, have fewer details.
 */
export interface ActivityDetails {
  /** Expense title, month title, meal type name, bazaar description. */
  title?: string;
  amount?: number;
  /** The person it was about (deposit member, meal member, new member...). */
  member?: string;
  /** Calendar date (UTC midnight ISO) of a meal, expense or deposit. */
  date?: string;
  /** Meals of a meal entry, or of everyone on a saved day. */
  meals?: number;
  /** How many members a saved meal day covered. */
  members?: number;
}

export interface ActivityLog {
  id: string;
  action:
    | "MEMBER_ADDED"
    | "MEMBER_REMOVED"
    | "MANAGER_ASSIGNED"
    | "MANAGER_REMOVED"
    | "MEAL_ADDED"
    | "MEAL_UPDATED"
    | "MEAL_DELETED"
    | "EXPENSE_ADDED"
    | "EXPENSE_UPDATED"
    | "EXPENSE_DELETED"
    | "DEPOSIT_ADDED"
    | "DEPOSIT_UPDATED"
    | "DEPOSIT_DELETED"
    | "MONTH_OPENED"
    | "MONTH_CLOSED"
    | "MEMBER_BALANCE_CREATED"
    | "DEFAULT_MEALS_UPDATED"
    | "BAZAAR_SUBMITTED"
    | "BAZAAR_UPDATED"
    | "BAZAAR_APPROVED"
    | "BAZAAR_REJECTED"
    | "BAZAAR_DELETED";
  created_at: string;
  actor: {
    id: string;
    name: string;
    avatar: string | null;
  };
  details: ActivityDetails | null;
}
