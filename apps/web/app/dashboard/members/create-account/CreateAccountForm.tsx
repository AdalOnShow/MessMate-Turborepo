"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import { useSessionStore } from "../../../store";
import { useGetMyMess } from "../../../hooks/use-messes";
import { createMemberAccount } from "../../../actions/members";
import { toActionError, unwrap } from "../../../lib/action-result";
import { toast } from "../../../store/toast";

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
      router.push("/dashboard/members");
    } catch (err: unknown) {
      const error = toActionError(err);
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
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border border-border-strong bg-surface-sunken px-4 py-2.5 text-sm text-foreground placeholder:text-foreground-muted focus:border-primary focus:ring-2 focus:ring-primary/15 focus:outline-none"
            placeholder={t("enterFullName")}
          />
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
            onChange={(e) => setEmail(e.target.value)}
            readOnly={false}
            className="w-full rounded-lg border border-border-strong bg-surface-sunken px-4 py-2.5 text-sm text-foreground placeholder:text-foreground-muted focus:border-primary focus:ring-2 focus:ring-primary/15 focus:outline-none"
            placeholder={t("enterEmailAddress")}
          />
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
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-border-strong bg-surface-sunken px-4 py-2.5 text-sm text-foreground placeholder:text-foreground-muted focus:border-primary focus:ring-2 focus:ring-primary/15 focus:outline-none"
            placeholder={t("minimum8Characters")}
          />
        </div>

        <div>
          <label
            htmlFor="phone"
            className="mb-1 block text-sm font-medium text-foreground"
          >
            {t("phone")}<span className="text-foreground-muted">(optional)</span>
          </label>
          <input
            id="phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full rounded-lg border border-border-strong bg-surface-sunken px-4 py-2.5 text-sm text-foreground placeholder:text-foreground-muted focus:border-primary focus:ring-2 focus:ring-primary/15 focus:outline-none"
            placeholder={t("enterPhoneNumber")}
          />
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
            disabled={loading || !myMess?.id || !name || !email || !password}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? t("creating") : t("createAccount")}
          </button>
        </div>
      </form>
    </div>
  );
}
