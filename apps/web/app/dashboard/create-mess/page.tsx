"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSessionStore } from "../../store";
import { useGetMyMess, useCreateMess } from "../../hooks/use-messes";
import { Loader2 } from "lucide-react";
import { QueryErrorState } from "../../components/feedback/QueryErrorState";

function CreateMessForm() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [nameError, setNameError] = useState("");
  const router = useRouter();
  const createMess = useCreateMess();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setNameError("");

    if (!name.trim()) {
      setNameError("Mess name is required");
      return;
    }

    if (name.trim().length < 2) {
      setNameError("Name must be at least 2 characters");
      return;
    }

    createMess.mutate(
      {
        name: name.trim(),
        description: description.trim() || undefined,
      },
      {
        onSuccess: () => {
          router.push("/dashboard");
        },
      },
    );
  };

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6 md:mb-8">
        <p className="text-sm font-semibold uppercase tracking-wide text-primary">
          Mess Setup
        </p>
        <h1 className="mt-2 text-2xl font-bold text-foreground md:text-3xl">
          Create New Mess
        </h1>
        <p className="mt-2 text-sm text-foreground-muted md:text-base">
          You will become the manager of this mess. You can add meal types and
          manage members after creation.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 md:space-y-6">
        <div className="rounded-xl border border-foreground-muted/15 bg-surface p-4 md:p-6">
          <div className="space-y-4">
            <div>
              <label
                htmlFor="mess-name"
                className="mb-1.5 block text-sm font-medium text-foreground"
              >
                Mess Name <span className="text-destructive">*</span>
              </label>
              <input
                id="mess-name"
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setNameError("");
                }}
                placeholder="e.g. Bashundhara Mess"
                className={`w-full rounded-lg border bg-background px-4 py-2.5 text-foreground placeholder:text-foreground-muted focus:outline-none focus:ring-2 ${
                  nameError
                    ? "border-destructive focus:ring-destructive/40"
                    : "border-border focus:ring-primary/40"
                }`}
                disabled={createMess.isPending}
              />
              {nameError && (
                <p className="mt-1.5 text-sm text-destructive">{nameError}</p>
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
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of your mess..."
                rows={4}
                className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-foreground placeholder:text-foreground-muted focus:outline-none focus:ring-2 focus:ring-primary/40"
                disabled={createMess.isPending}
              />
            </div>
          </div>
        </div>

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-lg border border-border px-6 py-2.5 text-sm font-medium text-foreground-muted transition-colors hover:bg-surface-raised"
            disabled={createMess.isPending}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={createMess.isPending}
            className="rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
          >
            {createMess.isPending ? "Creating..." : "Create Mess"}
          </button>
        </div>
      </form>
    </div>
  );
}

function CreateMessContent() {
  const { isAuthenticated } = useSessionStore();
  const messQuery = useGetMyMess(isAuthenticated);
  const { data: myMess } = messQuery;
  const router = useRouter();

  if (!isAuthenticated) {
    return null;
  }

  if (messQuery.isPending) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  // Don't offer to create a mess when we couldn't check for an existing one.
  if (messQuery.isError && !myMess) {
    return (
      <div className="mx-auto max-w-2xl">
        <QueryErrorState
          error={messQuery.error}
          onRetry={messQuery.refetch}
          isRetrying={messQuery.isFetching}
          resource="your mess"
        />
      </div>
    );
  }

  if (myMess) {
    return (
      <div className="mx-auto max-w-2xl">
        <div className="rounded-xl border border-foreground-muted/15 bg-surface p-4 md:p-6">
          <p className="text-sm text-foreground-muted md:text-base">
            You already have an active mess:{" "}
            <span className="font-semibold text-foreground">{myMess.name}</span>
          </p>
          <button
            onClick={() => router.push("/dashboard")}
            className="mt-4 inline-flex rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return <CreateMessForm />;
}

export default function CreateMessPage() {
  return <CreateMessContent />;
}
