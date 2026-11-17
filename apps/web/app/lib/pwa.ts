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

function isIosDevice(ua: string) {
  return (
    /iphone|ipad|ipod/i.test(ua) ||
    // iPadOS reports itself as desktop Safari
    (ua.includes("Macintosh") && navigator.maxTouchPoints > 1)
  );
}

function getState(): InstallState {
  if (installed) return { kind: "installed" };
  if (deferredPrompt) return { kind: "prompt" };
  return isIosDevice(navigator.userAgent)
    ? { kind: "ios" }
    : { kind: "unavailable" };
}

export type DeviceOs = "ios" | "android" | "desktop";
export type DeviceBrowser =
  | "safari"
  | "chrome"
  | "samsung"
  | "brave"
  | "firefox"
  | "edge"
  | "inapp"
  | "other";
export interface DeviceEnv {
  os: DeviceOs;
  browser: DeviceBrowser;
}

/** Best-effort OS + browser sniffing, used only to pick which install guide
 *  to show first. Never gate functionality on it. */
export function detectEnvironment(): DeviceEnv {
  const ua = navigator.userAgent;
  const os: DeviceOs = isIosDevice(ua)
    ? "ios"
    : /android/i.test(ua)
      ? "android"
      : "desktop";

  let browser: DeviceBrowser;
  // In-app WebViews (Facebook, Messenger, Instagram, LINE, generic Android WebView)
  if (/FBAN|FBAV|FB_IAB|Instagram|Line\/|; wv\)/i.test(ua)) browser = "inapp";
  else if (/SamsungBrowser/i.test(ua)) browser = "samsung";
  else if ((navigator as Navigator & { brave?: unknown }).brave)
    browser = "brave";
  else if (/EdgA|EdgiOS|Edg\//i.test(ua)) browser = "edge";
  else if (/FxiOS|Firefox/i.test(ua)) browser = "firefox";
  else if (/CriOS|Chrome/i.test(ua)) browser = "chrome";
  else if (/Safari/i.test(ua)) browser = "safari";
  else browser = "other";

  // iOS in-app browsers often lack "Safari" in the UA; anything unrecognised there is a WebView.
  if (os === "ios" && browser === "other") browser = "inapp";
  return { os, browser };
}

let cachedEnv: DeviceEnv | null = null;
const noopSubscribe = () => () => {};
/** Device environment, or `null` during SSR / first hydration render. */
export function useDeviceEnv(): DeviceEnv | null {
  return useSyncExternalStore(
    noopSubscribe,
    () => (cachedEnv ??= detectEnvironment()),
    () => null,
  );
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
