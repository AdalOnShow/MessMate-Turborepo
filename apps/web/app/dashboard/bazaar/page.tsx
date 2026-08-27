"use client";

import { useMemo, useState } from "react";
import { useSessionStore } from "../../store";
import { useGetMyMess } from "../../hooks/use-messes";
import { useGetActiveMonth } from "../../hooks/use-months";
import {
  useGetBazaarHistory,
  useSubmitBazaar,
  useUpdateBazaar,
  useDeleteBazaar,
  useApproveBazaar,
  useRejectBazaar,
  type BazaarItemInfo,
  type BazaarSubmissionInfo,
} from "../../hooks/use-bazaar";
import { DatePicker } from "../../components/ui/date-picker";
import {
  Check,
  CheckCircle2,
  Loader2,
  Pencil,
  Plus,
  ShoppingCart,
  Trash2,
  X,
  XCircle,
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

function drawerInitials(name?: string | null) {
  return (name || "Member").trim().charAt(0).toUpperCase();
}

function BazaarForm({
  messId,
  monthId,
  editing,
  onDone,
}: {
  messId: string;
  monthId: string;
  editing?: BazaarSubmissionInfo | null;
  onDone?: () => void;
}) {
  const submit = useSubmitBazaar(messId, monthId);
  const update = useUpdateBazaar(messId, monthId);

  const [items, setItems] = useState<BazaarItemInfo[]>(
    editing?.items?.length
      ? editing.items.map((i) => ({ name: i.name, amount: i.amount }))
      : [{ name: "", amount: 0 }],
  );
  const [description, setDescription] = useState(editing?.description || "");
  const [expenseDate, setExpenseDate] = useState<Date | undefined>(
    editing?.expense_date
      ? new Date(editing.expense_date)
      : new Date(),
  );
  const [error, setError] = useState("");

  const isPending = submit.isPending || update.isPending;

  const total = items.reduce((sum, item) => sum + (item.amount || 0), 0);

  const updateItem = (index: number, patch: Partial<BazaarItemInfo>) => {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, ...patch } : item)),
    );
  };

  const addItem = () => {
    setItems((prev) => [...prev, { name: "", amount: 0 }]);
  };

  const removeItem = (index: number) => {
    setItems((prev) =>
      prev.length <= 1
        ? [{ name: "", amount: 0 }]
        : prev.filter((_, i) => i !== index),
    );
  };

  const handleSubmit = () => {
    setError("");

    const cleanedItems = items
      .map((item) => ({ name: item.name.trim(), amount: item.amount }))
      .filter((item) => item.name.length > 0 && item.amount > 0);

    if (cleanedItems.length === 0) {
      setError("Add at least one item with a name and amount.");
      return;
    }

    const payload = {
      items: cleanedItems,
      description: description.trim() || undefined,
      expense_date: expenseDate
        ? new Date(
            expenseDate.getTime() - expenseDate.getTimezoneOffset() * 60000,
          ).toISOString()
        : new Date().toISOString(),
    };

    const onSuccess = () => {
      setItems([{ name: "", amount: 0 }]);
      setDescription("");
      setExpenseDate(new Date());
      onDone?.();
    };

    if (editing) {
      update.mutate({ submissionId: editing.id, data: payload }, { onSuccess });
    } else {
      submit.mutate(payload, { onSuccess });
    }
  };

  return (
    <div className="rounded-xl border border-foreground-muted/15 bg-surface p-6">
      <div className="mb-5 flex items-center gap-2">
        <ShoppingCart size={18} className="text-primary" />
        <h2 className="text-lg font-semibold text-foreground">
          {editing ? "Edit Bazaar Submission" : "Submit Bazaar"}
        </h2>
      </div>

      <div className="space-y-4">
        <div>
          <p className="mb-2 text-sm font-medium text-foreground">Items</p>
          <div className="space-y-2">
            {items.map((item, index) => (
              <div key={index} className="flex items-center gap-2">
                <input
                  type="text"
                  value={item.name}
                  onChange={(e) => updateItem(index, { name: e.target.value })}
                  placeholder="Item name (e.g. Rice)"
                  className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-foreground-muted focus:outline-none focus:ring-2 focus:ring-primary/40"
                  disabled={isPending}
                />
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={item.amount || ""}
                  onChange={(e) =>
                    updateItem(index, {
                      amount: parseFloat(e.target.value) || 0,
                    })
                  }
                  placeholder="Amount"
                  className="w-32 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-foreground-muted focus:outline-none focus:ring-2 focus:ring-primary/40"
                  disabled={isPending}
                />
                <button
                  type="button"
                  onClick={() => removeItem(index)}
                  disabled={isPending}
                  aria-label="Remove item"
                  className="rounded-lg p-2 text-foreground-muted transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
                >
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={addItem}
            disabled={isPending}
            className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg border-2 border-dashed border-primary/50 bg-primary/5 px-4 py-2.5 text-sm font-semibold text-primary transition-colors hover:bg-primary/10 hover:text-primary-hover active:bg-primary/15 disabled:opacity-50"
          >
            <Plus size={16} />
            Add Item
          </button>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">
            Description (optional)
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Short note about this purchase"
            rows={2}
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

        <div className="flex items-center justify-between rounded-lg bg-background px-4 py-3">
          <span className="text-sm font-medium text-foreground-muted">
            Total
          </span>
          <span className="text-lg font-bold text-foreground">
            {formatMoney(total)}
          </span>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        {(submit.isError || update.isError) && (
          <p className="text-sm text-destructive">
            {(submit.error || update.error)?.message ||
              "Failed to save bazaar submission."}
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
                {editing ? <Check size={14} /> : <ShoppingCart size={14} />}
                {editing ? "Save Changes" : "Submit Bazaar"}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function BazaarCard({
  submission,
  messId,
  monthId,
  isManager,
  currentUserId,
}: {
  submission: BazaarSubmissionInfo;
  messId: string;
  monthId: string;
  isManager: boolean;
  currentUserId: string;
}) {
  const approve = useApproveBazaar(messId, monthId);
  const reject = useRejectBazaar(messId, monthId);
  const remove = useDeleteBazaar(messId, monthId);
  const [showEdit, setShowEdit] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const isPending = submission.status === "PENDING";
  const canModify =
    isPending && (isManager || submission.submitted_by === currentUserId);

  return (
    <div className="rounded-xl border border-foreground-muted/15 bg-surface p-4">
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          {submission.submitter?.avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={submission.submitter.avatar}
              alt=""
              className="h-8 w-8 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/15 text-sm font-bold text-primary">
              {drawerInitials(submission.submitter?.name)}
            </div>
          )}
          <div>
            <p className="text-sm font-semibold text-foreground">
              {submission.submitter?.name}
            </p>
            <p className="text-xs text-foreground-muted">
              {formatDate(submission.expense_date)}
            </p>
          </div>
        </div>

        <div className="flex flex-col items-end gap-1">
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
              submission.status === "PENDING"
                ? "bg-amber-500/15 text-amber-500"
                : submission.status === "APPROVED"
                  ? "bg-green-500/15 text-green-500"
                  : "bg-destructive/15 text-destructive"
            }`}
          >
            {submission.status === "PENDING"
              ? "Pending"
              : submission.status === "APPROVED"
                ? "Approved"
                : "Rejected"}
          </span>
        </div>
      </div>

      {showEdit ? (
        <BazaarForm
          messId={messId}
          monthId={monthId}
          editing={submission}
          onDone={() => setShowEdit(false)}
        />
      ) : (
        <>
          {submission.description && (
            <p className="mb-2 text-sm text-foreground-muted">
              {submission.description}
            </p>
          )}

          <div className="mb-3 overflow-hidden rounded-lg border border-foreground-muted/10">
            <table className="w-full text-sm">
              <tbody>
                {submission.items.map((item, index) => (
                  <tr
                    key={index}
                    className="border-b border-foreground-muted/10 last:border-0"
                  >
                    <td className="px-3 py-1.5 text-foreground">{item.name}</td>
                    <td className="px-3 py-1.5 text-right font-medium text-foreground">
                      {formatMoney(item.amount)}
                    </td>
                  </tr>
                ))}
                <tr className="bg-background">
                  <td className="px-3 py-2 font-semibold text-foreground">
                    Total
                  </td>
                  <td className="px-3 py-2 text-right font-bold text-foreground">
                    {formatMoney(submission.total_amount)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {submission.approver && (
            <p className="mb-2 text-xs text-foreground-muted">
              {submission.status === "APPROVED" ? "Approved" : "Reviewed"} by{" "}
              {submission.approver.name}
              {submission.approved_at
                ? ` on ${formatDate(submission.approved_at)}`
                : ""}
            </p>
          )}

          <div className="flex gap-2 pt-1">
            {isManager && isPending && (
              <>
                <button
                  type="button"
                  onClick={() => approve.mutate(submission.id)}
                  disabled={approve.isPending || reject.isPending}
                  className="flex items-center gap-1.5 rounded-lg bg-green-600/90 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-green-600 disabled:opacity-60"
                >
                  {approve.isPending ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : (
                    <CheckCircle2 size={12} />
                  )}
                  Approve
                </button>
                <button
                  type="button"
                  onClick={() => reject.mutate(submission.id)}
                  disabled={reject.isPending || approve.isPending}
                  className="flex items-center gap-1.5 rounded-lg bg-destructive/90 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-destructive disabled:opacity-60"
                >
                  {reject.isPending ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : (
                    <XCircle size={12} />
                  )}
                  Reject
                </button>
              </>
            )}

            {canModify && (
              <>
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
                    <span className="text-xs text-foreground-muted">
                      Delete?
                    </span>
                    <button
                      type="button"
                      onClick={() => remove.mutate(submission.id)}
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
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default function BazaarPage() {
  const user = useSessionStore((state) => state.user);
  const { data: myMess, isLoading: messLoading } = useGetMyMess();
  const messId = myMess?.id;
  const isManager = myMess?.current_user_role === "MANAGER";
  const { data: activeMonth, isLoading: monthLoading } =
    useGetActiveMonth(messId);
  const { data: history, isLoading: historyLoading } = useGetBazaarHistory(
    messId,
    activeMonth?.id,
  );
  const [activeTab, setActiveTab] = useState<
    "pending" | "approved" | "rejected"
  >("pending");

  const isLoading = messLoading || monthLoading || historyLoading;

  const pendingCount = history?.pending.length ?? 0;
  const approvedCount = history?.approved.length ?? 0;
  const rejectedCount = history?.rejected.length ?? 0;

  const tabs = useMemo(
    () => [
      { key: "pending" as const, label: "Pending", count: pendingCount },
      { key: "approved" as const, label: "Approved", count: approvedCount },
      { key: "rejected" as const, label: "Rejected", count: rejectedCount },
    ],
    [pendingCount, approvedCount, rejectedCount],
  );

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
          You need to be part of a mess to manage bazaar submissions.
        </p>
      </div>
    );
  }

  if (!activeMonth) {
    return (
      <div className="rounded-xl border border-foreground-muted/15 bg-surface p-8 text-center">
        <p className="text-sm text-foreground-muted">
          No active month. Start a month before submitting bazaar expenses.
        </p>
      </div>
    );
  }

  const currentList =
    activeTab === "pending"
      ? (history?.pending ?? [])
      : activeTab === "approved"
        ? (history?.approved ?? [])
        : (history?.rejected ?? []);

  const emptyMessage =
    activeTab === "pending"
      ? "No pending bazaar submissions."
      : activeTab === "approved"
        ? "No approved bazaar submissions yet."
        : "No rejected bazaar submissions.";

  return (
    <>
      <div className="mb-4">
        <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-primary">
              Bazaar
            </p>
            <h1 className="mt-2 text-3xl font-bold text-foreground">
              Bazaar Management
            </h1>
            <p className="mt-1 text-sm text-foreground-muted">
              Submit daily grocery/bazaar expenses for manager approval.
            </p>
          </div>
        </div>
      </div>

      <div className="mb-8">
        <BazaarForm messId={messId!} monthId={activeMonth.id} />
      </div>

      <div className="mb-6">
        <div className="flex gap-1 border-b border-foreground-muted/10">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 border-b-2 px-4 py-2 text-sm font-semibold transition-colors ${
                activeTab === tab.key
                  ? "border-primary text-foreground"
                  : "border-transparent text-foreground-muted hover:text-foreground"
              }`}
            >
              {tab.label}
              <span className="rounded-full bg-foreground-muted/10 px-1.5 text-xs">
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {currentList.length === 0 ? (
        <div className="rounded-xl border border-foreground-muted/15 bg-surface p-8 text-center">
          <ShoppingCart
            size={32}
            className="mx-auto mb-3 text-foreground-muted"
          />
          <p className="text-sm text-foreground-muted">{emptyMessage}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {currentList.map((submission) => (
            <BazaarCard
              key={submission.id}
              submission={submission}
              messId={messId!}
              monthId={activeMonth.id}
              isManager={isManager}
              currentUserId={user?.id ?? ""}
            />
          ))}
        </div>
      )}
    </>
  );
}
