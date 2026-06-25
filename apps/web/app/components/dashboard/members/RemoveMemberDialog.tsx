"use client";

import type { MemberData } from "../../../hooks/use-members";

export function RemoveMemberDialog({
  member,
  onClose,
  onConfirm,
  isPending,
}: {
  member: MemberData;
  onClose: () => void;
  onConfirm: () => void;
  isPending: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-sm rounded-xl border border-foreground-muted/15 bg-background p-6">
        <h2 className="mb-2 text-lg font-bold text-foreground">
          Remove Member
        </h2>
        <p className="mb-4 text-sm text-foreground-muted">
          Are you sure you want to remove{" "}
          <span className="font-semibold text-foreground">
            {member.user.name}
          </span>{" "}
          from this mess? This action cannot be undone.
        </p>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-foreground-muted/20 px-4 py-2 text-sm font-semibold text-foreground-muted transition-colors hover:bg-surface-raised"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isPending}
            className="rounded-lg bg-destructive px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-destructive/90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPending ? "Removing..." : "Remove"}
          </button>
        </div>
      </div>
    </div>
  );
}
