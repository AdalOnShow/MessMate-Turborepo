import { create } from "zustand";
import type { SuccessSummary } from "../components/feedback/SuccessDialog";

/**
 * The one success dialog of the dashboard (rendered in its layout), so it
 * survives the thing that opened it closing or disappearing, e.g. an edit
 * sheet that closes on save, or a deleted bazaar card.
 */
export const useSuccessDialog = create<{
  summary: SuccessSummary | null;
  show: (summary: SuccessSummary) => void;
  close: () => void;
}>((set) => ({
  summary: null,
  show: (summary) => set({ summary }),
  close: () => set({ summary: null }),
}));

/** Opens the success dialog from event handlers (no hook needed). */
export const showSuccess = (summary: SuccessSummary) =>
  useSuccessDialog.getState().show(summary);
