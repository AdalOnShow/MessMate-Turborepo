"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import {
  onNavigationStart,
  startNavigationProgress,
} from "@/app/lib/navigation-progress";

/** Fast navigations finish before this and never flash the bar. */
const SHOW_DELAY_MS = 120;
/** Give up eventually so a cancelled navigation never leaves the bar stuck. */
const MAX_DURATION_MS = 20_000;

type Phase = "idle" | "loading" | "done";

/** True when a click on this anchor will trigger an in-app route change. */
function isInternalNavigation(anchor: HTMLAnchorElement, event: MouseEvent) {
  if (
    event.defaultPrevented ||
    event.button !== 0 ||
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey
  ) {
    return false;
  }
  const target = anchor.getAttribute("target");
  if ((target && target !== "_self") || anchor.hasAttribute("download")) {
    return false;
  }
  const href = anchor.getAttribute("href");
  if (!href || href.startsWith("#")) return false;

  let url: URL;
  try {
    url = new URL(anchor.href, window.location.href);
  } catch {
    return false;
  }
  if (url.origin !== window.location.origin) return false;

  // Same page (or only the hash differs): nothing to wait for.
  return (
    url.pathname !== window.location.pathname ||
    url.search !== window.location.search
  );
}

function ProgressBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [phase, setPhase] = useState<Phase>("idle");
  const [progress, setProgress] = useState(0);
  const timers = useRef<number[]>([]);

  const clearTimers = () => {
    timers.current.forEach((id) => {
      window.clearTimeout(id);
      window.clearInterval(id);
    });
    timers.current = [];
  };

  // Start on internal link clicks and on explicit `startNavigationProgress()`.
  useEffect(() => {
    const start = () => {
      clearTimers();
      setProgress(0);
      setPhase("idle");

      timers.current.push(
        window.setTimeout(() => {
          setPhase("loading");
          setProgress(12);
          // Trickle towards (but never reach) 90% while waiting.
          timers.current.push(
            window.setInterval(() => {
              setProgress((p) => p + (90 - p) * 0.08);
            }, 200),
          );
        }, SHOW_DELAY_MS),
        window.setTimeout(() => {
          clearTimers();
          setPhase("idle");
        }, MAX_DURATION_MS),
      );
    };

    const onClick = (event: MouseEvent) => {
      const anchor = (event.target as Element | null)?.closest?.("a");
      if (anchor && isInternalNavigation(anchor, event)) {
        startNavigationProgress();
      }
    };

    const unsubscribe = onNavigationStart(start);
    document.addEventListener("click", onClick, true);
    return () => {
      unsubscribe();
      document.removeEventListener("click", onClick, true);
      clearTimers();
    };
  }, []);

  // The route changed: finish the bar, then hide it.
  useEffect(() => {
    clearTimers();
    setPhase((current) => (current === "loading" ? "done" : "idle"));
    setProgress(100);
    timers.current.push(
      window.setTimeout(() => {
        setPhase("idle");
        setProgress(0);
      }, 400),
    );
  }, [pathname, searchParams]);

  const visible = phase !== "idle";

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-x-0 top-0 z-[200] h-[3px]"
      style={{
        opacity: visible ? 1 : 0,
        transition: `opacity ${phase === "done" ? 300 : 150}ms ease ${
          phase === "done" ? "150ms" : "0ms"
        }`,
      }}
    >
      <div
        className="nav-progress-bar h-full origin-left"
        style={{
          transform: `scaleX(${progress / 100})`,
          transition: visible ? "transform 200ms ease-out" : "none",
        }}
      />
    </div>
  );
}

/** Slim top bar shown while the next page is building/loading. */
export function NavigationProgress() {
  return (
    <Suspense fallback={null}>
      <ProgressBar />
    </Suspense>
  );
}
