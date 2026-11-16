"use client";

import { useTranslations } from "next-intl";
import { Sheet, SheetActions } from "../../ui/sheet";
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
    <Sheet
      onClose={onClose}
      title={t("removeMember")}
      size="sm"
      dismissible={!isPending}
    >
      <p className="mb-4 text-sm text-foreground-muted">
        {t("sureWantRemove")}{" "}
        <span className="font-semibold text-foreground">
          {member.user.name}
        </span>{" "}
        {t("fromMessActionCannot")}
      </p>

      <SheetActions>
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
      </SheetActions>
    </Sheet>
  );
}
