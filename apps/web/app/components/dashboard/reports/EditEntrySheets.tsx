"use client";

import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { Loader2, Minus, Plus } from "lucide-react";
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
<<<<<<< HEAD
import {
  formatDateOnly,
  formatMoney,
  fromDateOnlyISO,
  toDateOnlyISO,
} from "../../../lib/format";
import { showSuccess } from "../../../store/success-dialog";
=======
import { useMembers, type MemberData } from "../../../hooks/use-members";
import { useGetMealTypes } from "../../../hooks/use-messes";
import type { MealTypeInfo } from "../../../hooks/use-messes";
import {
  useGetMealEntries,
  useUpdateMealDay,
  type MealEntryInfo,
} from "../../../hooks/use-meals";
import { fromDateOnlyISO, toDateOnlyISO } from "../../../lib/format";
import { cn } from "../../../lib/utils";
>>>>>>> origin/main

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
  const tsd = useTranslations("feedback.successDialog");
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
      {
        onSuccess: () => {
          onClose();
          showSuccess({
            title: "expenseUpdated",
            rows: [
              { label: tsd("labels.title"), value: title.trim() },
              { label: tsd("labels.amount"), value: formatMoney(parsed) },
              {
                label: tsd("labels.date"),
                value: formatDateOnly(
                  date ? toDateOnlyISO(date) : expense.expense_date,
                ),
              },
            ],
          });
        },
      },
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
              onClick={() =>
                remove.mutate(expense.id, {
                  onSuccess: () => {
                    onClose();
                    showSuccess({
                      title: "expenseDeleted",
                      rows: [
                        { label: tsd("labels.title"), value: expense.title },
                        {
                          label: tsd("labels.amount"),
                          value: formatMoney(Number(expense.amount)),
                        },
                      ],
                    });
                  },
                })
              }
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
  const tsd = useTranslations("feedback.successDialog");
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
      {
        onSuccess: () => {
          onClose();
          showSuccess({
            title: "depositUpdated",
            rows: [
              { label: tsd("labels.member"), value: deposit.member.name },
              { label: tsd("labels.amount"), value: formatMoney(parsed) },
              {
                label: tsd("labels.date"),
                value: formatDateOnly(
                  date ? toDateOnlyISO(date) : deposit.deposit_date,
                ),
              },
            ],
          });
        },
      },
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
              onClick={() =>
                remove.mutate(deposit.id, {
                  onSuccess: () => {
                    onClose();
                    showSuccess({
                      title: "depositDeleted",
                      rows: [
                        {
                          label: tsd("labels.member"),
                          value: deposit.member.name,
                        },
                        {
                          label: tsd("labels.amount"),
                          value: formatMoney(Number(deposit.amount)),
                        },
                      ],
                    });
                  },
                })
              }
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

type MealRow = Record<string, number>;

const MEAL_STEP = 0.5;

function fmtMeal(n: number) {
  return n % 1 === 0 ? String(n) : n.toFixed(1);
}

/**
 * Edit the meals of one already-saved day (managers). Only that day is
 * touched. Members who changed are sent with their whole row, because the API
 * replaces a member's `meals` for the day.
 */
export function EditMealDaySheet({
  messId,
  monthId,
  dayIso,
  onClose,
}: {
  messId: string;
  monthId: string;
  /** The day's UTC-midnight ISO date, as the meal list holds it. */
  dayIso: string;
  onClose: () => void;
}) {
  const t = useTranslations("pages.reports");
  const ymd = dayIso.slice(0, 10);
  const entriesQuery = useGetMealEntries(messId, monthId, ymd, ymd);
  const membersQuery = useMembers(messId, { status: "ACTIVE" });
  const typesQuery = useGetMealTypes(messId);
  const title = t("editMealDayTitle", {
    date: new Date(dayIso).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      weekday: "short",
      timeZone: "UTC",
    }),
  });

  const ready = entriesQuery.data && membersQuery.data && typesQuery.data;
  const failed = [entriesQuery, membersQuery, typesQuery].some(
    (q) => q.isError && !q.data,
  );

  return (
    <Sheet onClose={onClose} title={title} size="lg">
      {ready ? (
        <MealDayForm
          messId={messId}
          monthId={monthId}
          dayIso={dayIso}
          entries={entriesQuery.data!}
          members={membersQuery.data!}
          mealTypes={typesQuery.data!}
          onClose={onClose}
        />
      ) : failed ? (
        <p className="text-sm text-destructive">{t("mealsEditLoadFailed")}</p>
      ) : (
        <div className="flex justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        </div>
      )}
    </Sheet>
  );
}

