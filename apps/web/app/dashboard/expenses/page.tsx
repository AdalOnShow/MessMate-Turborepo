"use client";

import { useMemo, useState } from "react";
import { useGetMyMess } from "../../hooks/use-messes";
import { useGetActiveMonth } from "../../hooks/use-months";
import { useMembers } from "../../hooks/use-members";
import { useCreateExpense } from "../../hooks/use-expenses";
import { DatePicker } from "../../components/ui/date-picker";
import { Select } from "../../components/ui/select";
import { Button } from "../../components/ui/button";
import { Check, Loader2, Plus, Receipt, Users } from "lucide-react";

function formatMoney(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "BDT",
    maximumFractionDigits: 2,
  }).format(n);
}

function computeSplit(amount: number, count: number): number[] {
  if (count <= 0 || amount <= 0) return [];
  const even = Math.floor((amount / count) * 100) / 100;
  const shares = new Array(count).fill(even);
  const remainder =
    Math.round(amount * 100) - Math.round(even * 100) * count;
  if (remainder > 0 && count > 0) {
    shares[count - 1]! = even + remainder / 100;
  }
  return shares;
}

type ExpenseFormType = "SHARED" | "INDIVIDUAL";

export default function AddExpensePage() {
  const { data: myMess, isLoading: messLoading } = useGetMyMess();
  const messId = myMess?.id;
  const isManager = myMess?.current_user_role === "MANAGER";
  const { data: activeMonth, isLoading: monthLoading } =
    useGetActiveMonth(messId);
  const { data: members, isLoading: membersLoading } = useMembers(messId, {
    status: "ACTIVE",
  });

  const create = useCreateExpense(messId, activeMonth?.id);
  const isLoading = messLoading || monthLoading || membersLoading;

  const [type, setType] = useState<ExpenseFormType>("SHARED");
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [expenseDate, setExpenseDate] = useState<Date | undefined>(new Date());
  const [selected, setSelected] = useState<string[]>([]);
  const [error, setError] = useState("");

  const parsedAmount = parseFloat(amount);
  const shares = useMemo(
    () => computeSplit(parsedAmount || 0, selected.length),
    [parsedAmount, selected.length],
  );

  const activeMembers = (members ?? []).filter((m) => !m.removed_at);

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

    if (!parsedAmount || parsedAmount <= 0) {
      setError("Amount must be greater than zero.");
      return;
    }

    if (selected.length === 0) {
      setError("Select at least one member.");
      return;
    }

    if (type === "INDIVIDUAL" && selected.length !== 1) {
      setError("Select exactly one member for an individual expense.");
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
    };

    create.mutate(payload, {
      onSuccess: () => {
        setTitle("");
        setAmount("");
        setSelected([]);
        setExpenseDate(new Date());
        setError("");
      },
    });
  };

  const selectedMembers = selected
    .map((id) => activeMembers.find((m) => m.id === id))
    .filter((m): m is NonNullable<typeof m> => !!m);

  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="mx-auto mb-6 max-w-2xl space-y-2">
          <div className="h-3 w-20 rounded bg-foreground-muted/20" />
          <div className="h-7 w-56 rounded bg-foreground-muted/20" />
          <div className="h-4 w-72 max-w-full rounded bg-foreground-muted/20" />
        </div>
        <div className="mx-auto max-w-2xl overflow-hidden rounded-2xl border border-foreground-muted/15 bg-surface">
          <div className="space-y-5 p-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <div className="h-3 w-12 rounded bg-foreground-muted/20" />
                <div className="h-10 w-full rounded-lg bg-foreground-muted/20" />
              </div>
              <div className="space-y-2">
                <div className="h-3 w-12 rounded bg-foreground-muted/20" />
                <div className="h-10 w-full rounded-lg bg-foreground-muted/20" />
              </div>
            </div>
            <div className="space-y-2">
              <div className="h-3 w-12 rounded bg-foreground-muted/20" />
              <div className="h-10 w-full rounded-lg bg-foreground-muted/20" />
            </div>
            <div className="space-y-2">
              <div className="h-3 w-16 rounded bg-foreground-muted/20" />
              <div className="h-10 w-full rounded-lg bg-foreground-muted/20" />
            </div>
            <div className="space-y-2">
              <div className="h-3 w-16 rounded bg-foreground-muted/20" />
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="h-9 w-full rounded-lg bg-foreground-muted/20"
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!myMess) {
    return (
      <div className="flex flex-col items-center rounded-2xl border border-foreground-muted/15 bg-surface p-12 text-center">
        <Receipt size={32} className="mb-3 text-foreground-muted" />
        <p className="text-sm text-foreground-muted">
          You need to be part of a mess to add expenses.
        </p>
      </div>
    );
  }

  if (!isManager) {
    return (
      <div className="flex flex-col items-center rounded-2xl border border-foreground-muted/15 bg-surface p-12 text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-foreground-muted/5">
          <Users size={26} className="text-foreground-muted" />
        </div>
        <p className="text-sm font-semibold text-foreground">
          Only managers can add expenses
        </p>
        <p className="mt-1 text-sm text-foreground-muted">
          Ask a manager to record expenses for this month.
        </p>
      </div>
    );
  }

  if (!activeMonth) {
    return (
      <div className="flex flex-col items-center rounded-2xl border border-foreground-muted/15 bg-surface p-12 text-center">
        <Receipt size={32} className="mb-3 text-foreground-muted" />
        <p className="text-sm text-foreground-muted">
          No active month. Start a month before adding expenses.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <p className="text-sm font-semibold uppercase tracking-wide text-primary">
          Expenses
        </p>
        <h1 className="mt-1 text-3xl font-bold text-foreground">
          Add Expense
        </h1>
        <p className="mt-1 text-sm text-foreground-muted">
          Record a shared or individual expense. Shared amounts are split
          evenly across the selected members.
        </p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-foreground-muted/15 bg-surface shadow-sm">
        <div className="flex items-center gap-2 border-b border-foreground-muted/10 bg-gradient-to-r from-primary/10 to-transparent px-6 py-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-white">
            <Plus size={16} />
          </div>
          <h2 className="text-lg font-semibold text-foreground">
            New expense for {activeMonth.title ?? "this month"}
          </h2>
        </div>

        <div className="space-y-5 px-6 py-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">
                Type
              </label>
              <Select
                value={type}
                onValueChange={(v) => {
                  const t = v as ExpenseFormType;
                  setType(t);
                  if (t === "INDIVIDUAL") {
                    setSelected((prev) =>
                      prev.length > 1 ? [prev[0]!] : prev,
                    );
                  }
                }}
                options={[
                  { value: "SHARED", label: "Shared" },
                  { value: "INDIVIDUAL", label: "Individual" },
                ]}
                className="w-full"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">
                Amount
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-foreground-muted">
                  ৳
                </span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  onWheel={(e) => e.currentTarget.blur()}
                  placeholder="0.00"
                  className="w-full appearance-none rounded-lg border border-foreground-muted/20 bg-background py-2.5 pl-8 pr-3 text-sm text-foreground placeholder:text-foreground-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-inner-spin-button]:m-0"
                  disabled={create.isPending}
                />
              </div>
            </div>
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
              className="w-full rounded-lg border border-foreground-muted/20 bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-foreground-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
              disabled={create.isPending}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">
              Expense Date
            </label>
            <DatePicker
              date={expenseDate}
              onSelect={setExpenseDate}
              disabled={create.isPending}
            />
          </div>

          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label className="block text-sm font-medium text-foreground">
                {type === "INDIVIDUAL" ? "Member" : "Members"}
              </label>
              {type === "SHARED" && activeMembers.length > 0 ? (
                <button
                  type="button"
                  onClick={() =>
                    setSelected(
                      selected.length === activeMembers.length
                        ? []
                        : activeMembers.map((m) => m.id),
                    )
                  }
                  className="text-xs font-semibold text-primary transition-colors hover:text-primary-hover disabled:opacity-50"
                  disabled={create.isPending}
                >
                  {selected.length === activeMembers.length
                    ? "Clear all"
                    : "Select all"}
                </button>
              ) : (
                selected.length > 0 && (
                  <span className="text-xs font-medium text-foreground-muted">
                    {selected.length} selected
                  </span>
                )
              )}
            </div>
            <div className="max-h-44 space-y-1.5 overflow-y-auto rounded-lg border border-foreground-muted/20 bg-background p-2">
              {activeMembers.length === 0 ? (
                <p className="px-2 py-3 text-center text-sm text-foreground-muted">
                  No active members found.
                </p>
              ) : (
                activeMembers.map((member) => {
                  const isChecked = selected.includes(member.id);
                  return (
                    <label
                      key={member.id}
                      className={`flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                        isChecked
                          ? "bg-primary/10 text-primary"
                          : "text-foreground hover:bg-surface-raised"
                      }`}
                    >
                      <span
                        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors ${
                          isChecked
                            ? "border-primary bg-primary text-white"
                            : "border-foreground-muted/30 bg-transparent"
                        }`}
                      >
                        {isChecked && <Check size={12} strokeWidth={3} />}
                      </span>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleMember(member.id)}
                        disabled={create.isPending}
                        className="sr-only"
                      />
                      <span className="flex-1">{member.user.name}</span>
                      {isChecked && type === "SHARED" && shares.length > 0 && (
                        <span className="text-xs font-medium text-foreground-muted">
                          {formatMoney(
                            shares[selected.indexOf(member.id)] ?? 0,
                          )}
                        </span>
                      )}
                    </label>
                  );
                })
              )}
            </div>
          </div>

          {type === "SHARED" &&
            selected.length > 0 &&
            parsedAmount > 0 &&
            create.isIdle && (
              <div className="rounded-xl border border-primary/25 bg-primary/5 p-4">
                <div className="mb-2 flex items-center gap-2 text-primary">
                  <Users size={14} />
                  <span className="text-xs font-semibold uppercase tracking-wide">
                    Auto-split · {formatMoney(parsedAmount)} ÷ {selected.length}
                  </span>
                </div>
                <div className="space-y-1.5">
                  {selectedMembers.map((member, index) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="text-foreground">{member.user.name}</span>
                      <span className="font-semibold text-foreground">
                        {formatMoney(shares[index] ?? 0)}
                      </span>
                    </div>
                  ))}
                  <div className="mt-1 flex items-center justify-between border-t border-primary/15 pt-1.5 text-sm">
                    <span className="text-foreground-muted">Total</span>
                    <span className="font-bold text-primary">
                      {formatMoney(parsedAmount)}
                    </span>
                  </div>
                </div>
              </div>
            )}

          {error && <p className="text-sm text-destructive">{error}</p>}

          {create.isError && (
            <p className="text-sm text-destructive">
              {create.error?.message || "Failed to save expense."}
            </p>
          )}

          {create.isSuccess && (
            <p className="rounded-lg bg-green-500/10 px-4 py-3 text-sm font-medium text-green-500">
              Expense added successfully.
            </p>
          )}

          <Button
            type="button"
            onClick={handleSubmit}
            disabled={create.isPending}
            className="w-full"
          >
            {create.isPending ? (
              <>
                <Loader2 size={15} className="animate-spin" />
                Adding...
              </>
            ) : (
              <>
                <Plus size={15} />
                Add Expense
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
