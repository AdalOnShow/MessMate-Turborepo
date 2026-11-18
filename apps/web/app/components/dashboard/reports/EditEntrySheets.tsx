"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import type { DepositWithRelations, ExpenseWithRelations } from "@repo/shared";
import { Sheet, SheetActions } from "../../ui/sheet";
import { DatePicker } from "../../ui/date-picker";
import {
  useDeleteExpense,
  useUpdateExpense,
} from "../../../hooks/use-expenses";
import {
  useDeleteDeposit,
  useUpdateDeposit,
} from "../../../hooks/use-deposits";
import { fromDateOnlyISO, toDateOnlyISO } from "../../../lib/format";

const inputClass =
  "w-full rounded-lg border border-border-strong bg-surface px-4 py-2.5 text-base text-foreground placeholder:text-foreground-muted focus:border-primary focus:ring-2 focus:ring-primary/15 focus:outline-none sm:text-sm";
const labelClass = "mb-1.5 block text-sm font-medium text-foreground";
const errorClass = "mt-1 text-xs text-destructive";
const primaryBtn =
  "rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover disabled:opacity-60";
const secondaryBtn =
  "rounded-lg border border-border-strong px-4 py-2.5 text-sm font-semibold text-foreground-muted transition-colors hover:bg-surface-raised disabled:opacity-60";
const dangerBtn =
  "rounded-lg border border-destructive/30 px-4 py-2.5 text-sm font-semibold text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-60";

function parseAmount(raw: string): number | null {
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : null;
}

/**
 * Edit or delete a shared/individual expense of the active month (managers).
 * Type and the members it is split between stay as they are; a new amount is
 * re-split between the same members by the API.
 */
export function EditExpenseSheet({
  messId,
  monthId,
  expense,
  onClose,
}: {
  messId: string;
  monthId: string;
  expense: ExpenseWithRelations;
  onClose: () => void;
}) {
  const t = useTranslations("pages.reports");
  const update = useUpdateExpense(messId, monthId);
  const remove = useDeleteExpense(messId, monthId);
  const [title, setTitle] = useState(expense.title);
  const [amount, setAmount] = useState(String(expense.amount));
  const [date, setDate] = useState<Date | undefined>(
    fromDateOnlyISO(expense.expense_date),
  );
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [errors, setErrors] = useState<{ title?: string; amount?: string }>({});
  const busy = update.isPending || remove.isPending;

  const save = () => {
    const parsed = parseAmount(amount);
    const next: typeof errors = {};
    if (!title.trim()) next.title = t("titleRequired");
    if (parsed === null) next.amount = t("amountPositive");
    setErrors(next);
    if (Object.keys(next).length > 0 || parsed === null) return;

    update.mutate(
      {
        expenseId: expense.id,
        data: {
          title: title.trim(),
          amount: parsed,
          ...(date ? { expense_date: toDateOnlyISO(date) } : {}),
        },
      },
      { onSuccess: onClose },
    );
  };

  return (
    <Sheet onClose={onClose} title={t("editExpense")} dismissible={!busy}>
      {confirmDelete ? (
        <>
          <p className="text-sm text-foreground-muted">
            {t("deleteExpenseConfirm")}
          </p>
          <SheetActions>
            <button
              type="button"
              className={secondaryBtn}
              disabled={busy}
              onClick={() => setConfirmDelete(false)}
            >
              {t("cancel")}
            </button>
            <button
              type="button"
              className={`${dangerBtn} bg-destructive/5`}
              disabled={busy}
              onClick={() => remove.mutate(expense.id, { onSuccess: onClose })}
            >
              {remove.isPending ? t("deleting") : t("delete")}
            </button>
          </SheetActions>
        </>
      ) : (
        <>
          <div className="space-y-4">
            <div>
              <label className={labelClass} htmlFor="edit-expense-title">
                {t("title")}
              </label>
              <input
                id="edit-expense-title"
                className={inputClass}
                value={title}
                maxLength={120}
                onChange={(e) => setTitle(e.target.value)}
                disabled={busy}
              />
              {errors.title && <p className={errorClass}>{errors.title}</p>}
            </div>
            <div>
              <label className={labelClass} htmlFor="edit-expense-amount">
                {t("amount")}
              </label>
              <input
                id="edit-expense-amount"
                className={inputClass}
                type="number"
                inputMode="decimal"
                min="0"
                step="any"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                disabled={busy}
              />
              {errors.amount && <p className={errorClass}>{errors.amount}</p>}
            </div>
            <div>
              <span className={labelClass}>{t("date")}</span>
              <DatePicker
                date={date}
                onSelect={setDate}
                disabled={busy}
                maxDate={new Date()}
              />
            </div>
          </div>
          <SheetActions className="sm:justify-between">
            <button
              type="button"
              className={dangerBtn}
              disabled={busy}
              onClick={() => setConfirmDelete(true)}
            >
              {t("delete")}
            </button>
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:gap-3 [&>*]:h-11 sm:[&>*]:h-auto">
              <button
                type="button"
                className={secondaryBtn}
                disabled={busy}
                onClick={onClose}
              >
                {t("cancel")}
              </button>
              <button
                type="button"
                className={primaryBtn}
                disabled={busy}
                onClick={save}
              >
                {update.isPending ? t("saving") : t("save")}
              </button>
            </div>
          </SheetActions>
        </>
      )}
    </Sheet>
  );
}

