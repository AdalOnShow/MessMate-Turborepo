"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { useGetMyMess } from "../../hooks/use-messes";
import { useGetActiveMonth } from "../../hooks/use-months";
import { useMembers } from "../../hooks/use-members";
import { useCreateDeposit } from "../../hooks/use-deposits";
import { DatePicker } from "../../components/ui/date-picker";
import { Select } from "../../components/ui/select";
import { Button } from "../../components/ui/button";
import { Loader2, Plus, WalletCards } from "lucide-react";
import {
  QueriesErrorState,
  failedQueries,
} from "../../components/feedback/QueryErrorState";

function formatMoney(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "BDT",
    maximumFractionDigits: 2,
  }).format(n);
}

export default function AddDepositPage() {
  const t = useTranslations("pages.deposits");
  const messQuery = useGetMyMess();
  const { data: myMess, isLoading: messLoading } = messQuery;
  const messId = myMess?.id;
  const isManager = myMess?.current_user_role === "MANAGER";
  const monthQuery = useGetActiveMonth(messId);
  const { data: activeMonth, isLoading: monthLoading } = monthQuery;
  const membersQuery = useMembers(messId, {
    status: "ACTIVE",
  });
  const { data: members, isLoading: membersLoading } = membersQuery;

  const create = useCreateDeposit(messId, activeMonth?.id);
  const isLoading = messLoading || monthLoading || membersLoading;

  const [memberId, setMemberId] = useState("");
  const [amount, setAmount] = useState("");
  const [depositDate, setDepositDate] = useState<Date | undefined>(new Date());
  const [error, setError] = useState("");

  const activeMembers = (members ?? []).filter((m) => !m.removed_at);
  const parsedAmount = parseFloat(amount);

  const selectedMember = activeMembers.find((m) => m.id === memberId);

  const handleSubmit = () => {
    setError("");

    if (!memberId) {
      setError(t("selectMember2"));
      return;
    }

    if (!parsedAmount || parsedAmount <= 0) {
      setError(t("amountMustGreaterThan"));
      return;
    }

    const payload = {
      member_id: memberId,
      amount: parsedAmount,
      deposit_date: depositDate
        ? new Date(
            depositDate.getTime() - depositDate.getTimezoneOffset() * 60000,
          ).toISOString()
        : new Date().toISOString(),
    };

    create.mutate(payload, {
      onSuccess: () => {
        setMemberId("");
        setAmount("");
        setDepositDate(new Date());
        setError("");
      },
    });
  };

  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="mx-auto mb-6 max-w-2xl space-y-2">
          <div className="h-3 w-20 rounded bg-surface-overlay" />
          <div className="h-7 w-56 rounded bg-surface-overlay" />
          <div className="h-4 w-72 max-w-full rounded bg-surface-overlay" />
        </div>
        <div className="mx-auto max-w-2xl overflow-hidden rounded-2xl border border-border bg-surface">
          <div className="space-y-5 p-6">
            <div className="space-y-2">
              <div className="h-3 w-16 rounded bg-surface-overlay" />
              <div className="h-10 w-full rounded-lg bg-surface-overlay" />
            </div>
            <div className="space-y-2">
              <div className="h-3 w-12 rounded bg-surface-overlay" />
              <div className="h-10 w-full rounded-lg bg-surface-overlay" />
            </div>
            <div className="space-y-2">
              <div className="h-3 w-16 rounded bg-surface-overlay" />
              <div className="h-10 w-full rounded-lg bg-surface-overlay" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  const loadQueries = [messQuery, monthQuery, membersQuery];
  if (failedQueries(...loadQueries).length > 0) {
    return (
      <div className="mx-auto max-w-2xl">
        <QueriesErrorState queries={loadQueries} resource="deposit details" />
      </div>
    );
  }

  if (!myMess) {
    return (
      <div className="flex flex-col items-center rounded-2xl border border-border bg-surface p-12 text-center">
        <WalletCards size={32} className="mb-3 text-foreground-muted" />
        <p className="text-sm text-foreground-muted">{t("needPartMessAdd")}</p>
      </div>
    );
  }

  if (!isManager) {
    return (
      <div className="flex flex-col items-center rounded-2xl border border-border bg-surface p-12 text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-raised">
          <WalletCards size={26} className="text-foreground-muted" />
        </div>
        <p className="text-sm font-semibold text-foreground">
          {t("onlyManagersCanAdd")}
        </p>
        <p className="mt-1 text-sm text-foreground-muted">
          {t("askManagerRecordDeposit")}
        </p>
      </div>
    );
  }

  if (!activeMonth) {
    return (
      <div className="flex flex-col items-center rounded-2xl border border-border bg-surface p-12 text-center">
        <WalletCards size={32} className="mb-3 text-foreground-muted" />
        <p className="text-sm text-foreground-muted">
          {t("noActiveMonthStart")}
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <p className="label-mono text-primary">{t("deposits")}</p>
        <h1 className="mt-1 heading-tight text-2xl text-foreground sm:text-3xl">
          {t("addDeposit")}
        </h1>
        <p className="mt-1 text-sm text-foreground-muted">
          {t("recordMoneyMemberDeposits")}
        </p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-surface">
        <div className="flex items-center gap-2 border-b border-border bg-surface-raised px-6 py-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-white">
            <Plus size={16} />
          </div>
          <h2 className="text-lg font-semibold text-foreground">
            {t("newDeposit")} {activeMonth.title ?? "this month"}
          </h2>
        </div>

        <div className="space-y-5 px-6 py-6">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">
              {t("member")}
            </label>
            <Select
              value={memberId}
              onValueChange={setMemberId}
              options={activeMembers.map((m) => ({
                value: m.id,
                label: m.user.name,
              }))}
              placeholder={t("selectMember")}
              className="w-full"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">
              {t("amount")}
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-foreground-muted">
                ৳
              </span>
              <input
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                onWheel={(e) => e.currentTarget.blur()}
                placeholder="0.00"
                className="w-full appearance-none rounded-lg border border-border-strong bg-surface-sunken py-2.5 pl-8 pr-3 text-sm text-foreground placeholder:text-foreground-muted focus:border-primary focus:ring-2 focus:ring-primary/15 focus:outline-none [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-inner-spin-button]:m-0"
                disabled={create.isPending}
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">
              {t("depositDate")}
            </label>
            <DatePicker
              date={depositDate}
              onSelect={setDepositDate}
              disabled={create.isPending}
            />
          </div>

          {selectedMember && parsedAmount > 0 && create.isIdle && (
            <div className="rounded-xl border border-primary/25 bg-primary/5 p-4">
              <div className="mb-2 flex items-center gap-2 text-primary">
                <WalletCards size={14} />
                <span className="text-xs font-mono font-medium uppercase tracking-[0.1em]">
                  {t("depositPreview")}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-foreground">
                  {selectedMember.user.name}
                </span>
                <span className="font-bold text-foreground">
                  {formatMoney(parsedAmount)}
                </span>
              </div>
            </div>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button
            type="button"
            onClick={handleSubmit}
            disabled={create.isPending}
            className="w-full"
          >
            {create.isPending ? (
              <>
                <Loader2 size={15} className="animate-spin" />
                {t("adding")}
              </>
            ) : (
              <>
                <Plus size={15} />
                {t("addDeposit")}
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
