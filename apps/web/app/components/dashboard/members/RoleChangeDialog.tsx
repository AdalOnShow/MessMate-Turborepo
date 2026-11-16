"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import type { MemberData } from "../../../hooks/use-members";

export function RoleChangeDialog({
  member,
  managerCount,
  onClose,
  onConfirm,
  isPending,
}: {
  member: MemberData;
  managerCount: number;
  onClose: () => void;
  onConfirm: (role: "MANAGER" | "MEMBER") => void;
  isPending: boolean;
}) {
  const t = useTranslations("members.roleChangeDialog");
  const [selectedRole, setSelectedRole] = useState<"MANAGER" | "MEMBER">(
    member.mess_role,
  );

  const isCurrentManager = member.mess_role === "MANAGER";
  const isLastManager = isCurrentManager && managerCount <= 1;
  const isMaxManagers = !isCurrentManager && managerCount >= 2;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-sm rounded-xl border border-border bg-background p-6">
        <h2 className="mb-2 text-lg font-bold text-foreground">{t("changeRole")}</h2>
        <p className="mb-4 text-sm text-foreground-muted">
          {t("updateRole")}{" "}{member.user.name}
        </p>

        <div className="mb-4 space-y-2">
          <label
            className={`flex items-center gap-3 rounded-lg border p-3 transition-colors ${
              selectedRole === "MANAGER"
                ? "border-primary bg-primary/10"
                : "border-border-strong hover:bg-surface-raised"
            } ${isMaxManagers ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
          >
            <input
              type="radio"
              name="role"
              value="MANAGER"
              checked={selectedRole === "MANAGER"}
              onChange={() => !isMaxManagers && setSelectedRole("MANAGER")}
              disabled={isMaxManagers}
              className="accent-primary"
            />
            <div>
              <p className="text-sm font-semibold text-foreground">{t("manager")}</p>
              <p className="text-xs text-foreground-muted">
                {t("canManageMembersMeals")}
              </p>
            </div>
          </label>

          <label
            className={`flex items-center gap-3 rounded-lg border p-3 transition-colors ${
              selectedRole === "MEMBER"
                ? "border-primary bg-primary/10"
                : "border-border-strong hover:bg-surface-raised"
            } ${isLastManager ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
          >
            <input
              type="radio"
              name="role"
              value="MEMBER"
              checked={selectedRole === "MEMBER"}
              onChange={() => !isLastManager && setSelectedRole("MEMBER")}
              disabled={isLastManager}
              className="accent-primary"
            />
            <div>
              <p className="text-sm font-semibold text-foreground">{t("member")}</p>
              <p className="text-xs text-foreground-muted">
                {t("canViewDataAdd")}
              </p>
            </div>
          </label>
        </div>

        {isMaxManagers && (
          <p className="mb-4 text-xs text-destructive">
            {t("maximum2ManagersAllowed")}
          </p>
        )}

        {isLastManager && (
          <p className="mb-4 text-xs text-destructive">
            {t("cannotDemoteLastManager")}
          </p>
        )}

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
            onClick={() => onConfirm(selectedRole)}
            disabled={
              isPending ||
              selectedRole === member.mess_role ||
              isLastManager ||
              isMaxManagers
            }
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPending ? t("updating") : "Confirm"}
          </button>
        </div>
      </div>
    </div>
  );
}
