"use client";

import { useTranslations } from "next-intl";
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
  const t = useTranslations("members.removeMemberDialog");
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-sm rounded-xl border border-border bg-background p-6">
        <h2 className="mb-2 text-lg font-bold text-foreground">
          {t("removeMember")}
        </h2>
        <p className="mb-4 text-sm text-foreground-muted">
          {t("sureWantRemove")}{" "}
          <span className="font-semibold text-foreground">
            {member.user.name}
          </span>{" "}
          {t("fromMessActionCannot")}
        </p>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-border-strong px-4 py-2 text-sm font-semibold text-foreground-muted transition-colors hover:bg-surface-raised"
          >
            {t("cancel")}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isPending}
            className="rounded-lg bg-destructive px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-destructive/90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPending ? t("removing") : "Remove"}
          </button>
        </div>
      </div>
    </div>
  );
}
