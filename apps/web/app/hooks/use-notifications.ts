"use client";

import { useCallback, useSyncExternalStore } from "react";
import { useSessionStore } from "../store";
import { useGetMyMess } from "./use-messes";
import { useRecentActivities } from "./use-members";

/*
 * "Unread" notifications = recent activity by other people since this user
 * last opened the Notifications page. The time is kept per user on this
 * device only (a convenience: losing it just shows the dot once more).
 */

const key = (userId: string) => `messmate:notifications-seen:${userId}`;
const listeners = new Set<() => void>();

function readSeen(userId: string | undefined): number {
  if (!userId) return 0;
  try {
    return Number(localStorage.getItem(key(userId))) || 0;
  } catch {
    return 0;
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useUnreadNotifications() {
  const userId = useSessionStore((s) => s.user?.id);
  const { data: myMess } = useGetMyMess();
  const { data: activities } = useRecentActivities(myMess?.id);
  const seen = useSyncExternalStore(
    subscribe,
    () => readSeen(userId),
    () => 0,
  );

  const unread = (activities ?? []).filter(
    (a) => a.actor.id !== userId && new Date(a.created_at).getTime() > seen,
  ).length;

  /** Marks everything up to now as read. */
  const markSeen = useCallback(() => {
    if (!userId) return;
    try {
      localStorage.setItem(key(userId), String(Date.now()));
    } catch {
      // Storage unavailable: the dot just stays.
    }
    listeners.forEach((l) => l());
  }, [userId]);

  return { unread, markSeen };
}
