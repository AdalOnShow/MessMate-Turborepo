import { create } from "zustand";

export type ToastVariant = "success" | "error" | "info";

export interface Toast {
  id: string;
  variant: ToastVariant;
  title: string;
  description?: string;
  /** Request id shown as a reference code for support on server errors. */
  reference?: string;
  duration: number;
}

interface ToastStore {
  toasts: Toast[];
  push: (toast: Omit<Toast, "id">) => string;
  dismiss: (id: string) => void;
}

const MAX_TOASTS = 4;

export const useToastStore = create<ToastStore>((set, get) => ({
  toasts: [],
  push: (toast) => {
    // Collapse duplicates (e.g. several queries failing for the same reason).
    const existing = get().toasts.find(
      (t) => t.title === toast.title && t.variant === toast.variant,
    );
    if (existing) return existing.id;

    const id = crypto.randomUUID();
    set((state) => ({
      toasts: [...state.toasts, { ...toast, id }].slice(-MAX_TOASTS),
    }));
    return id;
  },
  dismiss: (id) =>
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
}));

type ToastOptions = {
  description?: string;
  reference?: string;
  duration?: number;
};

function show(variant: ToastVariant, title: string, options?: ToastOptions) {
  return useToastStore.getState().push({
    variant,
    title,
    description: options?.description,
    reference: options?.reference,
    duration: options?.duration ?? (variant === "error" ? 7000 : 4000),
  });
}

/** Imperative toast API, usable outside React (e.g. in the query client). */
export const toast = {
  success: (title: string, options?: ToastOptions) =>
    show("success", title, options),
  error: (title: string, options?: ToastOptions) =>
    show("error", title, options),
  info: (title: string, options?: ToastOptions) => show("info", title, options),
  dismiss: (id: string) => useToastStore.getState().dismiss(id),
};
