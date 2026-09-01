export interface ActivityLog {
  id: string;
  action:
    | "MEMBER_ADDED"
    | "MEMBER_REMOVED"
    | "MANAGER_ASSIGNED"
    | "MEAL_ADDED"
    | "MEAL_UPDATED"
    | "MEAL_DELETED"
    | "EXPENSE_ADDED"
    | "EXPENSE_UPDATED"
    | "EXPENSE_DELETED"
    | "DEPOSIT_ADDED"
    | "DEPOSIT_UPDATED"
    | "MONTH_OPENED"
    | "MONTH_CLOSED"
    | "MEMBER_BALANCE_CREATED"
    | "DEFAULT_MEALS_UPDATED"
    | "BAZAAR_SUBMITTED"
    | "BAZAAR_UPDATED"
    | "BAZAAR_APPROVED"
    | "BAZAAR_REJECTED";
  created_at: string;
  actor: {
    id: string;
    name: string;
    email: string;
    avatar: string | null;
  };
}
