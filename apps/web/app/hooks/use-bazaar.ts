"use client";

import { getBazaarPage } from "../lib/reads";
import {
  keepPreviousData,
  useInfiniteQuery,
  useMutation,
  useQueryClient,
  type InfiniteData,
  type QueryClient,
} from "@tanstack/react-query";
import {
  submitBazaar,
  updateBazaar,
  deleteBazaar,
  approveBazaar,
  rejectBazaar,
  type BazaarSubmissionInfo,
  type BazaarPageInfo,
  type BazaarStatus,
  type BazaarStatusCountsInfo,
  type BazaarItemInfo,
  type CreateBazaarPayload,
  type UpdateBazaarPayload,
} from "../actions/bazaar";
import { unwrap } from "../lib/action-result";
import { useOpenAtFirstPage } from "../lib/infinite-pages";

/**
 * Cursor-paginated submissions for one status tab. Loads one page (4 rows)
 * at a time; call `fetchNextPage()` to load more.
 *
 * Writes update this cache in place (see `bazaarCache`) instead of
 * refetching it: refetching an infinite query re-requests every page
 * already loaded, one after another, which made the page slow after each
 * add/approve/reject once a few pages were open.
 *
 * `keepPreviousData` keeps the old tab's data (and its status counts) on
 * screen while a newly selected tab loads; check `isPlaceholderData` before
 * rendering `items`.
 */
export function useBazaarSubmissions(
  messId: string | undefined,
  monthId: string | undefined,
  status: BazaarStatus,
) {
  const queryKey = ["bazaar-history", messId, monthId, status];
  useOpenAtFirstPage(queryKey);
  const query = useInfiniteQuery({
    queryKey,
    queryFn: async ({ pageParam }) => {
      const page = await unwrap(
        getBazaarPage(messId!, monthId!, status, pageParam),
      );
      // An API that predates pagination returns { pending, approved,
      // rejected } instead. Fail loudly (shows the retry state and is never
      // persisted) rather than caching a page the list can't render.
      if (!page || !Array.isArray(page.items)) {
        throw new Error(
          "The server sent an unexpected response. Please try again.",
        );
      }
      return page;
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage: BazaarPageInfo) =>
      lastPage.next_cursor ?? undefined,
    enabled: !!messId && !!monthId,
    placeholderData: keepPreviousData,
    // Kept up to date by the mutations below, not by the global
    // "invalidate everything after a write" in query-client.ts.
    meta: { manualCacheUpdate: true },
  });

  const pages = query.data?.pages;
  return {
    ...query,
    // Skip malformed pages (e.g. restored from an older offline cache).
    items: pages?.flatMap((page) => page?.items ?? []) ?? [],
    counts: pages?.[0]?.counts ?? null,
  };
}

type BazaarPages = InfiniteData<BazaarPageInfo, string | undefined>;
type CountKey = keyof BazaarStatusCountsInfo;
const countKey = (status: BazaarStatus) => status.toLowerCase() as CountKey;

/**
 * In-place updates of the cached bazaar tabs for one month, so a write
 * costs at most one small request instead of re-fetching every loaded page.
 */