function MealDayForm({
  messId,
  monthId,
  dayIso,
  entries,
  members,
  mealTypes,
  onClose,
}: {
  messId: string;
  monthId: string;
  dayIso: string;
  entries: MealEntryInfo[];
  members: MemberData[];
  mealTypes: MealTypeInfo[];
  onClose: () => void;
}) {
  const t = useTranslations("pages.reports");
  const update = useUpdateMealDay(messId, monthId);

  const saved = useMemo(() => {
    const map: Record<string, MealRow> = {};
    for (const e of entries) map[e.member_id] = e.meals;
    return map;
  }, [entries]);
  const [draft, setDraft] = useState<Record<string, MealRow>>({});

  // Active types, plus any type that still holds meals on this day.
  const types = mealTypes.filter(
    (mt) =>
      mt.is_active || Object.values(saved).some((row) => (row[mt.id] ?? 0) > 0),
  );

  const valueOf = (memberId: string, typeId: string) =>
    draft[memberId]?.[typeId] ?? saved[memberId]?.[typeId] ?? 0;

  const step = (memberId: string, typeId: string, delta: number) =>
    setDraft((prev) => {
      const row = prev[memberId] ?? { ...saved[memberId] };
      const next = Math.max(0, Math.min(10, (row[typeId] ?? 0) + delta));
      return { ...prev, [memberId]: { ...row, [typeId]: next } };
    });

  // Only members whose row really differs from what is saved.
  const changed = Object.entries(draft).filter(([memberId, row]) =>
    types.some((mt) => (row[mt.id] ?? 0) !== (saved[memberId]?.[mt.id] ?? 0)),
  );

  const save = () => {
    if (changed.length === 0) return;
    update.mutate(
      {
        entries: changed.map(([memberId, row]) => ({
          memberId,
          date: dayIso,
          meals: row,
        })),
      },
      { onSuccess: onClose },
    );
  };

  const stepBtn =
    "flex size-8 shrink-0 items-center justify-center rounded-lg border border-border-strong text-foreground transition-colors hover:bg-surface-raised active:scale-95 disabled:opacity-30";
  // Name column, then one stepper column per meal type.
  const gridCols = {
    gridTemplateColumns: `minmax(5.5rem, 1fr) repeat(${types.length}, auto)`,
  };

  return (
    <>
      <p className="mb-3 text-sm text-foreground-muted">
        {t("mealDayEditHint")}
      </p>
      {types.length === 0 ? (
        <p className="text-sm text-foreground-muted">{t("noMealTypes")}</p>
      ) : (
        // One scroll area (the sheet's); this only scrolls sideways when a
        // mess has many meal types on a narrow phone.
        <div className="-mx-1 overflow-x-auto px-1">
          <div className="min-w-max rounded-xl border border-border">
            <div
              style={gridCols}
              className="grid items-center gap-x-3 rounded-t-xl border-b border-border bg-surface-raised px-3 py-2"
            >
              <span className="text-xs font-medium text-foreground-muted">
                {t("member")}
              </span>
              {types.map((mt) => (
                <span
                  key={mt.id}
                  className="w-[5.75rem] truncate text-center text-xs font-medium text-foreground-muted"
                >
                  {mt.name}
                </span>
              ))}
            </div>
            <ul className="divide-y divide-border">
              {members.map((m) => {
                const isChanged = changed.some(([id]) => id === m.id);
                return (
                  <li
                    key={m.id}
                    style={gridCols}
                    className={cn(
                      "grid items-center gap-x-3 px-3 py-2",
                      isChanged && "bg-primary/5",
                    )}
                  >
                    <span className="min-w-0 truncate text-sm font-medium text-foreground">
                      {m.user.name}
                    </span>
                    {types.map((mt) => {
                      const v = valueOf(m.id, mt.id);
                      return (
                        <div
                          key={mt.id}
                          className="flex w-[5.75rem] items-center justify-between"
                        >
                          <button
                            type="button"
                            className={stepBtn}
                            disabled={update.isPending || v <= 0}
                            aria-label={`− ${mt.name}, ${m.user.name}`}
                            onClick={() => step(m.id, mt.id, -MEAL_STEP)}
                          >
                            <Minus size={14} />
                          </button>
                          <span className="text-center text-sm font-semibold tabular-nums text-foreground">
                            {fmtMeal(v)}
                          </span>
                          <button
                            type="button"
                            className={stepBtn}
                            disabled={update.isPending || v >= 10}
                            aria-label={`+ ${mt.name}, ${m.user.name}`}
                            onClick={() => step(m.id, mt.id, MEAL_STEP)}
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                      );
                    })}
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      )}
      <SheetActions>
        <button
          type="button"
          className={secondaryBtn}
          disabled={update.isPending}
          onClick={onClose}
        >
          {t("cancel")}
        </button>
        <button
          type="button"
          className={primaryBtn}
          disabled={update.isPending || changed.length === 0}
          onClick={save}
        >
          {update.isPending ? t("saving") : t("save")}
        </button>
      </SheetActions>
    </>
  );
}
