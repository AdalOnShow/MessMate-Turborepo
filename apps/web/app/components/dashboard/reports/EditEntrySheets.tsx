"use client";

import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { Loader2, Minus, Pencil, Plus, Trash2 } from "lucide-react";
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
import { useMembers, type MemberData } from "../../../hooks/use-members";
import { useGetMealTypes } from "../../../hooks/use-messes";
import type { MealTypeInfo } from "../../../hooks/use-messes";
import {
  useDeleteMealEntry,
  useGetMealEntries,
  useUpdateMealDay,
  type MealEntryInfo,
} from "../../../hooks/use-meals";
import {
  formatDateOnly,
  formatMoney,
  fromDateOnlyISO,
  toDateOnlyISO,
} from "../../../lib/format";
import { cn } from "../../../lib/utils";
import { showSuccess } from "../../../store/success-dialog";

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
 * The meals of one already-saved day (managers), one row per member. Each
 * member is edited or deleted on their own from a small sheet, so a save only
 * ever touches that member's row for that day.
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
  const [editing, setEditing] = useState<MealDayMember | null>(null);
  const [deleting, setDeleting] = useState<MealDayMember | null>(null);
  const dateLabel = new Date(dayIso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    weekday: "short",
    timeZone: "UTC",
  });

  const ready = entriesQuery.data && membersQuery.data && typesQuery.data;
  const failed = [entriesQuery, membersQuery, typesQuery].some(
    (q) => q.isError && !q.data,
  );

  return (
    <>
      <Sheet
        onClose={onClose}
        title={t("editMealDayTitle", { date: dateLabel })}
        size="md"
        // While a member's sheet is open on top, Escape and taps belong to it.
        dismissible={!editing && !deleting}
      >
        {ready ? (
          <MealDayList
            entries={entriesQuery.data!}
            members={membersQuery.data!}
            mealTypes={typesQuery.data!}
            onEdit={setEditing}
            onDelete={setDeleting}
          />
        ) : failed ? (
          <p className="text-sm text-destructive">{t("mealsEditLoadFailed")}</p>
        ) : (
          <div className="flex justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          </div>
        )}
      </Sheet>
      {editing && typesQuery.data && (
        <EditMemberMealsSheet
          messId={messId}
          monthId={monthId}
          dayIso={dayIso}
          dateLabel={dateLabel}
          member={editing}
          mealTypes={typesQuery.data}
          onClose={() => setEditing(null)}
        />
      )}
      {deleting?.entry && (
        <DeleteMemberMealsSheet
          messId={messId}
          dateLabel={dateLabel}
          member={deleting}
          entry={deleting.entry}
          onClose={() => setDeleting(null)}
        />
      )}
    </>
  );
}

interface MealDayMember {
  memberId: string;
  name: string;
  /** The member's saved row for the day, if there is one. */
  entry?: MealEntryInfo;
}

const iconBtn =
  "flex size-8 shrink-0 items-center justify-center rounded-lg border transition-colors active:scale-95 disabled:pointer-events-none disabled:opacity-30";