function bazaarCache(
  queryClient: QueryClient,
  messId: string | undefined,
  monthId: string | undefined,
) {
  const prefix = ["bazaar-history", messId, monthId];
  const tabKey = (status: BazaarStatus) => [...prefix, status];

  /** Apply `fn` to one tab's cached pages, if that tab was loaded. */
  const editTab = (status: BazaarStatus, fn: (d: BazaarPages) => BazaarPages) =>
    queryClient.setQueryData<BazaarPages>(tabKey(status), (d) =>
      d ? fn(d) : d,
    );

  /** The status counts live on each tab's first page; keep them all in step. */
  const shiftCounts = (delta: Partial<Record<CountKey, number>>) =>
    queryClient.setQueriesData<BazaarPages>({ queryKey: prefix }, (d) => {
      const first = d?.pages[0];
      if (!d || !first?.counts) return d;
      const counts = { ...first.counts };
      for (const [k, v] of Object.entries(delta) as [CountKey, number][]) {
        counts[k] = Math.max(0, counts[k] + v);
      }
      return { ...d, pages: [{ ...first, counts }, ...d.pages.slice(1)] };
    });

  const without = (d: BazaarPages, id: string): BazaarPages => ({
    ...d,
    pages: d.pages.map((p) => ({
      ...p,
      items: p.items.filter((i) => i.id !== id),
    })),
  });

  return {
    /** A new submission is the newest pending one: put it on top. */
    added(item: BazaarSubmissionInfo) {
      editTab("PENDING", (d) => ({
        ...d,
        pages: d.pages.map((p, i) =>
          i === 0 ? { ...p, items: [item, ...p.items] } : p,
        ),
      }));
      shiftCounts({ pending: 1 });
    },
    /** Same row, new contents (still pending). */
    replaced(item: BazaarSubmissionInfo) {
      editTab(item.status, (d) => ({
        ...d,
        pages: d.pages.map((p) => ({
          ...p,
          items: p.items.map((i) => (i.id === item.id ? item : i)),
        })),
      }));
    },
    /**
     * Approved/rejected: leaves Pending. The target tab is dropped so it
     * loads its first page fresh (and in the right order) when opened.
     */
    moved(item: BazaarSubmissionInfo, from: BazaarStatus) {
      editTab(from, (d) => without(d, item.id));
      shiftCounts({ [countKey(from)]: -1, [countKey(item.status)]: 1 });
      queryClient.removeQueries({ queryKey: tabKey(item.status), exact: true });
    },
    removed(id: string) {
      for (const status of ["PENDING", "APPROVED", "REJECTED"] as const) {
        const d = queryClient.getQueryData<BazaarPages>(tabKey(status));
        if (d?.pages.some((p) => p.items.some((i) => i.id === id))) {
          editTab(status, (data) => without(data, id));
          shiftCounts({ [countKey(status)]: -1 });
        }
      }
    },
  };
}

export function useSubmitBazaar(
  messId: string | undefined,
  monthId: string | undefined,
) {
  const queryClient = useQueryClient();

  return useMutation({
    // No toast: the page shows a SuccessDialog with what was saved.
    mutationFn: async (payload: CreateBazaarPayload) => {
      if (!messId || !monthId) throw new Error("No mess or month ID");
      return unwrap(submitBazaar(messId, monthId, payload));
    },
    onSuccess: (created) => {
      bazaarCache(queryClient, messId, monthId).added(created);
    },
  });
}

export function useUpdateBazaar(
  messId: string | undefined,
  monthId: string | undefined,
) {
  const queryClient = useQueryClient();

  return useMutation({
    // No toast: the page shows a SuccessDialog with what changed.
    mutationFn: async ({
      submissionId,
      data,
    }: {
      submissionId: string;
      data: UpdateBazaarPayload;
    }) => {
      if (!messId) throw new Error("No mess ID");
      return unwrap(updateBazaar(messId, submissionId, data));
    },
    onSuccess: (updated) => {
      bazaarCache(queryClient, messId, monthId).replaced(updated);
    },
  });
}

export function useDeleteBazaar(
  messId: string | undefined,
  monthId: string | undefined,
) {
  const queryClient = useQueryClient();

  return useMutation({
    // No toast: the page shows a SuccessDialog with what changed.
    mutationFn: async (submissionId: string) => {
      if (!messId) throw new Error("No mess ID");
      return unwrap(deleteBazaar(messId, submissionId));
    },
    onSuccess: (_data, submissionId) => {
      bazaarCache(queryClient, messId, monthId).removed(submissionId);
    },
  });
}

export function useApproveBazaar(
  messId: string | undefined,
  monthId: string | undefined,
) {
  const queryClient = useQueryClient();

  return useMutation({
    meta: { successMessage: "bazaarApproved" },
    mutationFn: async (submissionId: string) => {
      if (!messId) throw new Error("No mess ID");
      return unwrap(approveBazaar(messId, submissionId));
    },
    onSuccess: (approved) => {
      bazaarCache(queryClient, messId, monthId).moved(approved, "PENDING");
    },
  });
}

export function useRejectBazaar(
  messId: string | undefined,
  monthId: string | undefined,
) {
  const queryClient = useQueryClient();

  return useMutation({
    meta: { successMessage: "bazaarRejected" },
    mutationFn: async (submissionId: string) => {
      if (!messId) throw new Error("No mess ID");
      return unwrap(rejectBazaar(messId, submissionId));
    },
    onSuccess: (rejected) => {
      bazaarCache(queryClient, messId, monthId).moved(rejected, "PENDING");
    },
  });
}

export type {
  BazaarSubmissionInfo,
  BazaarPageInfo,
  BazaarStatus,
  BazaarStatusCountsInfo,
  BazaarItemInfo,
  CreateBazaarPayload,
  UpdateBazaarPayload,
};
