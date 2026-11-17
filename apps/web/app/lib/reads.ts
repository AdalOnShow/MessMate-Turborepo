// Read requests. They run in the browser through /api (see
// app/api/[...path]/route.ts) so they load in parallel; server actions
// would queue them one after another. Writes stay in app/actions.

import { apiGet } from "./api-read";
import type { BazaarPageInfo, BazaarStatus } from "../actions/bazaar";
import type {
  DepositListInfo,
  DepositSummaryResponseInfo,
} from "../actions/deposits";
import type {
  ExpenseListInfo,
  ExpenseSummaryResponseInfo,
} from "../actions/expenses";
import type { PendingInvite } from "../actions/invites";
import type {
  DailyMealReport,
  MealEntryInfo,
  MemberMealReport,
  MonthMealSummary,
} from "../actions/meals";
import type {
  ActivityLogInfo,
  MemberCalculationListInfo,
  MemberDashboardInfo,
  MemberData,
  MessDashboardInfo,
  UserSearchResult,
} from "../actions/members";
import type { MealTypeInfo, MessInfo } from "../actions/messes";
import type { MonthInfo, MonthSummaryInfo } from "../actions/months";
import type { ProfileUser } from "../actions/auth";

export function getBazaarPage(
  messId: string,
  monthId: string,
  status: BazaarStatus,
  cursor?: string,
) {
  const params = new URLSearchParams({ status });
  if (cursor) params.set("cursor", cursor);
  return apiGet<BazaarPageInfo>(`/bazaar/${messId}/${monthId}?${params}`);
}

export function getDeposits(messId: string, monthId: string) {
  return apiGet<DepositListInfo>(`/deposits/${messId}/${monthId}`);
}

export function getDepositSummary(messId: string, monthId: string) {
  return apiGet<DepositSummaryResponseInfo>(
    `/deposits/${messId}/${monthId}/summary`,
  );
}

export function getExpenses(messId: string, monthId: string) {
  return apiGet<ExpenseListInfo>(`/expenses/${messId}/${monthId}`);
}

export function getExpenseSummary(messId: string, monthId: string) {
  return apiGet<ExpenseSummaryResponseInfo>(
    `/expenses/${messId}/${monthId}/summary`,
  );
}

export function getPendingInvites() {
  return apiGet<PendingInvite[]>("/invites/pending");
}

export function getMealEntries(
  messId: string,
  monthId: string,
  startDate: string,
  endDate: string,
) {
  return apiGet<MealEntryInfo[]>(
    `/meals/${messId}/${monthId}?startDate=${startDate}&endDate=${endDate}`,
  );
}

export function getDailyMealReport(
  messId: string,
  monthId: string,
  date: string,
) {
  return apiGet<DailyMealReport>(
    `/meals/${messId}/${monthId}/daily?date=${date}`,
  );
}

export function getMemberMealReport(
  messId: string,
  monthId: string,
  memberId: string,
) {
  return apiGet<MemberMealReport>(
    `/meals/${messId}/${monthId}/member/${memberId}`,
  );
}

export function getMonthMealSummary(messId: string, monthId: string) {
  return apiGet<MonthMealSummary>(`/meals/${messId}/${monthId}/summary`);
}

export function getMembers(
  messId: string,
  filters?: { search?: string; role?: string; status?: string },
) {
  const params = new URLSearchParams();
  if (filters?.search) params.set("search", filters.search);
  if (filters?.role) params.set("role", filters.role);
  if (filters?.status) params.set("status", filters.status);

  const query = params.toString();
  const path = `/messes/${messId}/members${query ? `?${query}` : ""}`;

  return apiGet<MemberData[]>(path);
}

export function getMemberCalculations(messId: string) {
  return apiGet<MemberCalculationListInfo>(
    `/messes/${messId}/members/calculations`,
  );
}

export function getMessDashboard(messId: string) {
  return apiGet<MessDashboardInfo>(`/messes/${messId}/dashboard`);
}

export function getMemberDashboard(messId: string) {
  return apiGet<MemberDashboardInfo>(`/messes/${messId}/member/me`);
}

export function getRecentActivities(messId: string) {
  return apiGet<ActivityLogInfo[]>(`/messes/${messId}/activities`);
}

export function searchUsers(query: string) {
  return apiGet<UserSearchResult[]>(
    `/users/search?q=${encodeURIComponent(query)}`,
  );
}

export function getMyMess() {
  return apiGet<MessInfo | null>("/messes/me");
}

export function getMealTypes(messId: string) {
  return apiGet<MealTypeInfo[]>(`/messes/${messId}/meal-types`);
}

export function getActiveMonth(messId: string) {
  return apiGet<MonthInfo | null>(`/months/${messId}/active`);
}

export function getMonthHistory(messId: string) {
  return apiGet<MonthInfo[]>(`/months/${messId}/history`);
}

export function getMonthSummary(messId: string, monthId: string) {
  return apiGet<MonthSummaryInfo>(`/months/${messId}/${monthId}/summary`);
}

export function getProfile() {
  return apiGet<ProfileUser>("/users/me");
}