function MealDayList({
  entries,
  members,
  mealTypes,
  onEdit,
  onDelete,
}: {
  entries: MealEntryInfo[];
  members: MemberData[];
  mealTypes: MealTypeInfo[];
  onEdit: (m: MealDayMember) => void;
  onDelete: (m: MealDayMember) => void;
}) {
  const t = useTranslations("pages.reports");

  // Active members, plus anyone who has meals that day but has since left.
  const rows = useMemo<MealDayMember[]>(() => {
    const byMember = new Map(entries.map((e) => [e.member_id, e]));
    const list: MealDayMember[] = members.map((m) => ({
      memberId: m.id,
      name: m.user.name,
      entry: byMember.get(m.id),
    }));
    const listed = new Set(members.map((m) => m.id));
    for (const e of entries) {
      if (!listed.has(e.member_id)) {
        list.push({
          memberId: e.member_id,
          name: e.member.user.name,
          entry: e,
        });
      }
    }
    return list;
  }, [entries, members]);

  const typeName = useMemo(
    () => new Map(mealTypes.map((mt) => [mt.id, mt.name])),
    [mealTypes],
  );

  const breakdown = (meals: MealRow | undefined) =>
    Object.entries(meals ?? {})
      .filter(([id, n]) => n > 0 && typeName.has(id))
      .map(([id, n]) => `${typeName.get(id)} ${fmtMeal(n)}`)
      .join(" · ");

  return (
    <>
      <p className="mb-3 text-sm text-foreground-muted">
        {t("mealDayEditHint")}
      </p>
      <ul className="divide-y divide-border rounded-xl border border-border">
        {rows.map((row) => {
          const total = row.entry?.total_meal ?? 0;
          const detail = breakdown(row.entry?.meals);
          return (
            <li
              key={row.memberId}
              className="flex items-center gap-3 px-3 py-2.5"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">
                  {row.name}
                </p>
                <p className="truncate text-xs text-foreground-muted">
                  {detail || t("noMealsThisDay")}
                </p>
              </div>
              <span
                className={cn(
                  "min-w-8 text-right text-base font-semibold tabular-nums",
                  total > 0 ? "text-foreground" : "text-foreground-muted",
                )}
              >
                {fmtMeal(total)}
              </span>
              <div className="flex flex-col gap-1.5">
                <button
                  type="button"
                  className={cn(
                    iconBtn,
                    "border-border-strong text-foreground-muted hover:bg-surface-raised hover:text-foreground",
                  )}
                  aria-label={t("editMemberMealsAria", { name: row.name })}
                  title={t("editMemberMealsAria", { name: row.name })}
                  onClick={() => onEdit(row)}
                >
                  <Pencil size={14} />
                </button>
                <button
                  type="button"
                  className={cn(
                    iconBtn,
                    "border-destructive/30 text-destructive hover:bg-destructive/10",
                  )}
                  aria-label={t("deleteMemberMealsAria", { name: row.name })}
                  title={t("deleteMemberMealsAria", { name: row.name })}
                  disabled={!row.entry}
                  onClick={() => onDelete(row)}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </>
  );
}

/** Small sheet to change one member's meals for one day. */
function EditMemberMealsSheet({
  messId,
  monthId,
  dayIso,
  dateLabel,
  member,
  mealTypes,
  onClose,
}: {
  messId: string;
  monthId: string;
  dayIso: string;
  dateLabel: string;
  member: MealDayMember;
  mealTypes: MealTypeInfo[];
  onClose: () => void;
}) {
  const t = useTranslations("pages.reports");
  const update = useUpdateMealDay(messId, monthId);
  const saved = useMemo<MealRow>(
    () => member.entry?.meals ?? {},
    [member.entry],
  );
  // Starts from the whole saved row, so counts of deleted meal types are sent
  // back unchanged (the API only accepts them as they were).
  const [draft, setDraft] = useState<MealRow>(() => ({ ...saved }));

  // Active types, plus any type that still holds meals for this member.
  const types = mealTypes.filter(
    (mt) => mt.is_active || (saved[mt.id] ?? 0) > 0,
  );

  const step = (typeId: string, delta: number) =>
    setDraft((prev) => ({
      ...prev,
      [typeId]: Math.max(0, Math.min(10, (prev[typeId] ?? 0) + delta)),
    }));

  const changed = types.some(
    (mt) => (draft[mt.id] ?? 0) !== (saved[mt.id] ?? 0),
  );
  const total = Object.values(draft).reduce((sum, n) => sum + n, 0);
  const busy = update.isPending;

  const save = () => {
    if (!changed) return;
    update.mutate(
      { entries: [{ memberId: member.memberId, date: dayIso, meals: draft }] },
      { onSuccess: onClose },
    );
  };

  const stepBtn =
    "flex size-9 shrink-0 items-center justify-center rounded-lg border border-border-strong text-foreground transition-colors hover:bg-surface-raised active:scale-95 disabled:opacity-30";

  return (
    <Sheet
      onClose={onClose}
      title={t("editMemberMealsTitle")}
      description={`${member.name} · ${dateLabel}`}
      size="sm"
      dismissible={!busy}
    >
      {types.length === 0 ? (
        <p className="text-sm text-foreground-muted">{t("noMealTypes")}</p>
      ) : (
        <ul className="divide-y divide-border rounded-xl border border-border">
          {types.map((mt) => {
            const v = draft[mt.id] ?? 0;
            return (
              <li
                key={mt.id}
                className={cn(
                  "flex items-center justify-between gap-3 px-3 py-2",
                  v !== (saved[mt.id] ?? 0) && "bg-primary/5",
                )}
              >
                <span className="min-w-0 truncate text-sm font-medium text-foreground">
                  {mt.name}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className={stepBtn}
                    disabled={busy || v <= 0}
                    aria-label={`− ${mt.name}`}
                    onClick={() => step(mt.id, -MEAL_STEP)}
                  >
                    <Minus size={14} />
                  </button>
                  <span className="w-8 text-center text-sm font-semibold tabular-nums text-foreground">
                    {fmtMeal(v)}
                  </span>
                  <button
                    type="button"
                    className={stepBtn}
                    disabled={busy || v >= 10}
                    aria-label={`+ ${mt.name}`}
                    onClick={() => step(mt.id, MEAL_STEP)}
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </li>
            );
          })}
          <li className="flex items-center justify-between gap-3 rounded-b-xl bg-surface-raised px-3 py-2">
            <span className="text-sm font-medium text-foreground-muted">
              {t("total")}
            </span>
            <span className="w-8 text-center text-sm font-bold tabular-nums text-foreground mr-11">
              {fmtMeal(total)}
            </span>
          </li>
        </ul>
      )}
      <SheetActions>
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
          disabled={busy || !changed}
          onClick={save}
        >
          {busy ? t("saving") : t("save")}
        </button>
      </SheetActions>
    </Sheet>
  );
}

/** Confirms, then soft-deletes one member's meal row for one day. */
function DeleteMemberMealsSheet({
  messId,
  dateLabel,
  member,
  entry,
  onClose,
}: {
  messId: string;
  dateLabel: string;
  member: MealDayMember;
  entry: MealEntryInfo;
  onClose: () => void;
}) {
  const t = useTranslations("pages.reports");
  const remove = useDeleteMealEntry(messId);
  const busy = remove.isPending;

  return (
    <Sheet
      onClose={onClose}
      title={t("deleteMealTitle")}
      size="sm"
      dismissible={!busy}
    >
      <p className="text-sm text-foreground-muted">
        {t("deleteMealConfirm", { name: member.name, date: dateLabel })}
      </p>
      <SheetActions>
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
          className={`${dangerBtn} bg-destructive/5`}
          disabled={busy}
          onClick={() => remove.mutate(entry.id, { onSuccess: onClose })}
        >
          {busy ? t("deleting") : t("delete")}
        </button>
      </SheetActions>
    </Sheet>
  );
}
