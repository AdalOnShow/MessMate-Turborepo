"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import {
  useGetMyMess,
  useGetMealTypes,
  useCreateMealType,
  useUpdateMealType,
  useDeleteMealType,
} from "../../hooks/use-messes";
import type { MealTypeInfo } from "../../hooks/use-messes";
import { Check, Loader2, Plus, Trash2, UtensilsCrossed, X } from "lucide-react";
import {
  QueriesErrorState,
  failedQueries,
} from "../../components/feedback/QueryErrorState";

function CreateMealTypeForm({
  messId,
  onCancel,
}: {
  messId: string;
  onCancel: () => void;
}) {
  const t = useTranslations("pages.mealTypes");
  const createMealType = useCreateMealType(messId);
  const [name, setName] = useState("");
  const [value, setValue] = useState("1");
  const [error, setError] = useState("");

  const handleSubmit = () => {
    setError("");
    const trimmed = name.trim();

    if (!trimmed) {
      setError(t("nameRequired"));
      return;
    }

    if (trimmed.length > 50) {
      setError(t("nameMustAtMost"));
      return;
    }

    const numVal = parseFloat(value);
    if (isNaN(numVal) || numVal < 0 || numVal > 10) {
      setError("Value must be between 0 and 10");
      return;
    }

    createMealType.mutate(
      { name: trimmed, value: numVal },
      {
        onSuccess: () => {
          setName("");
          setValue("1");
          onCancel();
        },
      },
    );
  };

  return (
    <div className="rounded-lg border border-border bg-background p-4">
      <div className="mb-3 flex items-center gap-2">
        <Plus size={16} className="text-primary" />
        <p className="text-sm font-semibold text-foreground">
          {t("newMealType")}
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="flex-1">
          <input
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setError("");
            }}
            placeholder={t("eGBreakfastLunch")}
            className={`w-full rounded-lg border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-foreground-muted focus:outline-none focus:ring-2 ${
              error
                ? "border-destructive focus:ring-destructive/40"
                : "border-border-strong focus:ring-primary/40"
            }`}
            disabled={createMealType.isPending}
          />
        </div>
        <div className="w-full sm:w-28">
          <input
            type="number"
            inputMode="decimal"
            step="0.1"
            min="0"
            max="10"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={t("value2")}
            className="w-full rounded-lg border border-border-strong bg-surface px-3 py-2 text-sm text-foreground placeholder:text-foreground-muted focus:border-primary focus:ring-2 focus:ring-primary/15 focus:outline-none"
            disabled={createMealType.isPending}
          />
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={createMealType.isPending}
            className="flex items-center gap-1.5 rounded-lg border border-border-strong px-3 py-2 text-sm font-semibold text-foreground-muted transition-colors hover:bg-surface-raised disabled:opacity-60"
          >
            <X size={14} />
            {t("cancel")}
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={createMealType.isPending}
            className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-hover disabled:opacity-60"
          >
            {createMealType.isPending ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Plus size={14} />
            )}
            {t("add")}
          </button>
        </div>
      </div>

      {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
    </div>
  );
}

