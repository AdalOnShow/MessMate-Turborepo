"use client";

import { PageTips } from "../../../components/help/PageTips";

import {
  formatDateOnly,
  fromDateOnlyISO,
  toDateOnlyISO,
  formatMoneyExact,
} from "../../../lib/format";
import { showSuccess } from "../../../store/success-dialog";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { useSessionStore } from "../../../store";
import { useGetMyMess } from "../../../hooks/use-messes";
import { useGetActiveMonth } from "../../../hooks/use-months";
import {
  useBazaarSubmissions,
  useSubmitBazaar,
  useUpdateBazaar,
  useDeleteBazaar,
  useApproveBazaar,
  useRejectBazaar,
  type BazaarItemInfo,
  type BazaarStatus,
  type BazaarSubmissionInfo,
} from "../../../hooks/use-bazaar";
import { Button } from "../../../components/ui/button";
import { DatePicker } from "../../../components/ui/date-picker";
import { FieldError } from "../../../components/ui/field-error";
import { OfflineHint } from "../../../components/ui/offline-hint";
import { UserAvatar } from "../../../components/dashboard/UserAvatar";
import { useOnline } from "../../../hooks/use-online";
import {
  Check,
  Loader2,
  Pencil,
  Plus,
  ShoppingCart,
  Trash2,
  X,
} from "lucide-react";
import {
  QueriesErrorState,
  failedQueries,
} from "../../../components/feedback/QueryErrorState";

function formatDate(iso: string) {
  return formatDateOnly(iso);
}

const inputClass =
  "w-full rounded-lg border border-border-strong bg-surface-sunken px-3 py-2.5 text-sm text-foreground placeholder:text-foreground-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15 disabled:opacity-60";

// Hides the native increment/decrement spinner (Chromium/Safari + Firefox).
const numberInputClass =
  "[appearance:textfield] [&::-webkit-inner-spin-button]:m-0 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:m-0 [&::-webkit-outer-spin-button]:appearance-none";

const STATUS_STYLES = {
  PENDING: "border-accent-warm/25 bg-accent-warm/10 text-accent-warm",
  APPROVED: "border-success/25 bg-success/10 text-success",
  REJECTED: "border-destructive/25 bg-destructive/10 text-destructive",
} as const;

