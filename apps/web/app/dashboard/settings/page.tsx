"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSessionStore } from "../../store";
import {
  useGetMyMess,
  useGetMealTypes,
  useUpdateMess,
  useUpdateMealType,
} from "../../hooks/use-messes";
import type { MealTypeInfo } from "../../hooks/use-messes";
import {
  Check,
  Loader2,
  Pencil,
  Settings,
  X,
} from "lucide-react";

function EditableMessInfo() {
  const { data: myMess } = useGetMyMess();
  const updateMess = useUpdateMess(myMess?.id);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [slug, setSlug] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (myMess) {
      setName(myMess.name);
      setDescription(myMess.description || "");
      setSlug(myMess.slug);
    }
  }, [myMess]);

  if (!myMess) return null;

  const handleEdit = () => {
    setName(myMess.name);
    setDescription(myMess.description || "");
    setSlug(myMess.slug);
    setErrors({});
    setEditing(true);
  };

  const handleCancel = () => {
    setEditing(false);
    setErrors({});
  };

  const handleSave = () => {
    const newErrors: Record<string, string> = {};

    if (!name.trim() || name.trim().length < 2) {
      newErrors.name = "Name must be at least 2 characters";
    }
    if (name.trim().length > 80) {
      newErrors.name = "Name must be at most 80 characters";
    }
    if (!slug.trim() || slug.trim().length < 2) {
      newErrors.slug = "Slug must be at least 2 characters";
    }
    if (slug.trim().length > 80) {
      newErrors.slug = "Slug must be at most 80 characters";
    }
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug.trim())) {
      newErrors.slug =
        "Slug must contain only lowercase letters, numbers, and hyphens";
    }
    if (
      description.trim().length > 0 &&
      description.trim().length > 300
    ) {
      newErrors.description = "Description must be at most 300 characters";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    updateMess.mutate(
      {
        name: name.trim(),
        slug: slug.trim(),
        description: description.trim() || null,
      },
      {
        onSuccess: () => setEditing(false),
      },
    );
  };

  if (editing) {
    return (
      <div className="space-y-4">
        <div>
          <label
            htmlFor="mess-name"
            className="mb-1.5 block text-sm font-medium text-foreground"
          >
            Mess Name
          </label>
          <input
            id="mess-name"
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setErrors((prev) => ({ ...prev, name: "" }));
            }}
            className={`w-full rounded-lg border bg-background px-4 py-2.5 text-foreground placeholder:text-foreground-muted focus:outline-none focus:ring-2 ${
              errors.name
                ? "border-destructive focus:ring-destructive/40"
                : "border-border focus:ring-primary/40"
            }`}
            disabled={updateMess.isPending}
          />
          {errors.name && (
            <p className="mt-1.5 text-sm text-destructive">{errors.name}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="mess-slug"
            className="mb-1.5 block text-sm font-medium text-foreground"
          >
            Slug
          </label>
          <input
            id="mess-slug"
            type="text"
            value={slug}
            onChange={(e) => {
              setSlug(e.target.value);
              setErrors((prev) => ({ ...prev, slug: "" }));
            }}
            className={`w-full rounded-lg border bg-background px-4 py-2.5 text-foreground placeholder:text-foreground-muted focus:outline-none focus:ring-2 ${
              errors.slug
                ? "border-destructive focus:ring-destructive/40"
                : "border-border focus:ring-primary/40"
            }`}
            disabled={updateMess.isPending}
          />
          {errors.slug && (
            <p className="mt-1.5 text-sm text-destructive">{errors.slug}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="mess-description"
            className="mb-1.5 block text-sm font-medium text-foreground"
          >
            Description{" "}
            <span className="text-foreground-muted">(optional)</span>
          </label>
          <textarea
            id="mess-description"
            value={description}
            onChange={(e) => {
              setDescription(e.target.value);
              setErrors((prev) => ({ ...prev, description: "" }));
            }}
            placeholder="Brief description of your mess..."
            rows={3}
            className={`w-full rounded-lg border bg-background px-4 py-2.5 text-foreground placeholder:text-foreground-muted focus:outline-none focus:ring-2 ${
              errors.description
                ? "border-destructive focus:ring-destructive/40"
                : "border-border focus:ring-primary/40"
            }`}
            disabled={updateMess.isPending}
          />
          {errors.description && (
            <p className="mt-1.5 text-sm text-destructive">
              {errors.description}
            </p>
          )}
        </div>

        {updateMess.isError && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3">
            <p className="text-sm text-destructive">
              {(updateMess.error as Error)?.message ||
                "Failed to update mess. Please try again."}
            </p>
          </div>
        )}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleCancel}
            disabled={updateMess.isPending}
            className="flex items-center gap-2 rounded-lg border border-foreground-muted/20 px-4 py-2 text-sm font-semibold text-foreground-muted transition-colors hover:bg-surface-raised disabled:opacity-60"
          >
            <X size={14} />
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={updateMess.isPending}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-hover disabled:opacity-60"
          >
            {updateMess.isPending ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Check size={14} />
                Save Changes
              </>
            )}
          </button>
        </div>

        {updateMess.isSuccess && (
          <p className="text-sm text-green-500">Mess updated successfully!</p>
        )}
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Settings size={18} className="text-primary" />
          <h2 className="text-lg font-semibold text-foreground">Mess Info</h2>
        </div>
        <button
          type="button"
          onClick={handleEdit}
          className="flex items-center gap-1.5 rounded-lg border border-foreground-muted/20 px-3 py-1.5 text-xs font-semibold text-foreground-muted transition-colors hover:bg-surface-raised"
        >
          <Pencil size={12} />
          Edit
        </button>
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
  );
}