function MealTypeRow({
  mealType,
  messId,
}: {
  mealType: MealTypeInfo;
  messId: string;
}) {
  const t = useTranslations("pages.mealTypes");
  const updateMealType = useUpdateMealType(messId);
  const deleteMealType = useDeleteMealType(messId);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleToggleActive = () => {
    updateMealType.mutate({
      mealTypeId: mealType.id,
      data: { is_active: !mealType.is_active },
    });
  };

  const handleValueChange = (newValue: string) => {
    const num = parseFloat(newValue);
    if (isNaN(num)) return;
    updateMealType.mutate({
      mealTypeId: mealType.id,
      data: { value: num },
    });
  };

  const handleDelete = () => {
    deleteMealType.mutate(mealType.id, {
      onSuccess: () => setConfirmDelete(false),
    });
  };

  return (
    <div
      className={`flex items-center justify-between rounded-lg border p-3 transition-colors ${
        mealType.is_active
          ? "border-primary/30 bg-primary/5"
          : "border-border bg-surface"
      }`}
    >
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleToggleActive}
          disabled={updateMealType.isPending}
          className={`flex h-5 w-5 items-center justify-center rounded border transition-colors ${
            mealType.is_active
              ? "border-primary bg-primary text-white"
              : "border-border-strong bg-transparent"
          }`}
        >
          {mealType.is_active && <Check size={12} />}
        </button>
        <div>
          <p className="text-sm font-semibold text-foreground">
            {mealType.name}
          </p>
          <p className="text-xs text-foreground-muted">
            {mealType.is_active ? "Active" : "Inactive"}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {mealType.is_active && (
          <div className="flex items-center gap-2">
            <label className="text-xs text-foreground-muted">
              {t("value")}
            </label>
            <input
              type="number"
              inputMode="decimal"
              step="0.1"
              min="0"
              max="10"
              defaultValue={mealType.value}
              onBlur={(e) => handleValueChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleValueChange(e.currentTarget.value);
                }
              }}
              className="w-20 rounded-md border border-border-strong bg-surface-sunken px-2 py-1 text-sm text-foreground focus:border-primary focus:ring-2 focus:ring-primary/15 focus:outline-none"
            />
          </div>
        )}

        {confirmDelete ? (
          <div className="flex items-center gap-2">
            <span className="text-xs text-foreground-muted">{t("delete")}</span>
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleteMealType.isPending}
              className="rounded bg-destructive/10 px-2 py-1 text-xs font-semibold text-destructive transition-colors hover:bg-destructive/20"
            >
              {deleteMealType.isPending ? (
                <Loader2 size={12} className="animate-spin" />
              ) : (
                "Yes"
              )}
            </button>
            <button
              type="button"
              onClick={() => setConfirmDelete(false)}
              className="rounded bg-surface-raised px-2 py-1 text-xs font-semibold text-foreground-muted transition-colors hover:bg-surface-overlay"
            >
              {t("no")}
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            className="rounded p-1.5 text-foreground-muted transition-colors hover:bg-destructive/10 hover:text-destructive"
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>
    </div>
  );
}

export default function MealTypesPage() {
  const t = useTranslations("pages.mealTypes");
  const messQuery = useGetMyMess();
  const { data: myMess, isLoading: messLoading } = messQuery;
  const messId = myMess?.id;
  const isManager = myMess?.current_user_role === "MANAGER";

  const typesQuery = useGetMealTypes(messId);
  const { data: mealTypes, isLoading: typesLoading } = typesQuery;

  const [showCreate, setShowCreate] = useState(false);

  const isLoading = messLoading || typesLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (failedQueries(messQuery, typesQuery).length > 0) {
    return (
      <QueriesErrorState
        queries={[messQuery, typesQuery]}
        resource="meal types"
      />
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

  const activeTypes = (mealTypes ?? []).filter((mt) => mt.is_active);
  const inactiveTypes = (mealTypes ?? []).filter((mt) => !mt.is_active);

  return (
    <>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="label-mono text-primary">{t("mealTypes")}</p>
          <h1 className="mt-2 heading-tight text-2xl text-foreground sm:text-3xl">
            {t("configureMealTypes")}
          </h1>
          <p className="mt-1 text-sm text-foreground-muted">
            {t("defineMealTypesTheir")}
          </p>
        </div>

        {isManager && !showCreate && (
          <button
            type="button"
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
          >
            <Plus size={14} />
            {t("addMealType")}
          </button>
        )}
      </div>

      {isManager && showCreate && messId && (
        <div className="mb-6">
          <CreateMealTypeForm
            messId={messId}
            onCancel={() => setShowCreate(false)}
          />
        </div>
      )}

      {(mealTypes ?? []).length === 0 ? (
        <div className="rounded-xl border border-border bg-surface p-8 text-center">
          <UtensilsCrossed
            size={32}
            className="mx-auto mb-3 text-foreground-muted"
          />
          <p className="text-sm text-foreground-muted">
            {t("noMealTypesConfigured")}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {activeTypes.length > 0 && (
            <div>
              <h2 className="mb-3 text-sm font-mono font-medium uppercase tracking-[0.1em] text-foreground-muted">
                Active ({activeTypes.length})
              </h2>
              <div className="space-y-2">
                {activeTypes.map((mt) => (
                  <MealTypeRow key={mt.id} mealType={mt} messId={messId!} />
                ))}
              </div>
            </div>
          )}

          {inactiveTypes.length > 0 && (
            <div>
              <h2 className="mb-3 text-sm font-mono font-medium uppercase tracking-[0.1em] text-foreground-muted">
                Inactive ({inactiveTypes.length})
              </h2>
              <div className="space-y-2">
                {inactiveTypes.map((mt) => (
                  <MealTypeRow key={mt.id} mealType={mt} messId={messId!} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}
