import Image from "next/image";

/**
 * Full-screen branded loader used while the session is being established or
 * a top-level route is loading — replaces a blank screen.
 */
export function AppSplash() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="splash-enter flex min-h-dvh flex-col items-center justify-center gap-6 bg-background"
    >
      <div className="relative flex size-16 items-center justify-center">
        <span className="splash-ring absolute inset-0 rounded-2xl border border-primary/40" />
        <div className="relative flex size-16 items-center justify-center rounded-2xl border border-border bg-surface-raised shadow-panel">
          <Image
            src="/messmate-icon.png"
            alt=""
            width={460}
            height={400}
            priority
            className="h-8 w-auto object-contain"
          />
        </div>
      </div>
      <div className="flex flex-col items-center gap-3">
        <p className="text-lg font-extrabold tracking-[-0.03em] text-foreground">
          Mess<span className="text-primary">Mate</span>
        </p>
        <div className="h-1 w-28 overflow-hidden rounded-full bg-surface-raised">
          <div className="splash-track h-full w-1/3 rounded-full bg-primary" />
        </div>
      </div>
      <span className="sr-only">Loading…</span>
    </div>
  );
}