function MealTypesConfig() {
  const { data: myMess } = useGetMyMess();
  const messId = myMess?.id;
  const { data: mealTypes, isLoading } = useGetMealTypes(messId);
  const updateMealType = useUpdateMealType(messId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
      </div>
    );
  }

  if (!mealTypes || mealTypes.length === 0) {
    return (
      <p className="text-sm text-foreground-muted">
        No meal types configured for this mess.
      </p>
    );
  }

  const handleToggleActive = (mt: MealTypeInfo) => {
    updateMealType.mutate({
      mealTypeId: mt.id,
      data: { is_active: !mt.is_active },
    });
  };

  const handleValueChange = (mt: MealTypeInfo, newValue: string) => {
    const num = parseFloat(newValue);
    if (isNaN(num)) return;
    updateMealType.mutate({
      mealTypeId: mt.id,
      data: { value: num },
    });
  };

  return (
    <div className="space-y-3">
      <p className="text-sm text-foreground-muted">
        Toggle meal types on/off and adjust their values. Active meal types are
        used when recording daily meals.
      </p>

      <div className="space-y-2">
        {mealTypes.map((mt) => (
          <div
            key={mt.id}
            className={`flex items-center justify-between rounded-lg border p-3 transition-colors ${
              mt.is_active
                ? "border-primary/30 bg-primary/5"
                : "border-foreground-muted/15 bg-surface"
            }`}
          >
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => handleToggleActive(mt)}
                disabled={updateMealType.isPending}
                className={`flex h-5 w-5 items-center justify-center rounded border transition-colors ${
                  mt.is_active
                    ? "border-primary bg-primary text-white"
                    : "border-foreground-muted/30 bg-transparent"
                }`}
              >
                {mt.is_active && <Check size={12} />}
              </button>
              <div>
                <p className="text-sm font-semibold text-foreground">
                  {mt.name}
                </p>
              </div>
            </div>
            {mt.is_active && (
              <div className="flex items-center gap-2">
                <label className="text-xs text-foreground-muted">Value:</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="10"
                  defaultValue={mt.value}
                  onBlur={(e) => handleValueChange(mt, e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleValueChange(mt, e.currentTarget.value);
                    }
                  }}
                  className="w-20 rounded-md border border-foreground-muted/20 bg-background px-2 py-1 text-sm text-foreground focus:border-primary focus:outline-none"
                />
              </div>
            )}
          </div>
        ))}
      </div>

      {updateMealType.isError && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3">
          <p className="text-sm text-destructive">
            {(updateMealType.error as Error)?.message ||
              "Failed to update meal type."}
          </p>
        </div>
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
          <EditableMessInfo />
        </div>

        <div className="rounded-xl border border-foreground-muted/15 bg-surface p-6">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-foreground">
              Meal Types
            </h2>
            <p className="mt-1 text-xs text-foreground-muted">
              Toggle active meal types and adjust values
            </p>
          </div>
          <MealTypesConfig />
        </div>
      </div>
    </>
  );
}

export default function SettingsPage() {
  return <SettingsContent />;
}
