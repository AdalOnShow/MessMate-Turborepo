import { z } from "zod";
import type {
  BazaarStatusCounts,
  BazaarSubmissionWithRelations,
} from "../bazaar/interfaces/bazaar.interface";
import type { DepositWithRelations } from "../deposits/interfaces/deposit.interface";
import type { ExpenseWithRelations } from "../expenses/interfaces/expense.interface";
import { ValidationMessage } from "../validation/messages";

/** Rows per "Load more" on the Reports page. */
export const REPORT_PAGE_SIZE = 8;

const pageFields = {
  /** Opaque `next_cursor` from the previous page. */
  cursor: z.string().max(300, ValidationMessage.CURSOR_INVALID).optional(),
  limit: z.coerce
    .number()
    .int()
    .min(1, ValidationMessage.LIMIT_MIN)
    .max(50, ValidationMessage.LIMIT_MAX)
    .default(REPORT_PAGE_SIZE),
};

export const expenseHistoryQuerySchema = z.object({
  ...pageFields,
  type: z
    .enum(["SHARED", "INDIVIDUAL", "BAZAAR"], ValidationMessage.STATUS_INVALID)
    .optional(),
});

export const depositHistoryQuerySchema = z.object({
  ...pageFields,
  memberId: z.string().uuid(ValidationMessage.MEMBER_ID_INVALID).optional(),
});

export const mealDaysQuerySchema = z.object(pageFields);

export const bazaarHistoryQuerySchema = z.object({
  ...pageFields,
  status: z
    .enum(["PENDING", "APPROVED", "REJECTED"], ValidationMessage.STATUS_INVALID)
    .default("APPROVED"),
});

export type ExpenseHistoryQuery = z.infer<typeof expenseHistoryQuerySchema>;
export type DepositHistoryQuery = z.infer<typeof depositHistoryQuerySchema>;
export type MealDaysQuery = z.infer<typeof mealDaysQuerySchema>;
export type BazaarHistoryQuery = z.infer<typeof bazaarHistoryQuerySchema>;

/** One page of a month's bazaar in one status, newest purchase first. */
export interface BazaarHistoryPage {
  items: BazaarSubmissionWithRelations[];
  next_cursor: string | null;
  /** Rows in the selected status, across all pages. */
  total: number;
  /** Sum of the selected status, across all pages. */
  total_amount: number;
  /** For the filter chips; independent of the current filter. */
  counts: BazaarStatusCounts;
}

/** One page of a month's expenses, newest first. */
export interface ExpenseHistoryPage {
  items: ExpenseWithRelations[];
  next_cursor: string | null;
  /** Rows matching the current filter, across all pages. */
  total: number;
  /** For the filter chips; independent of the current filter. */
  type_counts: {
    ALL: number;
    SHARED: number;
    INDIVIDUAL: number;
    BAZAAR: number;
  };
}

/** One page of a month's deposits, newest first. */
export interface DepositHistoryPage {
  items: DepositWithRelations[];
  next_cursor: string | null;
  /** Rows matching the current filter, across all pages. */
  total: number;
  /** Sum of the rows matching the current filter, across all pages. */
  total_amount: number;
  /** For the filter chips; independent of the current filter. */
  all_count: number;
  member_counts: { member_id: string; name: string; count: number }[];
}

/** One day row of the meal grid. */
export interface MealDay {
  /** ISO date of the day. */
  date: string;
  total: number;
  /** Meals per member id that day. */
  by_member: Record<string, number>;
}

/** One page of days that have meals, newest first. */
export interface MealDaysPage {
  days: MealDay[];
  next_cursor: string | null;
  /** Days with meals in the month, across all pages. */
  total_days: number;
}
