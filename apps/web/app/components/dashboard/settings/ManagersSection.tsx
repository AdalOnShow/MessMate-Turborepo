"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { AlertTriangle, Check, Crown, Search } from "lucide-react";
import { useSessionStore } from "../../../store";
import {
  useHandoverManager,
  useMembers,
  useUpdateMemberRole,
  type MemberData,
} from "../../../hooks/use-members";
import { cn } from "../../../lib/utils";
import { Sheet, SheetActions } from "../../ui/sheet";
import { Skeleton } from "../../ui/skeleton";
import { QueryErrorState } from "../../feedback/QueryErrorState";
import { UserAvatar } from "../UserAvatar";

/** ADR-004: at most 2 managers per mess. */
const MAX_MANAGERS = 2;

type PickMode = "handover" | "coManager";

/**
 * Mess Settings → Managers: hand the manager role to another member, add a
 * co-manager, step down, or make the other manager a member again.
 */
export function ManagersSection({ messId }: { messId: string }) {
  const t = useTranslations("pages.settings.managers");
  const currentUserId = useSessionStore((s) => s.user?.id);
  const membersQuery = useMembers(messId, { status: "ACTIVE" });
  const handover = useHandoverManager(messId);
  const updateRole = useUpdateMemberRole(messId);

  const [pickMode, setPickMode] = useState<PickMode | null>(null);
  const [demoteTarget, setDemoteTarget] = useState<MemberData | null>(null);

  const members = useMemo(() => membersQuery.data ?? [], [membersQuery.data]);
  const managers = members.filter((m) => m.mess_role === "MANAGER");
  const candidates = members.filter((m) => m.mess_role === "MEMBER");
  const canAddCoManager = managers.length < MAX_MANAGERS;
  const otherManager = managers.find((m) => m.user_id !== currentUserId);

  return (
    <section className="max-w-2xl rounded-xl border border-border bg-surface p-6">
      <div className="mb-1 flex items-center gap-2">
        <Crown size={18} className="text-primary" />
        <h2 className="text-lg font-semibold text-foreground">{t("title")}</h2>
      </div>
      <p className="mb-5 text-sm text-foreground-muted">{t("desc")}</p>

      {membersQuery.isPending ? (
        <div className="space-y-2">
          <Skeleton className="h-16 rounded-xl" />
          <Skeleton className="h-11 w-40 rounded-lg" />
        </div>
      ) : membersQuery.isError ? (
        <QueryErrorState
          error={membersQuery.error}
          onRetry={membersQuery.refetch}
          isRetrying={membersQuery.isFetching}
          resource="managers"
        />
      ) : (
        <>
          <ul className="space-y-2">
            {managers.map((m) => {
              const isMe = m.user_id === currentUserId;
              return (
                <li
                  key={m.id}
                  className="flex items-center gap-3 rounded-xl border border-border bg-surface-raised/60 p-3"
                >
                  <UserAvatar
                    name={m.user.name}
                    email={m.user.email}
                    avatar={m.user.avatar}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-1.5 truncate text-sm font-semibold text-foreground">
                      <span className="truncate">{m.user.name}</span>
                      {isMe && (
                        <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                          {t("you")}
                        </span>
                      )}
                    </p>
                    <p className="truncate text-xs text-foreground-muted">
                      {m.user.email}
                    </p>
                  </div>
                  {currentUserId && !isMe && (
                    <button
                      type="button"
                      onClick={() => setDemoteTarget(m)}
                      className="shrink-0 rounded-lg border border-border-strong px-3 py-1.5 text-xs font-semibold text-foreground-muted transition-colors hover:bg-surface-raised hover:text-foreground"
                    >
                      {t("makeMember")}
                    </button>
                  )}
                </li>
              );
            })}
          </ul>

          {candidates.length === 0 ? (
            <p className="mt-4 text-sm text-foreground-muted">
              {t("noEligible")}
            </p>
          ) : null}

          <div className="mt-5 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setPickMode("handover")}
              disabled={candidates.length === 0}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
            >
              {t("handOver")}
            </button>
            {canAddCoManager && (
              <button
                type="button"
                onClick={() => setPickMode("coManager")}
                disabled={candidates.length === 0}
                className="rounded-lg border border-border-strong px-4 py-2 text-sm font-semibold text-foreground-muted transition-colors hover:bg-surface-raised hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
              >
                {t("addCoManager")}
              </button>
            )}
            {otherManager && currentUserId && (
              <button
                type="button"
                onClick={() =>
                  setDemoteTarget(
                    managers.find((m) => m.user_id === currentUserId) ?? null,
                  )
                }
                className="rounded-lg border border-destructive/25 px-4 py-2 text-sm font-semibold text-destructive transition-colors hover:bg-destructive/10"
              >
                {t("stepDown")}
              </button>
            )}
          </div>
        </>
      )}

      {pickMode && (
        <PickMemberSheet
          mode={pickMode}
          candidates={candidates}
          isPending={handover.isPending || updateRole.isPending}
          onClose={() => setPickMode(null)}
          onConfirm={(member) => {
            const done = { onSuccess: () => setPickMode(null) };
            if (pickMode === "handover") {
              handover.mutate(member.user_id, done);
            } else {
              updateRole.mutate(
                { userId: member.user_id, role: "MANAGER" },
                done,
              );
            }
          }}
        />
      )}

      {demoteTarget && (
        <DemoteSheet
          member={demoteTarget}
          isSelf={demoteTarget.user_id === currentUserId}
          otherManagerName={otherManager?.user.name ?? ""}
          isPending={updateRole.isPending}
          onClose={() => setDemoteTarget(null)}
          onConfirm={() =>
            updateRole.mutate(
              { userId: demoteTarget.user_id, role: "MEMBER" },
              { onSuccess: () => setDemoteTarget(null) },
            )
          }
        />
      )}
    </section>
  );
}

