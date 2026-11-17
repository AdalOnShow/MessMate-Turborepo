import { useRef } from "react";
import { useQueryClient, type QueryKey } from "@tanstack/react-query";

/**
 * A "Load more" list should open at its first page. React Query keeps every
 * page that was loaded (in memory and in the offline cache) and refetches
 * all of them, so a list loaded 2 pages deep earlier would open with
 * 4 + 4 rows and no "Load more". Call this before `useInfiniteQuery` with
 * the same key: whenever the key changes (open, tab switch), the cached
 * data is cut back to the first page.
 */
export function useOpenAtFirstPage(queryKey: QueryKey) {
  const queryClient = useQueryClient();
  const opened = useRef<string | null>(null);
  const id = JSON.stringify(queryKey);
  if (opened.current !== id) {
    opened.current = id;
    // Runs before this component subscribes to the key, so no observer is
    // notified mid-render.
    queryClient.setQueryData<{ pages: unknown[]; pageParams: unknown[] }>(
      queryKey,
      (data) =>
        data && data.pages.length > 1
          ? {
              pages: data.pages.slice(0, 1),
              pageParams: data.pageParams.slice(0, 1),
            }
          : data,
    );
  }
}
