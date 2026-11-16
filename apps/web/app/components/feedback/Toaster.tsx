"use client";

import { useEffect, useState } from "react";
import { AlertCircle, CheckCircle2, Copy, Info, X } from "lucide-react";
import { cn } from "@/app/lib/utils";
import { useToastStore, type Toast } from "@/app/store/toast";

const VARIANT_STYLES = {
  success: { icon: CheckCircle2, accent: "text-success", bar: "bg-success" },
  error: {
    icon: AlertCircle,
    accent: "text-destructive",
    bar: "bg-destructive",
  },
  info: { icon: Info, accent: "text-primary", bar: "bg-primary" },
} as const;

function ToastItem({ toast }: { toast: Toast }) {
  const dismiss = useToastStore((s) => s.dismiss);
  const [paused, setPaused] = useState(false);
  const [copied, setCopied] = useState(false);
  const { icon: Icon, accent, bar } = VARIANT_STYLES[toast.variant];

  useEffect(() => {
    if (paused) return;
    const timer = setTimeout(() => dismiss(toast.id), toast.duration);
    return () => clearTimeout(timer);
  }, [paused, toast.id, toast.duration, dismiss]);

  const copyReference = async () => {
    if (!toast.reference) return;
    try {
      await navigator.clipboard.writeText(toast.reference);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard unavailable (insecure context); the code is still visible.
    }
  };

  return (
    <div
      role={toast.variant === "error" ? "alert" : "status"}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      className="animate-scale-in pointer-events-auto relative flex w-full gap-3 overflow-hidden rounded-xl border border-border bg-surface-raised p-4 pl-5 shadow-panel"
    >
      <span className={cn("absolute inset-y-0 left-0 w-1", bar)} aria-hidden />
      <Icon size={18} className={cn("mt-0.5 shrink-0", accent)} aria-hidden />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-foreground">{toast.title}</p>
        {toast.description && (
          <p className="mt-0.5 text-sm text-foreground-muted">
            {toast.description}
          </p>
        )}
        {toast.reference && (
          <button
            type="button"
            onClick={copyReference}
            className="mt-2 inline-flex items-center gap-1.5 rounded-md bg-surface px-2 py-1 font-mono text-[11px] text-foreground-muted transition-colors hover:text-foreground"
            title="Copy reference code"
          >
            <Copy size={12} aria-hidden />
            {copied ? "Copied" : `Ref: ${toast.reference.slice(0, 8)}`}
          </button>
        )}
      </div>
      <button
        type="button"
        onClick={() => dismiss(toast.id)}
        className="-mr-1 -mt-1 h-7 w-7 shrink-0 rounded-md text-foreground-muted transition-colors hover:bg-surface hover:text-foreground"
        aria-label="Dismiss notification"
      >
        <X size={16} className="mx-auto" />
      </button>
    </div>
  );
}

export function Toaster() {
  const toasts = useToastStore((s) => s.toasts);

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-4 bottom-24 z-100 flex flex-col items-end gap-2 sm:inset-x-auto sm:right-6 sm:bottom-6 sm:w-96 lg:bottom-6"
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </div>
  );
}
