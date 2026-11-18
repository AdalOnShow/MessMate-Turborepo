"use client";

import { keepPreviousData, useInfiniteQuery } from "@tanstack/react-query";
import type {
  ActivityHistoryPage,
  BazaarHistoryPage,
  DepositHistoryPage,
  ExpenseHistoryPage,
  MealDaysPage,
} from "@repo/shared";
import { unwrap } from "../lib/action-result";
import { useOpenAtFirstPage } from "../lib/infinite-pages";
import {
  getActivityHistoryPage,
  getBazaarHistoryPage,
  getDepositHistoryPage,
  getExpenseHistoryPage,
  getMealDaysPage,
} from "../lib/reads";

/**
 * Reports lists load 8 rows per request from the server; "Load more" asks
 * for the next page with the cursor the last page returned. Changing a
 * filter starts a new list, while `keepPreviousData` keeps the old rows on
 * screen until it arrives.
 */
function useReportPages<P extends { next_cursor: string | null }>(
  key: unknown[],
  enabled: boolean,
  fetchPage: (cursor?: string) => Promise<P>,
) {
  useOpenAtFirstPage(key);
  return useInfiniteQuery({
    queryKey: key,
    queryFn: ({ pageParam }) => fetchPage(pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last: P) => last.next_cursor ?? undefined,
    enabled,
    placeholderData: keepPreviousData,
  });
}

export function useMealDays(messId: string, monthId: string) {
  return useReportPages<MealDaysPage>(
    ["report-meal-days", messId, monthId],
    !!messId && !!monthId,
    (cursor) => unwrap(getMealDaysPage(messId, monthId, cursor)),
  );
}

export function useExpenseHistory(
  messId: string,
  monthId: string,
  type?: string,
) {
  return useReportPages<ExpenseHistoryPage>(
    ["report-expenses", messId, monthId, type ?? "ALL"],
    !!messId && !!monthId,
    (cursor) => unwrap(getExpenseHistoryPage(messId, monthId, type, cursor)),
  );
}

export function useDepositHistory(
  messId: string,
  monthId: string,
  memberId?: string,
) {
  return useReportPages<DepositHistoryPage>(
    ["report-deposits", messId, monthId, memberId ?? "ALL"],
    !!messId && !!monthId,
    (cursor) =>
      unwrap(getDepositHistoryPage(messId, monthId, memberId, cursor)),
  );
}

export function useBazaarHistory(
  messId: string,
  monthId: string,
  status: string,
) {
  return useReportPages<BazaarHistoryPage>(
    ["report-bazaar", messId, monthId, status],
    !!messId && !!monthId,
    (cursor) => unwrap(getBazaarHistoryPage(messId, monthId, status, cursor)),
  );
}

/** The mess's full activity list, 10 per page, optionally one category. */
export function useActivityHistory(messId: string, category?: string) {
  return useReportPages<ActivityHistoryPage>(
    ["activity-history", messId, category ?? "all"],
    !!messId,
    (cursor) => unwrap(getActivityHistoryPage(messId, category, cursor)),
  );
}
