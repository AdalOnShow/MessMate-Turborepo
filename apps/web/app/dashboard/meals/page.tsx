"use client";

import Link from "next/link";
import { useState, useMemo, useCallback } from "react";
import { useGetMyMess } from "../../hooks/use-messes";
import { useGetActiveMonth } from "../../hooks/use-months";
import {
  useGetMealTypes,
  useCreateMealType,
  useUpdateMealType,
  useDeleteMealType,
} from "../../hooks/use-messes";
import type { MealTypeInfo } from "../../hooks/use-messes";
import { useMembers } from "../../hooks/use-members";
import {
  useGetMealEntries,
  useBulkSaveMealEntries,
} from "../../hooks/use-meals";
import {
  BarChart3,
  Calendar,
  Check,
  ChevronDown,
  Loader2,
  Minus,
  Plus,
  Save,
  Settings,
  Trash2,
  X,
} from "lucide-react";

function formatDate(d: Date): string {
  return d.toISOString().split("T")[0] ?? "";
}

function MealCell({
  value,
  step,
  onIncrement,
  onDecrement,
  disabled,
}: {
  value: number;
  step: number;
  onIncrement: () => void;
  onDecrement: () => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={onDecrement}
        disabled={disabled || value <= 0}
        className="flex h-7 w-7 items-center justify-center rounded border border-foreground-muted/20 text-foreground-muted transition-colors hover:bg-surface-raised disabled:opacity-30"
      >
        <Minus size={14} />
      </button>
      <span className="w-8 text-center text-sm font-semibold text-foreground">
        {value % 1 === 0 ? value : value.toFixed(1)}
      </span>
      <button
        type="button"
        onClick={onIncrement}
        disabled={disabled || value >= 10}
        className="flex h-7 w-7 items-center justify-center rounded border border-foreground-muted/20 text-foreground-muted transition-colors hover:bg-surface-raised disabled:opacity-30"
      >
        <Plus size={14} />
      </button>
    </div>
  );
}