function BazaarForm({
  messId,
  monthId,
  editing,
  onDone,
}: {
  messId: string;
  monthId: string;
  /** When set, the form edits this submission and renders inline (no card chrome). */
  editing?: BazaarSubmissionInfo | null;
  onDone?: () => void;
}) {
  const t = useTranslations("pages.bazaar");
  const tsd = useTranslations("feedback.successDialog");
  const { data: myMess } = useGetMyMess();
  const isManager = myMess?.current_user_role === "MANAGER";
  const submit = useSubmitBazaar(messId, monthId);
  const update = useUpdateBazaar(messId, monthId);

  const [items, setItems] = useState<BazaarItemInfo[]>(
    editing?.items?.length
      ? editing.items.map((i) => ({ name: i.name, amount: i.amount }))
      : [{ name: "", amount: 0 }],
  );
  const [description, setDescription] = useState(editing?.description || "");
  const [expenseDate, setExpenseDate] = useState<Date | undefined>(
    editing?.expense_date ? fromDateOnlyISO(editing.expense_date) : new Date(),
  );
  const [error, setError] = useState("");
  const online = useOnline();

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
      setError(t("addAtLeastOne"));
      return;
    }

    const payload = {
      items: cleanedItems,
      description: description.trim() || undefined,
      expense_date: toDateOnlyISO(expenseDate),
    };

    const onSuccess = () => {
      setItems([{ name: "", amount: 0 }]);
      setDescription("");
      setExpenseDate(new Date());
      onDone?.();
    };

    const total = cleanedItems.reduce((sum, i) => sum + i.amount, 0);
    const summaryRows = [
      {
        label: tsd("labels.items"),
        value: cleanedItems.map((i) => i.name).join(", "),
      },
      { label: tsd("labels.total"), value: formatMoneyExact(total) },
      {
        label: tsd("labels.date"),
        value: formatDateOnly(payload.expense_date),
      },
    ];

    if (editing) {
      update.mutate(
        { submissionId: editing.id, data: payload },
        {
          onSuccess: () => {
            onSuccess();
            showSuccess({ title: "bazaarUpdated", rows: summaryRows });
          },
        },
      );
    } else {
      submit.mutate(payload, {
        onSuccess: () => {
          onSuccess();
          showSuccess({
            title: "bazaarSubmitted",
            rows: summaryRows,
            hint: isManager
              ? tsd("hints.bazaarManager")
              : tsd("hints.bazaarMember"),
          });
        },
      });
    }
  };

  const fields = (
    <div className="space-y-5">
      <div>
        <p className="mb-1.5 text-sm font-medium text-foreground">
          {t("items")}
        </p>
        <div className="space-y-2">
          {items.map((item, index) => (
            <div
              key={index}
              className="flex flex-col gap-2 rounded-lg border border-border p-2 sm:flex-row sm:border-0 sm:p-0"
            >
              <input
                type="text"
                value={item.name}
                onChange={(e) => {
                  updateItem(index, { name: e.target.value });
                  setError("");
                }}
                placeholder={t("itemNameEG")}
                aria-label={t("items")}
                className={`${inputClass} sm:flex-1`}
                disabled={isPending}
              />
              <div className="flex items-center gap-2 sm:w-48 sm:shrink-0">
                <input
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="0.01"
                  value={item.amount || ""}
                  onChange={(e) => {
                    updateItem(index, {
                      amount: parseFloat(e.target.value) || 0,
                    });
                    setError("");
                  }}
                  onWheel={(e) => e.currentTarget.blur()}
                  placeholder={t("amount")}
                  aria-label={t("amount")}
                  className={`${inputClass} ${numberInputClass} min-w-0 flex-1 tabular-nums`}
                  disabled={isPending}
                />
                <button
                  type="button"
                  onClick={() => removeItem(index)}
                  disabled={isPending}
                  aria-label={t("removeItem")}
                  title={t("removeItem")}
                  className="flex size-[42px] shrink-0 items-center justify-center rounded-lg border border-border-strong bg-surface-sunken text-foreground-muted transition-colors hover:border-destructive/40 hover:bg-destructive/10 hover:text-destructive focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/15 disabled:opacity-60"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={addItem}
          disabled={isPending}
          className="mt-3 w-full border-dashed text-primary hover:border-primary/50 hover:bg-primary/5 hover:text-primary"
        >
          <Plus />
          {t("addItem")}
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="mb-1.5 block text-sm font-medium text-foreground">
            {t("descriptionOptional")}
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t("shortNoteAboutPurchase")}
            rows={2}
            className={`${inputClass} resize-none`}
            disabled={isPending}
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">
            {t("expenseDate")}
          </label>
          <DatePicker
            date={expenseDate}
            onSelect={setExpenseDate}
            disabled={isPending}
            maxDate={new Date()}
          />
        </div>

        <div>
          <p className="mb-1.5 text-sm font-medium text-foreground">
            {t("total")}
          </p>
          <div className="flex h-[42px] items-center justify-end rounded-lg border border-primary/25 bg-primary/5 px-3 text-base font-bold tabular-nums text-primary">
            {formatMoneyExact(total)}
          </div>
        </div>
      </div>

      <FieldError message={error} />

      <div className="flex flex-col-reverse gap-2 sm:flex-row">
        {editing && (
          <Button
            type="button"
            variant="outline"
            onClick={onDone}
            disabled={isPending}
            className="sm:w-32"
          >
            {t("cancel")}
          </Button>
        )}
        <Button
          type="button"
          onClick={handleSubmit}
          disabled={isPending || !online}
          className="flex-1"
        >
          {isPending ? (
            <>
              <Loader2 className="animate-spin" />
              {t("saving")}
            </>
          ) : (
            <>
              {editing ? <Check /> : <ShoppingCart />}
              {editing ? t("saveChanges") : t("submitBazaar")}
            </>
          )}
        </Button>
      </div>
      <OfflineHint />
    </div>
  );

  if (editing) return fields;

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-surface">
      <div className="flex items-center gap-2 border-b border-border bg-surface-raised px-4 py-4 sm:px-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-white">
          <ShoppingCart size={16} />
        </div>
        <h2 className="text-lg font-semibold text-foreground">
          {t("submitBazaar")}
        </h2>
      </div>
      <div className="px-4 py-5 sm:px-6 sm:py-6">{fields}</div>
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
  const t = useTranslations("pages.bazaar");
  const approve = useApproveBazaar(messId, monthId);
  const reject = useRejectBazaar(messId, monthId);
  const tsd = useTranslations("feedback.successDialog");
  const remove = useDeleteBazaar(messId, monthId);
  const [showEdit, setShowEdit] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const isPending = submission.status === "PENDING";
  const canModify =
    isPending && (isManager || submission.submitted_by === currentUserId);
  const canReview = isManager && isPending;
  const deciding = approve.isPending || reject.isPending;

  const statusLabel =
    submission.status === "PENDING"
      ? t("statusPending")
      : submission.status === "APPROVED"
        ? t("statusApproved")
        : t("statusRejected");

  return (
    <div className="rounded-2xl border border-border bg-surface p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <UserAvatar
          name={submission.submitter?.name}
          avatar={submission.submitter?.avatar}
          className="size-9 shrink-0 text-xs"
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-foreground">
            {submission.submitter?.name}
          </p>
          <p className="text-xs text-foreground-muted">
            {formatDate(submission.expense_date)}
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <span className="text-base font-bold tabular-nums text-foreground">
            {formatMoneyExact(submission.total_amount)}
          </span>
          <span
            className={`rounded-[5px] border px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-[0.08em] ${STATUS_STYLES[submission.status]}`}
          >
            {statusLabel}
          </span>
        </div>
      </div>

      {showEdit ? (
        <div className="mt-4 border-t border-border pt-4">
          <BazaarForm
            messId={messId}
            monthId={monthId}
            editing={submission}
            onDone={() => setShowEdit(false)}
          />
        </div>
      ) : (
        <>
          {submission.description && (
            <p className="mt-3 break-words text-sm text-foreground-muted">
              {submission.description}
            </p>
          )}

          <ul className="mt-3 divide-y divide-border rounded-lg border border-border bg-background/40">
            {submission.items.map((item, index) => (
              <li
                key={index}
                className="flex items-start justify-between gap-3 px-3 py-2 text-sm"
              >
                <span className="min-w-0 break-words text-foreground">
                  {item.name}
                </span>
                <span className="shrink-0 font-medium tabular-nums text-foreground">
                  {formatMoneyExact(item.amount)}
                </span>
              </li>
            ))}
          </ul>

          {submission.approver && (
            <p className="mt-3 text-xs text-foreground-muted">
              {submission.status === "APPROVED"
                ? t("approvedBy", { name: submission.approver.name })
                : t("reviewedBy", { name: submission.approver.name })}
              {submission.approved_at
                ? ` ${t("onDate", { date: formatDate(submission.approved_at) })}`
                : ""}
            </p>
          )}

          {(canModify || canReview) && (
            <div className="mt-4 flex flex-col gap-2 border-t border-border pt-3 sm:flex-row sm:items-center sm:justify-between">
              {canModify &&
                (confirmDelete ? (
                  <div className="flex items-center gap-2">
                    <span className="mr-auto text-sm font-medium text-foreground sm:mr-1">
                      {t("delete")}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setConfirmDelete(false)}
                      disabled={remove.isPending}
                    >
                      {t("no")}
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() =>
                        remove.mutate(submission.id, {
                          onSuccess: () =>
                            showSuccess({
                              title: "bazaarDeleted",
                              rows: [
                                {
                                  label: tsd("labels.items"),
                                  value: submission.items
                                    .map((i) => i.name)
                                    .join(", "),
                                },
                                {
                                  label: tsd("labels.total"),
                                  value: formatMoneyExact(
                                    submission.total_amount,
                                  ),
                                },
                              ],
                            }),
                        })
                      }
                      disabled={remove.isPending}
                    >
                      {remove.isPending ? (
                        <Loader2 className="animate-spin" />
                      ) : (
                        <Trash2 />
                      )}
                      {remove.isPending ? t("deleting") : t("delete2")}
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowEdit(true)}
                      disabled={deciding}
                    >
                      <Pencil />
                      {t("edit")}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setConfirmDelete(true)}
                      disabled={deciding}
                      className="hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 />
                      {t("delete2")}
                    </Button>
                  </div>
                ))}

              {canReview && (
                <div className="grid grid-cols-2 gap-2 sm:ml-auto sm:flex">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => reject.mutate(submission.id)}
                    disabled={deciding}
                    className="hover:border-destructive/40 hover:bg-destructive/10 hover:text-destructive sm:h-9"
                  >
                    {reject.isPending ? (
                      <Loader2 className="animate-spin" />
                    ) : (
                      <X />
                    )}
                    {t("reject")}
                  </Button>
                  <Button
                    type="button"
                    onClick={() => approve.mutate(submission.id)}
                    disabled={deciding}
                    className="bg-success text-white hover:bg-success/90 sm:h-9"
                  >
                    {approve.isPending ? (
                      <Loader2 className="animate-spin" />
                    ) : (
                      <Check />
                    )}
                    {t("approve")}
                  </Button>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

/**
 * "Showing 4 of 23" and a button that fetches the next 4 from the server.
 * Loads only when tapped: auto-loading on scroll fetched every page at once
 * on tall screens, where the button is visible right away.
 */
function LoadMore({
  shown,
  total,
  onLoadMore,
  isLoading,
  failed,
}: {
  shown: number;
  total: number;
  onLoadMore: () => void;
  isLoading: boolean;
  failed: boolean;
}) {
  const t = useTranslations("pages.bazaar");
  return (
    <div className="mt-4 flex flex-col items-center gap-2">
      {total > shown && (
        <p className="text-xs text-foreground-muted">
          {t("showingOf", { shown, total })}
        </p>
      )}
      <button
        type="button"
        onClick={onLoadMore}
        disabled={isLoading}
        className="flex w-full items-center justify-center gap-2 rounded-lg border border-border-strong px-4 py-2.5 text-sm font-semibold text-foreground-muted transition-colors hover:bg-surface-raised hover:text-foreground disabled:opacity-60 sm:w-auto sm:py-2"
      >
        {isLoading && <Loader2 size={14} className="animate-spin" />}
        {isLoading
          ? t("loadingMore")
          : failed
            ? t("retryLoadMore")
            : t("loadMore")}
      </button>
    </div>
  );
}

export default function BazaarPage() {
  const t = useTranslations("pages.bazaar");
  const user = useSessionStore((state) => state.user);
  const messQuery = useGetMyMess();
  const { data: myMess, isLoading: messLoading } = messQuery;
  const messId = myMess?.id;
  const isManager = myMess?.current_user_role === "MANAGER";
  const monthQuery = useGetActiveMonth(messId);
  const { data: activeMonth, isLoading: monthLoading } = monthQuery;
  const [activeTab, setActiveTab] = useState<BazaarStatus>("PENDING");
  // Only the selected tab is fetched, one page at a time.
  const listQuery = useBazaarSubmissions(messId, activeMonth?.id, activeTab);
  const {
    items,
    counts,
    isLoading: listLoading,
    isPlaceholderData: switchingTab,
  } = listQuery;

  const isLoading = messLoading || monthLoading || listLoading;

  const pendingCount = counts?.pending ?? 0;
  const approvedCount = counts?.approved ?? 0;
  const rejectedCount = counts?.rejected ?? 0;

  const tabs = useMemo(
    () => [
      {
        key: "PENDING" as const,
        label: t("statusPending"),
        count: pendingCount,
      },
      {
        key: "APPROVED" as const,
        label: t("statusApproved"),
        count: approvedCount,
      },
      {
        key: "REJECTED" as const,
        label: t("statusRejected"),
        count: rejectedCount,
      },
    ],
    [pendingCount, approvedCount, rejectedCount, t],
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  const pageQueries = [messQuery, monthQuery, listQuery];
  if (failedQueries(...pageQueries).length > 0) {
    return (
      <QueriesErrorState queries={pageQueries} resource="bazaar submissions" />
    );
  }

  if (!myMess) {
    return (
      <div className="rounded-xl border border-border bg-surface p-8 text-center">
        <p className="text-sm text-foreground-muted">
          {t("needPartMessManage")}
        </p>
      </div>
    );
  }

  if (!activeMonth) {
    return (
      <div className="rounded-xl border border-border bg-surface p-8 text-center">
        <p className="text-sm text-foreground-muted">
          {t("noActiveMonthStart")}
        </p>
      </div>
    );
  }

  const emptyMessage =
    activeTab === "PENDING"
      ? t("noPendingBazaarSubmissions")
      : activeTab === "APPROVED"
        ? t("noApprovedBazaarSubmissions")
        : t("noRejectedBazaarSubmissions");

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <p className="label-mono text-primary">{t("bazaar")}</p>
        <div className="mt-1 flex items-start justify-between gap-3">
          <h1 className="heading-tight text-2xl text-foreground sm:text-3xl">
            {t("bazaarManagement")}
          </h1>
          <PageTips page="bazaar" />
        </div>
        <p className="mt-1 text-sm text-foreground-muted">
          {t("submitDailyGroceryBazaar")}
        </p>
      </div>

      <div className="mb-8">
        <BazaarForm messId={messId!} monthId={activeMonth.id} />
      </div>

      <div
        role="tablist"
        className="mb-4 grid grid-cols-3 gap-1 rounded-xl border border-border bg-surface p-1"
      >
        {tabs.map((tab) => {
          const selected = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => setActiveTab(tab.key)}
              className={`flex min-w-0 items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-sm font-semibold transition-colors ${
                selected
                  ? "bg-primary/10 text-primary"
                  : "text-foreground-muted hover:bg-surface-raised hover:text-foreground"
              }`}
            >
              <span className="truncate">{tab.label}</span>
              <span
                className={`rounded-full px-1.5 text-xs tabular-nums ${
                  selected ? "bg-primary/15" : "bg-surface-raised"
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {switchingTab ? (
        // The newly selected tab's first page is still loading; the data on
        // screen still belongs to the previous tab. (A failed load drops the
        // placeholder and falls through to the page-level error state.)
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-border bg-surface p-8 text-center">
          <ShoppingCart
            size={32}
            className="mx-auto mb-3 text-foreground-muted"
          />
          <p className="text-sm text-foreground-muted">{emptyMessage}</p>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {items.map((submission) => (
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
          {listQuery.hasNextPage && (
            <LoadMore
              shown={items.length}
              total={
                activeTab === "PENDING"
                  ? pendingCount
                  : activeTab === "APPROVED"
                    ? approvedCount
                    : rejectedCount
              }
              onLoadMore={() => void listQuery.fetchNextPage()}
              isLoading={listQuery.isFetchingNextPage}
              failed={listQuery.isFetchNextPageError}
            />
          )}
        </>
      )}
    </div>
  );
}
