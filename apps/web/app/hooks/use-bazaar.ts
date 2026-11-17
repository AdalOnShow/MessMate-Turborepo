"use client";

import { getBazaarPage } from "../lib/reads";
import {
  keepPreviousData,
  useInfiniteQuery,
  useMutation,
  useQueryClient,
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

/**
 * Cursor-paginated submissions for one status tab. Loads one page (4 rows)
 * at a time; call `fetchNextPage()` to load more. Mutations invalidate the
 * ["bazaar-history", messId, monthId] prefix, which refreshes every tab.
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
  const query = useInfiniteQuery({
    queryKey: ["bazaar-history", messId, monthId, status],
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
  });

  const pages = query.data?.pages;
  return {
    ...query,
    // Skip malformed pages (e.g. restored from an older offline cache).
    items: pages?.flatMap((page) => page?.items ?? []) ?? [],
    counts: pages?.[0]?.counts ?? null,
  };
}

export function useSubmitBazaar(
  messId: string | undefined,
  monthId: string | undefined,
) {
  const queryClient = useQueryClient();

  return useMutation({
    meta: { successMessage: "Bazaar submitted for approval" },
    mutationFn: async (payload: CreateBazaarPayload) => {
      if (!messId || !monthId) throw new Error("No mess or month ID");
      return unwrap(submitBazaar(messId, monthId, payload));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["bazaar-history", messId, monthId],
      });
    },
  });
}

export function useUpdateBazaar(
  messId: string | undefined,
  monthId: string | undefined,
) {
  const queryClient = useQueryClient();

  return useMutation({
    meta: { successMessage: "Bazaar updated" },
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
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["bazaar-history", messId, monthId],
      });
    },
  });
}

export function useDeleteBazaar(
  messId: string | undefined,
  monthId: string | undefined,
) {
  const queryClient = useQueryClient();

  return useMutation({
    meta: { successMessage: "Bazaar deleted" },
    mutationFn: async (submissionId: string) => {
      if (!messId) throw new Error("No mess ID");
      return unwrap(deleteBazaar(messId, submissionId));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["bazaar-history", messId, monthId],
      });
    },
  });
}

export function useApproveBazaar(
  messId: string | undefined,
  monthId: string | undefined,
) {
  const queryClient = useQueryClient();

  return useMutation({
    meta: { successMessage: "Bazaar approved" },
    mutationFn: async (submissionId: string) => {
      if (!messId) throw new Error("No mess ID");
      return unwrap(approveBazaar(messId, submissionId));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["bazaar-history", messId, monthId],
      });
      queryClient.invalidateQueries({ queryKey: ["month-summary"] });
    },
  });
}

export function useRejectBazaar(
  messId: string | undefined,
  monthId: string | undefined,
) {
  const queryClient = useQueryClient();

  return useMutation({
    meta: { successMessage: "Bazaar rejected" },
    mutationFn: async (submissionId: string) => {
      if (!messId) throw new Error("No mess ID");
      return unwrap(rejectBazaar(messId, submissionId));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["bazaar-history", messId, monthId],
      });
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