function PickMemberSheet({
  mode,
  candidates,
  isPending,
  onClose,
  onConfirm,
}: {
  mode: PickMode;
  candidates: MemberData[];
  isPending: boolean;
  onClose: () => void;
  onConfirm: (member: MemberData) => void;
}) {
  const t = useTranslations("pages.settings.managers");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const q = query.trim().toLowerCase();
  const visible = q
    ? candidates.filter(
        (m) =>
          m.user.name.toLowerCase().includes(q) ||
          m.user.email.toLowerCase().includes(q),
      )
    : candidates;
  const selected = candidates.find((m) => m.user_id === selectedId);
  const isHandover = mode === "handover";

  return (
    <Sheet
      onClose={onClose}
      title={isHandover ? t("handoverTitle") : t("coTitle")}
      description={isHandover ? t("handoverDesc") : t("coDesc")}
      size="sm"
      dismissible={!isPending}
    >
      {candidates.length > 5 && (
        <label className="relative mb-3 block">
          <span className="sr-only">{t("searchMembers")}</span>
          <Search
            size={16}
            aria-hidden="true"
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-foreground-muted"
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("searchMembers")}
            className="h-11 w-full rounded-lg border border-border bg-background pl-9 pr-3 text-sm text-foreground placeholder:text-foreground-muted focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </label>
      )}

      <div
        role="radiogroup"
        aria-label={t("selectPrompt")}
        className="-mx-1 max-h-72 space-y-1.5 overflow-y-auto px-1"
      >
        {visible.length === 0 ? (
          <p className="py-6 text-center text-sm text-foreground-muted">
            {t("noMatch")}
          </p>
        ) : (
          visible.map((m) => {
            const checked = m.user_id === selectedId;
            return (
              <button
                key={m.id}
                type="button"
                role="radio"
                aria-checked={checked}
                onClick={() => setSelectedId(m.user_id)}
                disabled={isPending}
                className={cn(
                  "flex w-full items-center gap-3 rounded-xl border p-2.5 text-left transition-colors",
                  checked
                    ? "border-primary bg-primary/10"
                    : "border-border hover:bg-surface-raised",
                )}
              >
                <UserAvatar
                  name={m.user.name}
                  email={m.user.email}
                  avatar={m.user.avatar}
                  className="size-9"
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-foreground">
                    {m.user.name}
                  </span>
                  <span className="block truncate text-xs text-foreground-muted">
                    {m.user.email}
                  </span>
                </span>
                <span
                  className={cn(
                    "flex size-5 shrink-0 items-center justify-center rounded-full border",
                    checked
                      ? "border-primary bg-primary text-white"
                      : "border-border-strong",
                  )}
                >
                  {checked && <Check size={12} strokeWidth={3} />}
                </span>
              </button>
            );
          })
        )}
      </div>

      {isHandover && (
        <p className="mt-4 flex gap-2 rounded-xl border border-destructive/20 bg-destructive/5 p-3 text-xs text-foreground-body">
          <AlertTriangle
            size={14}
            aria-hidden="true"
            className="mt-0.5 shrink-0 text-destructive"
          />
          {t("handoverWarning")}
        </p>
      )}

      <SheetActions>
        <button
          type="button"
          onClick={onClose}
          disabled={isPending}
          className="rounded-lg border border-border-strong px-4 py-2 text-sm font-semibold text-foreground-muted transition-colors hover:bg-surface-raised"
        >
          {t("cancel")}
        </button>
        <button
          type="button"
          onClick={() => selected && onConfirm(selected)}
          disabled={!selected || isPending}
          className={cn(
            "truncate rounded-lg px-4 py-2 text-sm font-semibold text-white transition-colors disabled:cursor-not-allowed disabled:opacity-50",
            isHandover
              ? "bg-destructive hover:bg-destructive/90"
              : "bg-primary hover:bg-primary-hover",
          )}
        >
          {isPending
            ? t("working")
            : !selected
              ? t("selectPrompt")
              : isHandover
                ? t("confirmHandover", { name: selected.user.name })
                : t("confirmCo", { name: selected.user.name })}
        </button>
      </SheetActions>
    </Sheet>
  );
}

function DemoteSheet({
  member,
  isSelf,
  otherManagerName,
  isPending,
  onClose,
  onConfirm,
}: {
  member: MemberData;
  isSelf: boolean;
  otherManagerName: string;
  isPending: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const t = useTranslations("pages.settings.managers");
  return (
    <Sheet
      onClose={onClose}
      title={
        isSelf
          ? t("stepDownTitle")
          : t("makeMemberTitle", { name: member.user.name })
      }
      size="sm"
      dismissible={!isPending}
    >
      <p className="text-sm text-foreground-muted">
        {isSelf
          ? t("stepDownDesc", { name: otherManagerName })
          : t("makeMemberDesc", { name: member.user.name })}
      </p>
      <SheetActions>
        <button
          type="button"
          onClick={onClose}
          disabled={isPending}
          className="rounded-lg border border-border-strong px-4 py-2 text-sm font-semibold text-foreground-muted transition-colors hover:bg-surface-raised"
        >
          {t("cancel")}
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={isPending}
          className="rounded-lg bg-destructive px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-destructive/90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isPending
            ? t("working")
            : isSelf
              ? t("confirmStepDown")
              : t("confirmMakeMember")}
        </button>
      </SheetActions>
    </Sheet>
  );
}
