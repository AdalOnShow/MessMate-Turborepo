import { MutationCache, QueryClient } from "@tanstack/react-query";

function makeQueryClient() {
  const client: QueryClient = new QueryClient({
    // Almost every screen derives from the same month data (meals, expenses,
    // deposits, balances), so after any successful write mark everything
    // stale. Mounted queries refetch immediately; the rest refetch on next
    // use. This keeps lists and dashboard figures from going out of date.
    mutationCache: new MutationCache({
      onSuccess: () => {
        void client.invalidateQueries();
      },
    }),
    defaultOptions: {
      queries: {
        staleTime: 30 * 1000,
        retry: 1,
        refetchOnWindowFocus: false,
      },
    },
  });
  return client;
}

let browserQueryClient: QueryClient | undefined;

export function getQueryClient() {
  if (typeof window === "undefined") {
    return makeQueryClient();
  }
  if (!browserQueryClient) {
    browserQueryClient = makeQueryClient();
  }
  return browserQueryClient;
}
