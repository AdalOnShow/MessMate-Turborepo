"use client";

import { useSyncExternalStore } from "react";

/** Chrome/Edge/Samsung fire this before showing their own install banner. */
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

let deferredPrompt: BeforeInstallPromptEvent | null = null;
let installed = false;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((l) => l());

function isStandalone() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    // iOS Safari
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

/** Called once from Providers: registers the service worker and starts
 *  listening for the install prompt as early as possible. */
export function initPwa() {
  if (typeof window === "undefined") return;

  installed = isStandalone();

  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredPrompt = e as BeforeInstallPromptEvent;
    notify();
  });
  window.addEventListener("appinstalled", () => {
    deferredPrompt = null;
    installed = true;
    notify();
  });

  if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
    const register = () =>
      navigator.serviceWorker.register("/sw.js").catch(() => {
        /* install is optional; the app works without it */
      });
    if (document.readyState === "complete") register();
    else window.addEventListener("load", register, { once: true });
  }
}

export type InstallState =
  | { kind: "installed" }
  | { kind: "prompt" } // native install dialog available
  | { kind: "ios" } // must use Share → Add to Home Screen
  | { kind: "unavailable" };

function getState(): InstallState {
  if (installed) return { kind: "installed" };
  if (deferredPrompt) return { kind: "prompt" };
  const ua = navigator.userAgent;
  const isIos =
    /iphone|ipad|ipod/i.test(ua) ||
    (ua.includes("Macintosh") && navigator.maxTouchPoints > 1);
  return isIos ? { kind: "ios" } : { kind: "unavailable" };
}

// Snapshots must be referentially stable between changes.
let cached: InstallState = { kind: "unavailable" };
function getSnapshot() {
  const next = getState();
  if (next.kind !== cached.kind) cached = next;
  return cached;
}
const serverSnapshot: InstallState = { kind: "unavailable" };

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function useInstallState() {
  return useSyncExternalStore(subscribe, getSnapshot, () => serverSnapshot);
}

export async function promptInstall() {
  if (!deferredPrompt) return false;
  await deferredPrompt.prompt();
  const { outcome } = await deferredPrompt.userChoice;
  deferredPrompt = null;
  notify();
  return outcome === "accepted";
}
