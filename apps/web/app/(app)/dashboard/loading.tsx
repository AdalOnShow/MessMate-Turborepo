import { Skeleton } from "../../components/ui/skeleton";

/**
 * Shown instantly inside the dashboard shell (sidebar / tab bar stay put)
 * while the next dashboard page is building or loading.
 */
export default function DashboardLoading() {
  return (
    <div role="status" aria-live="polite" className="animate-fade-in">
      <span className="sr-only">Loading…</span>

      <div className="mb-8 space-y-3">
        <Skeleton className="h-3 w-24 rounded" />
        <Skeleton className="h-8 w-64 max-w-full" />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div
            key={i}
            className="rounded-2xl border border-border bg-surface p-4"
          >
            <Skeleton className="h-3 w-16 rounded" />
            <Skeleton className="mt-3 h-7 w-20" />
          </div>
        ))}
      </div>

      <div className="mt-5 rounded-2xl border border-border bg-surface p-4 sm:p-5">
        <div className="mb-5 flex items-center justify-between">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-9 w-24" />
        </div>
        <div className="space-y-3">
          {Array.from({ length: 5 }, (_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="size-9 shrink-0 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-3.5 w-2/5 rounded" />
                <Skeleton className="h-3 w-1/4 rounded" />
              </div>
              <Skeleton className="h-4 w-14 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
