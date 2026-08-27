"use client";

import { useMemo, useState } from "react";
import { useGetMyMess } from "../../hooks/use-messes";
import { useGetActiveMonth } from "../../hooks/use-months";
import { useMembers } from "../../hooks/use-members";
import {
  useGetExpenses,
  useCreateExpense,
  useUpdateExpense,
  useDeleteExpense,
  type ExpenseInfo,
} from "../../hooks/use-expenses";
import { DatePicker } from "../../components/ui/date-picker";
import {
  Check,
  CheckCircle2,
  Loader2,
  Pencil,
  Plus,
  Receipt,
  Trash2,
  Users,
  User,
} from "lucide-react";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatMoney(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "BDT",
    maximumFractionDigits: 2,
  }).format(n);
}

type ExpenseFormType = "SHARED" | "INDIVIDUAL";

function ExpenseForm({
  messId,
  monthId,
  members,
  editing,
  onDone,
}: {
  messId: string;
  monthId: string;
  members: { id: string; user: { name: string } }[];
  editing?: ExpenseInfo | null;
  onDone?: () => void;
}) {
  const create = useCreateExpense(messId, monthId);
  const update = useUpdateExpense(messId, monthId);

  const [type, setType] = useState<ExpenseFormType>(
    editing && editing.type !== "BAZAAR" ? editing.type : "SHARED",
  );
  const [title, setTitle] = useState(editing?.title || "");
  const [amount, setAmount] = useState(
    editing ? String(editing.amount) : "",
  );
  const [expenseDate, setExpenseDate] = useState<Date | undefined>(
    editing?.expense_date ? new Date(editing.expense_date) : new Date(),
  );
  const [selected, setSelected] = useState<string[]>(
    editing?.members?.length ? editing.members.map((m) => m.member_id) : [],
  );
  const [note, setNote] = useState(editing?.note || "");
  const [error, setError] = useState("");

  const isPending = create.isPending || update.isPending;

  const toggleMember = (id: string) => {
    setSelected((prev) => {
      if (type === "INDIVIDUAL") {
        return prev.includes(id) ? [] : [id];
      }
      return prev.includes(id)
        ? prev.filter((m) => m !== id)
        : [...prev, id];
    });
  };

  const handleSubmit = () => {
    setError("");

    if (!title.trim()) {
      setError("Title is required.");
      return;
    }

    const parsedAmount = parseFloat(amount);
    if (!parsedAmount || parsedAmount <= 0) {
      setError("Amount must be greater than zero.");
      return;
    }

    if (type === "INDIVIDUAL" && selected.length !== 1) {
      setError("Select exactly one member for an individual expense.");
      return;
    }

    if (selected.length === 0) {
      setError("Select at least one member.");
      return;
    }

    const payload = {
      type,
      title: title.trim(),
      amount: parsedAmount,
      expense_date: expenseDate
        ? new Date(
            expenseDate.getTime() - expenseDate.getTimezoneOffset() * 60000,
          ).toISOString()
        : new Date().toISOString(),
      member_ids: selected,
      note: note.trim() || undefined,
    };

    const onSuccess = () => {
      setTitle("");
      setAmount("");
      setNote("");
      setSelected([]);
      setExpenseDate(new Date());
      onDone?.();
    };

    if (editing) {
      update.mutate({ expenseId: editing.id, data: payload }, { onSuccess });
    } else {
      create.mutate(payload, { onSuccess });
    }
  };

  return (
    <div className="rounded-xl border border-foreground-muted/15 bg-surface p-6">
      <div className="mb-5 flex items-center gap-2">
        <Receipt size={18} className="text-primary" />
        <h2 className="text-lg font-semibold text-foreground">
          {editing ? "Edit Expense" : "Add Expense"}
        </h2>
      </div>

      <div className="space-y-4">
        <div className="flex gap-2">
          {(["SHARED", "INDIVIDUAL"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => {
                setType(t);
                if (t === "INDIVIDUAL" && selected.length > 1) {
                  setSelected([selected[0]!]);
                } else if (t === "INDIVIDUAL") {
                  setSelected([]);
                }
              }}
              disabled={isPending}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg border px-4 py-2 text-sm font-semibold transition-colors disabled:opacity-50 ${
                type === t
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-foreground-muted/20 text-foreground-muted hover:bg-surface-raised"
              }`}
            >
              {t === "SHARED" ? <Users size={14} /> : <User size={14} />}
              {t === "SHARED" ? "Shared" : "Individual"}
            </button>
          ))}
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">
            Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={type === "SHARED" ? "e.g. Gas Bill" : "e.g. Shampoo"}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-foreground-muted focus:outline-none focus:ring-2 focus:ring-primary/40"
            disabled={isPending}
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">
            Amount
          </label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-foreground-muted focus:outline-none focus:ring-2 focus:ring-primary/40"
            disabled={isPending}
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">
            Expense Date
          </label>
          <DatePicker
            date={expenseDate}
            onSelect={setExpenseDate}
            disabled={isPending}
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">
            {type === "INDIVIDUAL"
              ? "Member"
              : `Members (${selected.length} selected)`}
          </label>
          <div className="max-h-48 space-y-1.5 overflow-y-auto rounded-lg border border-border bg-background p-2">
            {members.length === 0 ? (
              <p className="px-2 py-3 text-center text-sm text-foreground-muted">
                No active members found.
              </p>
            ) : (
              members.map((member) => {
                const isChecked = selected.includes(member.id);
                return (
                  <label
                    key={member.id}
                    className={`flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
                      isChecked
                        ? "bg-primary/10 text-primary"
                        : "text-foreground hover:bg-surface-raised"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleMember(member.id)}
                      disabled={isPending}
                      className="h-4 w-4 accent-primary"
                    />
                    {member.user.name}
                  </label>
                );
              })
            )}
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">
            Note (optional)
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Short note about this expense"
            rows={2}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-foreground-muted focus:outline-none focus:ring-2 focus:ring-primary/40"
            disabled={isPending}
          />
        </div>

        {editing && type === "SHARED" && (
          <p className="text-xs text-foreground-muted">
            Changing the amount recomputes the split evenly across the selected
            members.
          </p>
        )}

        {error && <p className="text-sm text-destructive">{error}</p>}

        {(create.isError || update.isError) && (
          <p className="text-sm text-destructive">
            {(create.error || update.error)?.message || "Failed to save expense."}
          </p>
        )}

        <div className="flex gap-3">
          {editing && (
            <button
              type="button"
              onClick={onDone}
              disabled={isPending}
              className="rounded-lg border border-foreground-muted/20 px-4 py-2 text-sm font-semibold text-foreground-muted transition-colors hover:bg-surface-raised disabled:opacity-60"
            >
              Cancel
            </button>
          )}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isPending}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-hover disabled:opacity-60"
          >
            {isPending ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Saving...
              </>
            ) : (
              <>
                {editing ? <Check size={14} /> : <Plus size={14} />}
                {editing ? "Save Changes" : "Add Expense"}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function ExpenseCard({
  expense,
  messId,
  monthId,
  isManager,
}: {
  expense: ExpenseInfo;
  messId: string;
  monthId: string;
  isManager: boolean;
}) {
  const remove = useDeleteExpense(messId, monthId);
  const [showEdit, setShowEdit] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const isLocked = expense.type === "BAZAAR";
  const canModify = isManager && !isLocked;

  const typeStyles = {
    SHARED: "bg-primary/15 text-primary",
    INDIVIDUAL: "bg-amber-500/15 text-amber-500",
    BAZAAR: "bg-green-500/15 text-green-500",
  }[expense.type];

  return (
    <div className="rounded-xl border border-foreground-muted/15 bg-surface p-4">
      {showEdit ? (
        <ExpenseForm
          messId={messId}
          monthId={monthId}
          editing={expense}
          members={expense.members.map((m) => ({
            id: m.member_id,
            user: { name: m.member.name },
          }))}
          onDone={() => setShowEdit(false)}
        />
      ) : (
        <>
          <div className="mb-3 flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center rounded-lg bg-background p-2">
                {expense.type === "INDIVIDUAL" ? (
                  <User size={16} className="text-amber-500" />
                ) : (
                  <Receipt size={16} className="text-primary" />
                )}
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">
                  {expense.title}
                </p>
                <p className="text-xs text-foreground-muted">
                  {formatDate(expense.expense_date)} · {expense.creator.name}
                </p>
              </div>
            </div>

            <div className="flex flex-col items-end gap-1">
              <span className="text-base font-bold text-foreground">
                {formatMoney(expense.amount)}
              </span>
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${typeStyles}`}
              >
                {expense.type === "SHARED"
                  ? "Shared"
                  : expense.type === "INDIVIDUAL"
                    ? "Individual"
                    : "Bazaar"}
              </span>
            </div>
          </div>

          {expense.note && (
            <p className="mb-2 text-sm text-foreground-muted">{expense.note}</p>
          )}

          <div className="mb-3 overflow-hidden rounded-lg border border-foreground-muted/10">
            <table className="w-full text-sm">
              <tbody>
                {expense.members.map((alloc) => (
                  <tr
                    key={alloc.member_id}
                    className="border-b border-foreground-muted/10 last:border-0"
                  >
                    <td className="px-3 py-1.5 text-foreground">
                      {alloc.member.name}
                    </td>
                    <td className="px-3 py-1.5 text-right font-medium text-foreground">
                      {formatMoney(alloc.allocated_amount)}
                    </td>
                  </tr>
                ))}
                <tr className="bg-background">
                  <td className="px-3 py-2 font-semibold text-foreground">
                    Total
                  </td>
                  <td className="px-3 py-2 text-right font-bold text-foreground">
                    {formatMoney(expense.amount)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {canModify && (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowEdit(true)}
                className="flex items-center gap-1.5 rounded-lg border border-foreground-muted/20 px-3 py-1.5 text-xs font-semibold text-foreground-muted transition-colors hover:bg-surface-raised"
              >
                <Pencil size={12} />
                Edit
              </button>

              {confirmDelete ? (
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-foreground-muted">Delete?</span>
                  <button
                    type="button"
                    onClick={() => remove.mutate(expense.id)}
                    disabled={remove.isPending}
                    className="rounded bg-destructive/10 px-2 py-1 text-xs font-semibold text-destructive transition-colors hover:bg-destructive/20 disabled:opacity-60"
                  >
                    {remove.isPending ? "Deleting..." : "Yes"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(false)}
                    className="rounded bg-foreground-muted/10 px-2 py-1 text-xs font-semibold text-foreground-muted transition-colors hover:bg-foreground-muted/20"
                  >
                    No
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmDelete(true)}
                  className="flex items-center gap-1.5 rounded-lg border border-foreground-muted/20 px-3 py-1.5 text-xs font-semibold text-foreground-muted transition-colors hover:border-destructive/40 hover:bg-destructive/10 hover:text-destructive"
                >
                  <Trash2 size={12} />
                  Delete
                </button>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function ExpensesPage() {
  const { data: myMess, isLoading: messLoading } = useGetMyMess();
  const messId = myMess?.id;
  const isManager = myMess?.current_user_role === "MANAGER";
  const { data: activeMonth, isLoading: monthLoading } =
    useGetActiveMonth(messId);
  const { data: expenseList, isLoading: expenseLoading } = useGetExpenses(
    messId,
    activeMonth?.id,
  );
  const { data: members, isLoading: membersLoading } = useMembers(messId, {
    status: "ACTIVE",
  });
  const [showAdd, setShowAdd] = useState(false);
  const [tab, setTab] = useState<"all" | "SHARED" | "INDIVIDUAL" | "BAZAAR">(
    "all",
  );

  const isLoading =
    messLoading || monthLoading || expenseLoading || membersLoading;

  const items = expenseList?.items ?? [];
  const summary = expenseList?.summary;

  const tabs = useMemo(
    () => [
      { key: "all" as const, label: "All" },
      { key: "SHARED" as const, label: "Shared" },
      { key: "INDIVIDUAL" as const, label: "Individual" },
      { key: "BAZAAR" as const, label: "Bazaar" },
    ],
    [],
  );

  const filtered = tab === "all" ? items : items.filter((e) => e.type === tab);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!myMess) {
    return (
      <div className="rounded-xl border border-foreground-muted/15 bg-surface p-8 text-center">
        <p className="text-sm text-foreground-muted">
          You need to be part of a mess to view expenses.
        </p>
      </div>
    );
  }

  if (!activeMonth) {
    return (
      <div className="rounded-xl border border-foreground-muted/15 bg-surface p-8 text-center">
        <p className="text-sm text-foreground-muted">
          No active month. Start a month before managing expenses.
        </p>
      </div>
    );
  }

  const summaryCards = [
    { label: "Total", value: summary?.total ?? 0, icon: <Receipt size={16} /> },
    {
      label: "Shared",
      value: summary?.shared_total ?? 0,
      icon: <Users size={16} />,
    },
    {
      label: "Individual",
      value: summary?.individual_total ?? 0,
      icon: <User size={16} />,
    },
    {
      label: "Bazaar",
      value: summary?.bazaar_total ?? 0,
      icon: <CheckCircle2 size={16} />,
    },
  ];

  const activeMembers = (members ?? []).filter((m) => !m.removed_at);

  return (
    <>
      <div className="mb-4">
        <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-primary">
              Expenses
            </p>
            <h1 className="mt-2 text-3xl font-bold text-foreground">
              Expense Management
            </h1>
            <p className="mt-1 text-sm text-foreground-muted">
              Track shared, individual, and bazaar expenses for the current
              month.
            </p>
          </div>
          {isManager && !showAdd && (
            <button
              type="button"
              onClick={() => setShowAdd(true)}
              className="flex items-center justify-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
            >
              <Plus size={16} />
              Add Expense
            </button>
          )}
        </div>
      </div>

      {isManager && showAdd && (
        <div className="mb-6">
          <ExpenseForm
            messId={messId!}
            monthId={activeMonth.id}
            members={activeMembers}
            onDone={() => setShowAdd(false)}
          />
        </div>
      )}

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {summaryCards.map((card) => (
          <div
            key={card.label}
            className="rounded-xl border border-foreground-muted/15 bg-surface p-4"
          >
            <div className="mb-2 flex items-center gap-1.5 text-foreground-muted">
              {card.icon}
              <span className="text-xs font-medium uppercase tracking-wide">
                {card.label}
              </span>
            </div>
            <p className="text-lg font-bold text-foreground">
              {formatMoney(card.value)}
            </p>
          </div>
        ))}
      </div>

      {!isManager && !showAdd && (
        <p className="mb-6 rounded-lg bg-foreground-muted/5 px-4 py-3 text-xs text-foreground-muted">
          Only managers can add, edit, or delete expenses.
        </p>
      )}

      <div className="mb-6">
        <div className="flex gap-1 overflow-x-auto border-b border-foreground-muted/10">
          {tabs.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-1.5 whitespace-nowrap border-b-2 px-4 py-2 text-sm font-semibold transition-colors ${
                tab === t.key
                  ? "border-primary text-foreground"
                  : "border-transparent text-foreground-muted hover:text-foreground"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-foreground-muted/15 bg-surface p-8 text-center">
          <Receipt size={32} className="mx-auto mb-3 text-foreground-muted" />
          <p className="text-sm text-foreground-muted">
            {tab === "all"
              ? "No expenses recorded for this month."
              : `No ${tab.toLowerCase()} expenses this month.`}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((expense) => (
            <ExpenseCard
              key={expense.id}
              expense={expense}
              messId={messId!}
              monthId={activeMonth.id}
              isManager={isManager}
            />
          ))}
        </div>
      )}
    </>
  );
}
