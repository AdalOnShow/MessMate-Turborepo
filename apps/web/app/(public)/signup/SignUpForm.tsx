"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useSignup } from "../../hooks/use-auth";
import { GoogleSignInButton } from "../../components/GoogleSignInButton";
import { useTranslations } from "next-intl";
import { Eye, EyeOff, Loader2, AlertCircle } from "lucide-react";
import { ErrorCode, formatZodError, signUpSchema } from "@repo/shared";
import { translateFieldErrors } from "../../lib/error-text";
import { fieldErrorsFrom, focusFirstInvalid } from "../../lib/field-errors";
import { toActionError } from "../../lib/action-result";
import { FieldError, invalidInput } from "../../components/ui/field-error";
import { PasswordChecklist } from "../../components/ui/password-checklist";

const OAUTH_ERRORS = [
  "ACCOUNT_EXISTS",
  "NO_EMAIL",
  "EMAIL_NOT_VERIFIED",
] as const;

function oauthErrorKey(error: string) {
  return (OAUTH_ERRORS as readonly string[]).includes(error)
    ? (error as (typeof OAUTH_ERRORS)[number])
    : "failed";
}

export default function SignUpForm() {
  const t = useTranslations("auth");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [oauthError, setOauthError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const router = useRouter();
  const searchParams = useSearchParams();
  const signup = useSignup();

  useEffect(() => {
    const error = searchParams.get("error");
    if (error) {
      setOauthError(t(`oauth.${oauthErrorKey(error)}`));
      router.replace("/signup");
    }
  }, [searchParams, router, t]);

  const showFieldErrors = (errors: Record<string, string>) => {
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) focusFirstInvalid();
  };

  const clearFieldError = (field: string) => {
    setFieldErrors((prev) => {
      if (!prev[field]) return prev;
      const rest = { ...prev };
      delete rest[field];
      return rest;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setOauthError(null);
    const validation = signUpSchema.safeParse({ name, email, password });

    if (!validation.success) {
      showFieldErrors(translateFieldErrors(formatZodError(validation.error)));
      return;
    }

    setFieldErrors({});
    signup.mutate(validation.data, {
      onError: (err) => {
        const error = toActionError(err);
        // "Already registered" belongs under the email box, with a way out.
        if (error.code === ErrorCode.EMAIL_IN_USE) {
          showFieldErrors({ email: error.message });
          return;
        }
        // Server-side field problems go next to their fields.
        showFieldErrors(fieldErrorsFrom(err));
      },
    });
  };

  const signupError = signup.error ? toActionError(signup.error) : null;
  const emailInUse = signupError?.code === ErrorCode.EMAIL_IN_USE;
  // Shown in the box under the form only when no field explains it.
  const formError =
    oauthError ??
    (signupError && !emailInUse && Object.keys(fieldErrors).length === 0
      ? signupError.message || t("signup.fallbackError")
      : null);
  const inputClass =
    "w-full h-11 px-3.5 rounded-xl bg-surface-sunken border border-border text-foreground text-sm placeholder:text-foreground-muted/50 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 transition-colors";

  return (
    <div className="relative min-h-dvh flex items-center justify-center bg-background px-4 py-6 sm:py-8">
      <div className="relative w-full max-w-sm">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center justify-center gap-2.5 mb-5 focus:outline-none"
        >
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-surface-raised border border-border overflow-hidden">
            <Image
              src="/messmate-icon.png"
              alt="MessMate"
              width={460}
              height={400}
              className="w-6 h-6 object-contain"
            />
          </div>
          <span className="text-xl font-extrabold tracking-[-0.03em] text-foreground">
            Mess<span className="text-primary">Mate</span>
          </span>
        </Link>

        <div className="bg-surface border border-border rounded-2xl overflow-hidden p-6 sm:px-7 shadow-panel">
          <div
            className="-mx-6 -mt-6 mb-5 sm:-mx-7 flex items-center gap-3 border-b border-border bg-surface-raised px-4 py-2.5"
            aria-hidden
          >
            <div className="flex gap-1.5">
              <span className="size-2.5 rounded-full bg-destructive" />
              <span className="size-2.5 rounded-full bg-accent-warm" />
              <span className="size-2.5 rounded-full bg-success" />
            </div>
            <span className="font-mono text-[11px] text-foreground-muted">
              messmate — auth/sign-up
            </span>
          </div>
          <h1 className="heading-tight text-2xl text-foreground font-heading text-center mb-1">
            {t("signup.title")}
          </h1>
          <p className="text-sm text-foreground-muted text-center mb-5">
            {t("signup.subtitle")}
          </p>

          <div className="space-y-4">
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="space-y-1">
                <label
                  htmlFor="name"
                  className="label-mono text-[10px] text-foreground-muted"
                >
                  {t("fullName")}
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    clearFieldError("name");
                  }}
                  placeholder={t("namePlaceholder")}
                  required
                  autoComplete="name"
                  aria-invalid={!!fieldErrors.name}
                  aria-describedby={fieldErrors.name ? "name-error" : undefined}
                  className={`${inputClass} ${fieldErrors.name ? invalidInput : ""}`}
                />
                <FieldError id="name-error" message={fieldErrors.name} />
              </div>

              <div className="space-y-1">
                <label
                  htmlFor="email"
                  className="label-mono text-[10px] text-foreground-muted"
                >
                  {t("email")}
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    clearFieldError("email");
                  }}
                  placeholder={t("emailPlaceholder")}
                  required
                  autoComplete="email"
                  aria-invalid={!!fieldErrors.email}
                  aria-describedby={
                    fieldErrors.email ? "email-error" : undefined
                  }
                  className={`${inputClass} ${fieldErrors.email ? invalidInput : ""}`}
                />
                <FieldError id="email-error" message={fieldErrors.email} />
                {emailInUse && fieldErrors.email && (
                  <Link
                    href={`/signin?email=${encodeURIComponent(email.trim())}`}
                    className="inline-block text-sm font-medium text-primary hover:text-primary-hover transition-colors"
                  >
                    {t("signup.emailInUseAction")} →
                  </Link>
                )}
              </div>

              <div className="space-y-1">
                <label
                  htmlFor="password"
                  className="label-mono text-[10px] text-foreground-muted"
                >
                  {t("password")}
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      clearFieldError("password");
                    }}
                    placeholder={t("signup.passwordPlaceholder")}
                    required
                    minLength={8}
                    autoComplete="new-password"
                    aria-invalid={!!fieldErrors.password}
                    aria-describedby="password-error password-rules"
                    className={`${inputClass} pr-11 ${fieldErrors.password ? invalidInput : ""}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground-muted hover:text-foreground transition-colors cursor-pointer"
                    aria-label={
                      showPassword ? t("hidePassword") : t("showPassword")
                    }
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                <FieldError
                  id="password-error"
                  message={fieldErrors.password}
                />
                <PasswordChecklist id="password-rules" password={password} />
              </div>

              {formError && (
                <p
                  role="alert"
                  className="text-sm text-destructive bg-destructive/10 border border-destructive/25 px-3 py-2 rounded-lg flex items-center gap-2"
                >
                  <AlertCircle size={16} className="shrink-0" />
                  {formError}
                </p>
              )}

              <button
                type="submit"
                disabled={signup.isPending}
                className="w-full h-11 bg-cta rounded-[9px] font-bold text-sm duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {signup.isPending ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    {t("signup.pending")}
                  </>
                ) : (
                  t("signup.submit")
                )}
              </button>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center font-mono text-[10px] uppercase tracking-[0.12em]">
                <span className="bg-surface px-2 text-foreground-muted">
                  {t("or")}
                </span>
              </div>
            </div>

            <GoogleSignInButton />
          </div>

          <p className="text-sm text-foreground-muted text-center mt-5">
            {t("signup.haveAccount")}{" "}
            <Link
              href="/signin"
              className="text-primary hover:text-primary-hover font-medium transition-colors"
            >
              {t("signup.switch")}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
