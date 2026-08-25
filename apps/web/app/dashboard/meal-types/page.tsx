"use client";

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

function CreateMealTypeForm({
  messId,
  onCancel,
}: {
  messId: string;
  onCancel: () => void;
}) {
  const createMealType = useCreateMealType(messId);
  const [name, setName] = useState("");
  const [value, setValue] = useState("1");
  const [error, setError] = useState("");

  const handleSubmit = () => {
    setError("");
    const trimmed = name.trim();

    if (!trimmed) {
      setError("Name is required");
      return;
    }

    if (trimmed.length > 50) {
      setError("Name must be at most 50 characters");
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
        onError: (err) => {
          setError((err as Error)?.message || "Failed to create meal type");
        },
      },
    );
  };

  return (
    <div className="rounded-lg border border-foreground-muted/15 bg-background p-4">
      <div className="mb-3 flex items-center gap-2">
        <Plus size={16} className="text-primary" />
        <p className="text-sm font-semibold text-foreground">New Meal Type</p>
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
            placeholder="e.g. Breakfast, Lunch, Dinner"
            className={`w-full rounded-lg border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-foreground-muted focus:outline-none focus:ring-2 ${
              error
                ? "border-destructive focus:ring-destructive/40"
                : "border-foreground-muted/20 focus:ring-primary/40"
            }`}
            disabled={createMealType.isPending}
          />
        </div>
        <div className="w-full sm:w-28">
          <input
            type="number"
            step="0.1"
            min="0"
            max="10"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Value"
            className="w-full rounded-lg border border-foreground-muted/20 bg-surface px-3 py-2 text-sm text-foreground placeholder:text-foreground-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
            disabled={createMealType.isPending}
          />
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={createMealType.isPending}
            className="flex items-center gap-1.5 rounded-lg border border-foreground-muted/20 px-3 py-2 text-sm font-semibold text-foreground-muted transition-colors hover:bg-surface-raised disabled:opacity-60"
          >
            <X size={14} />
            Cancel
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
            Add
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
          : "border-foreground-muted/15 bg-surface"
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
              : "border-foreground-muted/30 bg-transparent"
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
            <label className="text-xs text-foreground-muted">Value:</label>
            <input
              type="number"
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
              className="w-20 rounded-md border border-foreground-muted/20 bg-background px-2 py-1 text-sm text-foreground focus:border-primary focus:outline-none"
            />
          </div>
        )}

        {confirmDelete ? (
          <div className="flex items-center gap-2">
            <span className="text-xs text-foreground-muted">Delete?</span>
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
              className="rounded bg-foreground-muted/10 px-2 py-1 text-xs font-semibold text-foreground-muted transition-colors hover:bg-foreground-muted/20"
            >
              No
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
  const { data: myMess, isLoading: messLoading } = useGetMyMess();
  const messId = myMess?.id;
  const isManager = myMess?.current_user_role === "MANAGER";

  const { data: mealTypes, isLoading: typesLoading } = useGetMealTypes(messId);

  const [showCreate, setShowCreate] = useState(false);

  const isLoading = messLoading || typesLoading;

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
          You need to be part of a mess to manage meal types.
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
          <p className="text-sm font-semibold uppercase tracking-wide text-primary">
            Meal Types
          </p>
          <h1 className="mt-2 text-3xl font-bold text-foreground">
            Configure Meal Types
          </h1>
          <p className="mt-1 text-sm text-foreground-muted">
            Define the meal types and their values for your mess. Active types
            appear in the daily meal entry grid.
          </p>
        </div>

        {isManager && !showCreate && (
          <button
            type="button"
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
          >
            <Plus size={14} />
            Add Meal Type
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
        <div className="rounded-xl border border-foreground-muted/15 bg-surface p-8 text-center">
          <UtensilsCrossed
            size={32}
            className="mx-auto mb-3 text-foreground-muted"
          />
          <p className="text-sm text-foreground-muted">
            No meal types configured yet. Add your first meal type to start
            recording meals.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {activeTypes.length > 0 && (
            <div>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-foreground-muted">
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
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-foreground-muted">
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
