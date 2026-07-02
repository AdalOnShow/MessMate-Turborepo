"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSessionStore } from "../../store";
import {
  useGetMyMess,
  useGetDefaultMeals,
  useGetMealTypes,
  useUpdateDefaultMeals,
} from "../../hooks/use-messes";
import { Check, Loader2, Settings } from "lucide-react";

function DefaultMealsConfig() {
  const { data: myMess } = useGetMyMess();
  const messId = myMess?.id;
  const { data: mealTypes, isLoading: typesLoading } = useGetMealTypes(messId);
  const { data: defaults, isLoading: defaultsLoading } =
    useGetDefaultMeals(messId);
  const updateDefaults = useUpdateDefaultMeals(messId);

  const [selected, setSelected] = useState<
    Record<string, { enabled: boolean; value: number }>
  >({});

  useEffect(() => {
    if (mealTypes && defaults) {
      const map: Record<string, { enabled: boolean; value: number }> = {};
      for (const mt of mealTypes) {
        const defaultItem = defaults.find((d) => d.meal_type_id === mt.id);
        map[mt.id] = {
          enabled: !!defaultItem,
          value: defaultItem?.meal_value ?? mt.value,
        };
      }
      setSelected(map);
    }
  }, [mealTypes, defaults]);

  const handleToggle = (mealTypeId: string) => {
    setSelected((prev) => {
      const current = prev[mealTypeId];
      return {
        ...prev,
        [mealTypeId]: {
          enabled: current ? !current.enabled : true,
          value: current?.value ?? 1,
        },
      };
    });
  };

  const handleValueChange = (mealTypeId: string, value: string) => {
    const num = parseFloat(value);
    if (isNaN(num)) return;
    setSelected((prev) => {
      const current = prev[mealTypeId];
      return {
        ...prev,
        [mealTypeId]: {
          enabled: current?.enabled ?? true,
          value: num,
        },
      };
    });
  };

  const handleSave = () => {
    const meals = Object.entries(selected)
      .filter(([, v]) => v.enabled)
      .map(([mealTypeId, v]) => ({
        mealTypeId,
        mealValue: v.value,
      }));
    updateDefaults.mutate({ meals });
  };

  if (typesLoading || defaultsLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
      </div>
    );
  }

  if (!mealTypes || mealTypes.length === 0) {
    return (
      <p className="text-sm text-foreground-muted">
        No meal types configured yet. Add meal types in your mess settings
        first.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-foreground-muted">
        Select which meal types are included in the daily default. When
        registering meals, the form will auto-fill with these selections.
      </p>

      <div className="space-y-2">
        {mealTypes.map((mt) => {
          const state = selected[mt.id];
          if (!state) return null;
          return (
            <div
              key={mt.id}
              className={`flex items-center justify-between rounded-lg border p-3 transition-colors ${
                state.enabled
                  ? "border-primary/30 bg-primary/5"
                  : "border-foreground-muted/15 bg-surface"
              }`}
            >
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => handleToggle(mt.id)}
                  className={`flex h-5 w-5 items-center justify-center rounded border transition-colors ${
                    state.enabled
                      ? "border-primary bg-primary text-white"
                      : "border-foreground-muted/30 bg-transparent"
                  }`}
                >
                  {state.enabled && <Check size={12} />}
                </button>
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {mt.name}
                  </p>
                  <p className="text-xs text-foreground-muted">
                    Base value: {mt.value}
                  </p>
                </div>
              </div>
              {state.enabled && (
                <div className="flex items-center gap-2">
                  <label className="text-xs text-foreground-muted">
                    Value:
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="10"
                    value={state.value}
                    onChange={(e) => handleValueChange(mt.id, e.target.value)}
                    className="w-20 rounded-md border border-foreground-muted/20 bg-background px-2 py-1 text-sm text-foreground focus:border-primary focus:outline-none"
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      <button
        type="button"
        onClick={handleSave}
        disabled={updateDefaults.isPending}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover disabled:opacity-60"
      >
        {updateDefaults.isPending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Saving...
          </>
        ) : (
          "Save Default Meals"
        )}
      </button>

      {updateDefaults.isSuccess && (
        <p className="text-center text-sm text-green-500">
          Default meals updated successfully!
        </p>
      )}
    </div>
  );
}

function SettingsContent() {
  const { isAuthenticated } = useSessionStore();
  const router = useRouter();
  const { data: myMess, isLoading: messLoading } =
    useGetMyMess(isAuthenticated);

  useEffect(() => {
    if (!messLoading && myMess && myMess.current_user_role !== "MANAGER") {
      router.push("/dashboard");
    }
  }, [messLoading, myMess, router]);

  if (messLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!myMess) {
    return (
      <p className="text-sm text-foreground-muted">
        You need to be part of a mess to access settings.
      </p>
    );
  }

  return (
    <>
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-wide text-primary">
          Settings
        </p>
        <h1 className="mt-2 text-3xl font-bold text-foreground">
          Mess Settings
        </h1>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-foreground-muted/15 bg-surface p-6">
          <div className="mb-4 flex items-center gap-2">
            <Settings size={18} className="text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Mess Info</h2>
          </div>
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="text-foreground-muted">Name</dt>
              <dd className="font-medium text-foreground">{myMess.name}</dd>
            </div>
            <div>
              <dt className="text-foreground-muted">Slug</dt>
              <dd className="font-medium text-foreground">{myMess.slug}</dd>
            </div>
            <div>
              <dt className="text-foreground-muted">Description</dt>
              <dd className="font-medium text-foreground">
                {myMess.description || "No description"}
              </dd>
            </div>
          </dl>
        </div>

        <div className="rounded-xl border border-foreground-muted/15 bg-surface p-6">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-foreground">
              Default Meals
            </h2>
            <p className="mt-1 text-xs text-foreground-muted">
              Configure which meals are included by default each day
            </p>
          </div>
          <DefaultMealsConfig />
        </div>
      </div>
    </>
  );
}

export default function SettingsPage() {
  return <SettingsContent />;
}