export default function MealsPage() {
  const { data: myMess, isLoading: messLoading } = useGetMyMess();
  const messId = myMess?.id;
  const isManager = myMess?.current_user_role === "MANAGER";

  const { data: activeMonth, isLoading: monthLoading } =
    useGetActiveMonth(messId);
  const monthId = activeMonth?.id;

  const { data: mealTypes, isLoading: typesLoading } = useGetMealTypes(messId);
  const activeMealTypes = useMemo(
    () => (mealTypes ?? []).filter((mt) => mt.is_active),
    [mealTypes],
  );

  const [selectedDate, setSelectedDate] = useState(() =>
    formatDate(new Date()),
  );

  const { data: entries, isLoading: entriesLoading } = useGetMealEntries(
    messId,
    monthId,
    selectedDate,
    selectedDate,
  );

  const { data: activeMembers, isLoading: membersLoading } = useMembers(
    messId,
    { status: "ACTIVE" },
  );

  const [localGrid, setLocalGrid] = useState<
    Record<string, Record<string, number>>
  >({});

  const entryMap = useMemo(() => {
    const map: Record<string, Record<string, number>> = {};
    if (!entries) return map;
    for (const entry of entries) {
      map[entry.member_id] = entry.meals;
    }
    return map;
  }, [entries]);

  const getValue = useCallback(
    (memberId: string, mealTypeId: string): number => {
      if (localGrid[memberId]?.[mealTypeId] !== undefined) {
        return localGrid[memberId][mealTypeId];
      }
      return entryMap[memberId]?.[mealTypeId] ?? 0;
    },
    [localGrid, entryMap],
  );

  const updateValue = useCallback(
    (memberId: string, mealTypeId: string, delta: number) => {
      setLocalGrid((prev) => {
        const current = prev[memberId]?.[mealTypeId] ?? 0;
        const newVal = Math.max(0, Math.min(10, current + delta));
        return {
          ...prev,
          [memberId]: {
            ...prev[memberId],
            [mealTypeId]: newVal,
          },
        };
      });
    },
    [],
  );

  const hasChanges = useMemo(() => {
    return Object.keys(localGrid).length > 0;
  }, [localGrid]);

  const saveMutation = useBulkSaveMealEntries(messId, monthId);

  const handleSave = () => {
    const entries = Object.entries(localGrid).map(([memberId, meals]) => ({
      memberId,
      date: new Date(selectedDate).toISOString(),
      meals,
    }));

    if (entries.length === 0) return;

    saveMutation.mutate(
      { entries },
      {
        onSuccess: () => {
          setLocalGrid({});
        },
      },
    );
  };

  const isLoading =
    messLoading || monthLoading || typesLoading || membersLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!activeMonth) {
    return (
      <>
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-wide text-primary">
            Meals
          </p>
          <h1 className="mt-2 text-3xl font-bold text-foreground">
            Meal Management
          </h1>
        </div>
        <div className="rounded-xl border border-foreground-muted/15 bg-surface p-8 text-center">
          <p className="text-sm text-foreground-muted">
            No active month. Start a month from the dashboard to record meals.
          </p>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-primary">
            Meals
          </p>
          <h1 className="mt-2 text-3xl font-bold text-foreground">
            {activeMonth.title}
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Calendar size={16} className="text-foreground-muted" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => {
                setSelectedDate(e.target.value);
                setLocalGrid({});
              }}
              className="rounded-lg border border-foreground-muted/20 bg-surface px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
            />
          </div>
          <Link
            href="/dashboard/meals/reports"
            className="flex items-center gap-1.5 rounded-lg border border-foreground-muted/20 px-3 py-2 text-xs font-semibold text-foreground-muted transition-colors hover:bg-surface-raised"
          >
            <BarChart3 size={14} />
            Reports
          </Link>
        </div>
      </div>

      {isManager && (
        <div className="mb-4 flex items-center gap-3">
          <button
            type="button"
            onClick={handleSave}
            disabled={!hasChanges || saveMutation.isPending}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-hover disabled:opacity-60"
          >
            {saveMutation.isPending ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save size={14} />
                Save Today&apos;s Meals
              </>
            )}
          </button>
          {hasChanges && (
            <span className="text-xs text-foreground-muted">
              Unsaved changes
            </span>
          )}
          {saveMutation.isSuccess && (
            <span className="text-xs text-green-500">Saved!</span>
          )}
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-foreground-muted/15 bg-surface">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-foreground-muted/10">
              <th className="px-4 py-3 text-left text-xs font-semibold text-foreground-muted">
                Member
              </th>
              {activeMealTypes.map((mt) => (
                <th
                  key={mt.id}
                  className="px-4 py-3 text-center text-xs font-semibold text-foreground-muted"
                >
                  {mt.name}
                  <span className="ml-1 text-foreground-muted/50">
                    ({mt.value})
                  </span>
                </th>
              ))}
              <th className="px-4 py-3 text-center text-xs font-semibold text-foreground-muted">
                Total
              </th>
            </tr>
          </thead>
          <tbody>
            {entriesLoading ? (
              <tr>
                <td
                  colSpan={activeMealTypes.length + 2}
                  className="px-4 py-8 text-center"
                >
                  <Loader2 className="mx-auto h-5 w-5 animate-spin text-primary" />
                </td>
              </tr>
            ) : activeMealTypes.length === 0 ? (
              <tr>
                <td
                  colSpan={activeMealTypes.length + 2}
                  className="px-4 py-12 text-center"
                >
                  <p className="text-sm text-foreground-muted">
                    No active meal types. Add meal types below to start
                    recording meals.
                  </p>
                </td>
              </tr>
            ) : (activeMembers ?? []).length === 0 ? (
              <tr>
                <td
                  colSpan={activeMealTypes.length + 2}
                  className="px-4 py-8 text-center text-sm text-foreground-muted"
                >
                  No members in this mess yet.
                </td>
              </tr>
            ) : (
              (activeMembers ?? []).map((member: any) => {
                let rowTotal = 0;
                return (
                  <tr
                    key={member.id}
                    className="border-b border-foreground-muted/5"
                  >
                    <td className="px-4 py-3">
                      <p className="font-medium text-foreground">
                        {member.user.name}
                      </p>
                      <p className="text-xs text-foreground-muted">
                        {member.user.email}
                      </p>
                    </td>
                    {activeMealTypes.map((mt) => {
                      const val = getValue(member.id, mt.id);
                      rowTotal += val;
                      return (
                        <td key={mt.id} className="px-4 py-3 text-center">
                          <div className="flex justify-center">
                            <MealCell
                              value={val}
                              step={mt.value || 1}
                              onIncrement={() =>
                                updateValue(member.id, mt.id, mt.value || 1)
                              }
                              onDecrement={() =>
                                updateValue(member.id, mt.id, -(mt.value || 1))
                              }
                              disabled={!isManager}
                            />
                          </div>
                        </td>
                      );
                    })}
                    <td className="px-4 py-3 text-center">
                      <span className="font-semibold text-foreground">
                        {rowTotal % 1 === 0 ? rowTotal : rowTotal.toFixed(1)}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {isManager && messId && (
        <MealTypeManager messId={messId} mealTypes={mealTypes ?? []} />
      )}
    </>
  );
}

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

function MealTypeManager({
  messId,
  mealTypes,
}: {
  messId: string;
  mealTypes: MealTypeInfo[];
}) {
  const [showCreate, setShowCreate] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const activeTypes = mealTypes.filter((mt) => mt.is_active);
  const inactiveTypes = mealTypes.filter((mt) => !mt.is_active);

  return (
    <div className="mt-8 rounded-xl border border-foreground-muted/15 bg-surface">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between px-5 py-4 text-left"
      >
        <div className="flex items-center gap-3">
          <Settings size={18} className="text-foreground-muted" />
          <div>
            <p className="text-sm font-semibold text-foreground">
              Meal Type Settings
            </p>
            <p className="text-xs text-foreground-muted">
              {activeTypes.length} active, {inactiveTypes.length} inactive
            </p>
          </div>
        </div>
        <ChevronDown
          size={16}
          className={`text-foreground-muted transition-transform ${expanded ? "rotate-180" : ""}`}
        />
      </button>

      {expanded && (
        <div className="border-t border-foreground-muted/10 px-5 py-4">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-xs text-foreground-muted">
              Configure meal types for your mess.
            </p>
            {!showCreate && (
              <button
                type="button"
                onClick={() => setShowCreate(true)}
                className="flex items-center gap-1.5 rounded-lg border border-foreground-muted/20 px-3 py-1.5 text-xs font-semibold text-foreground-muted transition-colors hover:bg-surface-raised"
              >
                <Plus size={12} />
                Add Type
              </button>
            )}
          </div>

          {showCreate && (
            <div className="mb-4">
              <CreateMealTypeForm
                messId={messId}
                onCancel={() => setShowCreate(false)}
              />
            </div>
          )}

          {mealTypes.length === 0 ? (
            <div className="rounded-lg border border-dashed border-foreground-muted/20 p-6 text-center">
              <p className="text-sm text-foreground-muted">
                No meal types configured. Add your first meal type to start
                recording meals.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {activeTypes.map((mt) => (
                <MealTypeRow key={mt.id} mealType={mt} messId={messId} />
              ))}
              {inactiveTypes.map((mt) => (
                <MealTypeRow key={mt.id} mealType={mt} messId={messId} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
