"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { cn } from "@/app/lib/utils";

const FOCUSABLE =
  'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

/**
 * Modal that is a swipeable bottom sheet on phones and a centered dialog
 * from `sm` up. Render it conditionally: mounted = open.
 *
 * Closes on backdrop tap, Escape, or dragging the handle down.
 */
export function Sheet({
  onClose,
  title,
  description,
  children,
  className,
  size = "md",
  dismissible = true,
}: {
  onClose: () => void;
  title?: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  className?: string;
  size?: "sm" | "md" | "lg";
  /** Set false while a mutation is pending so the user can't lose it. */
  dismissible?: boolean;
}) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const [dragY, setDragY] = useState(0);
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef(0);

  // Keep the latest callbacks without re-running the mount effect.
  const onCloseRef = useRef(onClose);
  const dismissibleRef = useRef(dismissible);
  useEffect(() => {
    onCloseRef.current = onClose;
    dismissibleRef.current = dismissible;
  });

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const panel = panelRef.current;

    // Lock background scroll (iOS-safe enough for our layout).
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";

    // Focus the first field unless something inside already has autoFocus.
    if (panel && !panel.contains(document.activeElement)) {
      const first = panel.querySelector<HTMLElement>(
        "input:not([disabled]),select,textarea",
      );
      (first ?? panel).focus({ preventScroll: true });
    }

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && dismissibleRef.current) {
        e.stopPropagation();
        onCloseRef.current();
        return;
      }
      if (e.key !== "Tab" || !panel) return;
      const nodes = Array.from(
        panel.querySelectorAll<HTMLElement>(FOCUSABLE),
      ).filter((n) => n.offsetParent !== null);
      if (nodes.length === 0) {
        e.preventDefault();
        return;
      }
      const first = nodes[0]!;
      const last = nodes[nodes.length - 1]!;
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = overflow;
      previouslyFocused?.focus?.({ preventScroll: true });
    };
  }, []);

  function onPointerDown(e: ReactPointerEvent) {
    if (!dismissible) return;
    dragStart.current = e.clientY;
    setDragging(true);
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }
  function onPointerMove(e: ReactPointerEvent) {
    if (!dragging) return;
    setDragY(Math.max(0, e.clientY - dragStart.current));
  }
  function onPointerUp() {
    if (!dragging) return;
    setDragging(false);
    if (dragY > 100) onClose();
    else setDragY(0);
  }

  if (typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center sm:p-4">
      <div
        aria-hidden="true"
        className="animate-fade-in absolute inset-0 bg-black/60 backdrop-blur-[2px]"
        onClick={() => dismissible && onClose()}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        tabIndex={-1}
        style={dragY ? { transform: `translateY(${dragY}px)` } : undefined}
        className={cn(
          "animate-sheet-up sm:animate-pop-in relative flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-3xl border border-b-0 border-border bg-background shadow-panel outline-none sm:rounded-2xl sm:border-b",
          !dragging && "transition-transform duration-200",
          size === "sm" && "sm:max-w-sm",
          size === "md" && "sm:max-w-md",
          size === "lg" && "sm:max-w-2xl",
        )}
      >
        {/* Drag handle (phones only) */}
        <div
          className="flex shrink-0 touch-none justify-center pb-1 pt-3 sm:hidden"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          <span className="h-1.5 w-10 rounded-full bg-border-strong" />
        </div>

        {(title || description) && (
          <div
            className="shrink-0 touch-none px-5 pb-2 pt-2 sm:px-6 sm:pt-6"
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
          >
            {title && (
              <h2 id={titleId} className="text-lg font-bold text-foreground">
                {title}
              </h2>
            )}
            {description && (
              <p className="mt-1 text-sm text-foreground-muted">
                {description}
              </p>
            )}
          </div>
        )}

        <div
          className={cn(
            "overflow-y-auto overscroll-contain px-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] pt-2 sm:px-6 sm:pb-6",
            className,
          )}
        >
          {children}
        </div>
      </div>
    </div>,
    document.body,
  );
}

/**
 * Footer row for sheet actions: stacked full-width on phones, right-aligned on
 * larger screens. Buttons get the 44px phone height; a wrapper `div` that
 * groups buttons keeps its natural height, or its stacked buttons would
 * overflow upwards over the form.
 */
export function SheetActions({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-3 [&>*]:w-full sm:[&>*]:w-auto [&>:not(div)]:h-11 sm:[&>:not(div)]:h-auto",
        className,
      )}
    >
      {children}
    </div>
  );
}