/** Edit the amount/date of a deposit of the active month, or delete it (managers). */
export function EditDepositSheet({
  messId,
  monthId,
  deposit,
  onClose,
}: {
  messId: string;
  monthId: string;
  deposit: DepositWithRelations;
  onClose: () => void;
}) {
  const t = useTranslations("pages.reports");
  const update = useUpdateDeposit(messId, monthId);
  const remove = useDeleteDeposit(messId, monthId);
  const [amount, setAmount] = useState(String(deposit.amount));
  const [date, setDate] = useState<Date | undefined>(
    fromDateOnlyISO(deposit.deposit_date),
  );
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [amountError, setAmountError] = useState("");
  const busy = update.isPending || remove.isPending;

  const save = () => {
    const parsed = parseAmount(amount);
    if (parsed === null) {
      setAmountError(t("amountPositive"));
      return;
    }
    setAmountError("");
    update.mutate(
      {
        depositId: deposit.id,
        data: {
          amount: parsed,
          ...(date ? { deposit_date: toDateOnlyISO(date) } : {}),
        },
      },
      { onSuccess: onClose },
    );
  };

  return (
    <Sheet
      onClose={onClose}
      title={t("editDeposit")}
      description={deposit.member.name}
      dismissible={!busy}
    >
      {confirmDelete ? (
        <>
          <p className="text-sm text-foreground-muted">
            {t("deleteDepositConfirm")}
          </p>
          <SheetActions>
            <button
              type="button"
              className={secondaryBtn}
              disabled={busy}
              onClick={() => setConfirmDelete(false)}
            >
              {t("cancel")}
            </button>
            <button
              type="button"
              className={`${dangerBtn} bg-destructive/5`}
              disabled={busy}
              onClick={() => remove.mutate(deposit.id, { onSuccess: onClose })}
            >
              {remove.isPending ? t("deleting") : t("delete")}
            </button>
          </SheetActions>
        </>
      ) : (
        <>
          <div className="space-y-4">
            <div>
              <label className={labelClass} htmlFor="edit-deposit-amount">
                {t("amount")}
              </label>
              <input
                id="edit-deposit-amount"
                className={inputClass}
                type="number"
                inputMode="decimal"
                min="0"
                step="any"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                disabled={busy}
              />
              {amountError && <p className={errorClass}>{amountError}</p>}
            </div>
            <div>
              <span className={labelClass}>{t("date")}</span>
              <DatePicker
                date={date}
                onSelect={setDate}
                disabled={busy}
                maxDate={new Date()}
              />
            </div>
          </div>
          <SheetActions className="sm:justify-between">
            <button
              type="button"
              className={dangerBtn}
              disabled={busy}
              onClick={() => setConfirmDelete(true)}
            >
              {t("delete")}
            </button>
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:gap-3 [&>*]:h-11 sm:[&>*]:h-auto">
              <button
                type="button"
                className={secondaryBtn}
                disabled={busy}
                onClick={onClose}
              >
                {t("cancel")}
              </button>
              <button
                type="button"
                className={primaryBtn}
                disabled={busy}
                onClick={save}
              >
                {update.isPending ? t("saving") : t("save")}
              </button>
            </div>
          </SheetActions>
        </>
      )}
    </Sheet>
  );
}
