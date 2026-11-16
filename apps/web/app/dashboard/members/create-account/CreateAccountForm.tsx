"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { startNavigationProgress } from "../../../lib/navigation-progress";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import { useSessionStore } from "../../../store";
import { useGetMyMess } from "../../../hooks/use-messes";
import { createMemberAccount } from "../../../actions/members";
import { toActionError, unwrap } from "../../../lib/action-result";
import { toast } from "../../../store/toast";
import { ErrorCode } from "@repo/shared";
import { FieldError, invalidInput } from "../../../components/ui/field-error";
import { OfflineHint } from "../../../components/ui/offline-hint";
import { useOnline } from "../../../hooks/use-online";
import { useFieldErrors } from "../../../lib/field-errors";

export default function CreateAccountForm() {
  const t = useTranslations("pages.membersCreateAccount_createAccountForm");
  const router = useRouter();
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const prefilledEmail = searchParams.get("email") || "";

  const { isAuthenticated } = useSessionStore();
  const { data: myMess } = useGetMyMess(isAuthenticated);

  const [name, setName] = useState("");
  const [email, setEmail] = useState(prefilledEmail);
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const fieldErrors = useFieldErrors();
  const errors = fieldErrors.errors;
  const online = useOnline();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!myMess?.id) return;

    setLoading(true);

    try {
      await unwrap(
        createMemberAccount({
          name,
          email,
          password,
          phone: phone || undefined,
          messId: myMess.id,
        }),
      );
      await queryClient.invalidateQueries();
      toast.success(t("memberAccountCreated"));
      startNavigationProgress();
      router.push("/dashboard/members");
    } catch (err: unknown) {
      const error = toActionError(err);
      if (error.code === ErrorCode.EMAIL_IN_USE) {
        fieldErrors.set({ email: error.message });
        return;
      }
      if (fieldErrors.fromServer(err)) return;
      toast.error(
        error.isServerError ? t("couldnTCreateAccount") : error.message,
        {
          description: error.isServerError ? error.message : undefined,
          reference: error.isServerError ? error.requestId : undefined,
        },
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg">
      <div className="mb-8">
        <p className="label-mono text-primary">{t("members")}</p>
        <h1 className="mt-2 heading-tight text-2xl text-foreground sm:text-3xl">
          {t("createMemberAccount")}
        </h1>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-4 rounded-xl border border-border bg-surface p-6"
      >
        <div>
          <label
            htmlFor="name"
            className="mb-1 block text-sm font-medium text-foreground"
          >
            {t("name")}
          </label>
          <input
            id="name"
            type="text"
            required
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              fieldErrors.clear("name");
            }}
            aria-invalid={!!errors.name}
            className={`w-full rounded-lg border border-border-strong bg-surface-sunken px-4 py-2.5 text-sm text-foreground placeholder:text-foreground-muted focus:border-primary focus:ring-2 focus:ring-primary/15 focus:outline-none ${errors.name ? invalidInput : ""}`}
            placeholder={t("enterFullName")}
          />
          <FieldError message={errors.name} />
        </div>

        <div>
          <label
            htmlFor="email"
            className="mb-1 block text-sm font-medium text-foreground"
          >
            {t("email")}
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              fieldErrors.clear("email");
            }}
            aria-invalid={!!errors.email}
            readOnly={false}
            className={`w-full rounded-lg border border-border-strong bg-surface-sunken px-4 py-2.5 text-sm text-foreground placeholder:text-foreground-muted focus:border-primary focus:ring-2 focus:ring-primary/15 focus:outline-none ${errors.email ? invalidInput : ""}`}
            placeholder={t("enterEmailAddress")}
          />
          <FieldError message={errors.email} />
        </div>

        <div>
          <label
            htmlFor="password"
            className="mb-1 block text-sm font-medium text-foreground"
          >
            {t("password")}
          </label>
          <input
            id="password"
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              fieldErrors.clear("password");
            }}
            aria-invalid={!!errors.password}
            className={`w-full rounded-lg border border-border-strong bg-surface-sunken px-4 py-2.5 text-sm text-foreground placeholder:text-foreground-muted focus:border-primary focus:ring-2 focus:ring-primary/15 focus:outline-none ${errors.password ? invalidInput : ""}`}
            placeholder={t("minimum8Characters")}
          />
          <FieldError message={errors.password} />
        </div>

        <div>
          <label
            htmlFor="phone"
            className="mb-1 block text-sm font-medium text-foreground"
          >
            {t("phone")}
            <span className="text-foreground-muted">(optional)</span>
          </label>
          <input
            id="phone"
            type="tel"
            value={phone}
            onChange={(e) => {
              setPhone(e.target.value);
              fieldErrors.clear("phone");
            }}
            aria-invalid={!!errors.phone}
            className={`w-full rounded-lg border border-border-strong bg-surface-sunken px-4 py-2.5 text-sm text-foreground placeholder:text-foreground-muted focus:border-primary focus:ring-2 focus:ring-primary/15 focus:outline-none ${errors.phone ? invalidInput : ""}`}
            placeholder={t("enterPhoneNumber")}
          />
          <FieldError message={errors.phone} />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Link
            href="/dashboard/members"
            className="rounded-lg border border-border-strong px-4 py-2 text-sm font-semibold text-foreground-muted transition-colors hover:bg-surface-raised"
          >
            {t("cancel")}
          </Link>
          <button
            type="submit"
            disabled={
              loading || !online || !myMess?.id || !name || !email || !password
            }
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? t("creating") : t("createAccount")}
          </button>
        </div>
        <OfflineHint />
      </form>
    </div>
  );
}
