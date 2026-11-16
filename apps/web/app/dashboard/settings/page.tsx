"use client";

import { useTranslations } from "next-intl";
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
import { Check, Loader2, Pencil, Settings, X } from "lucide-react";
import { QueryErrorState } from "../../components/feedback/QueryErrorState";

function EditableMessInfo() {
  const t = useTranslations("pages.settings");
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
      newErrors.slug = t("slugMustAtLeast");
    }
    if (slug.trim().length > 80) {
      newErrors.slug = t("slugMustAtMost");
    }
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug.trim())) {
      newErrors.slug =
        t("slugMustContainOnly");
    }
    if (description.trim().length > 0 && description.trim().length > 300) {
      newErrors.description = t("descriptionMustAtMost");
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
            {t("messName")}
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
            {t("slug")}
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
            {t("description")}{" "}
            <span className="text-foreground-muted">(optional)</span>
          </label>
          <textarea
            id="mess-description"
            value={description}
            onChange={(e) => {
              setDescription(e.target.value);
              setErrors((prev) => ({ ...prev, description: "" }));
            }}
            placeholder={t("briefDescriptionMess")}
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

        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleCancel}
            disabled={updateMess.isPending}
            className="flex items-center gap-2 rounded-lg border border-border-strong px-4 py-2 text-sm font-semibold text-foreground-muted transition-colors hover:bg-surface-raised disabled:opacity-60"
          >
            <X size={14} />
            {t("cancel")}
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
                {t("saving")}
              </>
            ) : (
              <>
                <Check size={14} />
                {t("saveChanges")}
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Settings size={18} className="text-primary" />
          <h2 className="text-lg font-semibold text-foreground">{t("messInfo")}</h2>
        </div>
        <button
          type="button"
          onClick={handleEdit}
          className="flex items-center gap-1.5 rounded-lg border border-border-strong px-3 py-1.5 text-xs font-semibold text-foreground-muted transition-colors hover:bg-surface-raised"
        >
          <Pencil size={12} />
          {t("edit")}
        </button>
      </div>
      <dl className="space-y-3 text-sm">
        <div>
          <dt className="text-foreground-muted">{t("name")}</dt>
          <dd className="font-medium text-foreground">{myMess.name}</dd>
        </div>
        <div>
          <dt className="text-foreground-muted">{t("slug")}</dt>
          <dd className="font-medium text-foreground">{myMess.slug}</dd>
        </div>
        <div>
          <dt className="text-foreground-muted">{t("description")}</dt>
          <dd className="font-medium text-foreground">
            {myMess.description || t("noDescription")}
          </dd>
        </div>
      </dl>
    </div>
  );
}

function MealTypesConfig() {
  const t = useTranslations("pages.settings");
  const { data: myMess } = useGetMyMess();
  const messId = myMess?.id;
  const mealTypesQuery = useGetMealTypes(messId);
  const { data: mealTypes, isLoading } = mealTypesQuery;
  const updateMealType = useUpdateMealType(messId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
      </div>
    );
  }

  if (mealTypesQuery.isError && !mealTypes) {
    return (
      <QueryErrorState
        compact
        error={mealTypesQuery.error}
        onRetry={mealTypesQuery.refetch}
        isRetrying={mealTypesQuery.isFetching}
        resource="meal types"
      />
    );
  }

  if (!mealTypes || mealTypes.length === 0) {
    return (
      <p className="text-sm text-foreground-muted">
        {t("noMealTypesConfigured")}
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
        {t("toggleMealTypesOff")}
      </p>

      <div className="space-y-2">
        {mealTypes.map((mt) => (
          <div
            key={mt.id}
            className={`flex items-center justify-between rounded-lg border p-3 transition-colors ${
              mt.is_active
                ? "border-primary/30 bg-primary/5"
                : "border-border bg-surface"
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
                    : "border-border-strong bg-transparent"
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
                <label className="text-xs text-foreground-muted">{t("value")}</label>
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
                  className="w-20 rounded-md border border-border-strong bg-surface-sunken px-2 py-1 text-sm text-foreground focus:border-primary focus:ring-2 focus:ring-primary/15 focus:outline-none"
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function SettingsContent() {
  const t = useTranslations("pages.settings");
  const { isAuthenticated } = useSessionStore();
  const router = useRouter();
  const messQuery = useGetMyMess(isAuthenticated);
  const { data: myMess, isLoading: messLoading } = messQuery;

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

  if (messQuery.isError && !myMess) {
    return (
      <QueryErrorState
        error={messQuery.error}
        onRetry={messQuery.refetch}
        isRetrying={messQuery.isFetching}
        resource="mess settings"
      />
    );
  }

  if (!myMess) {
    return (
      <p className="text-sm text-foreground-muted">
        {t("needPartMessAccess")}
      </p>
    );
  }

  return (
    <>
      <div className="mb-8">
        <p className="label-mono text-primary">{t("settings")}</p>
        <h1 className="mt-2 heading-tight text-3xl text-foreground">
          {t("messSettings")}
        </h1>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-surface p-6">
          <EditableMessInfo />
        </div>

        <div className="rounded-xl border border-border bg-surface p-6">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-foreground">
              {t("mealTypes")}
            </h2>
            <p className="mt-1 text-xs text-foreground-muted">
              {t("toggleActiveMealTypes")}
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
