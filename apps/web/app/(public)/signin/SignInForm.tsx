"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useSignin } from "../../hooks/use-auth";
import { GoogleSignInButton } from "../../components/GoogleSignInButton";
import { useTranslations } from "next-intl";
import { Spotlight } from "../../components/landing/Spotlight";
import { Eye, EyeOff, Loader2, AlertCircle } from "lucide-react";
import { formatZodError, signInSchema } from "@repo/shared";
import { translateFieldErrors } from "../../lib/error-text";
import { focusFirstInvalid } from "../../lib/field-errors";
import { FieldError, invalidInput } from "../../components/ui/field-error";

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

export default function SignInForm() {
  const t = useTranslations("auth");
  const searchParams = useSearchParams();
  // Pre-filled when coming from "email already registered" on sign-up.
  const [email, setEmail] = useState(() => searchParams.get("email") ?? "");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [oauthError, setOauthError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const router = useRouter();
  const signin = useSignin();

  useEffect(() => {
    const error = searchParams.get("error");
    if (error) {
      setOauthError(t(`oauth.${oauthErrorKey(error)}`));
      // Clean up URL
      router.replace("/signin");
    }
  }, [searchParams, router, t]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validation = signInSchema.safeParse({ email, password });

    if (!validation.success) {
      setFieldErrors(translateFieldErrors(formatZodError(validation.error)));
      focusFirstInvalid();
      return;
    }

    setFieldErrors({});
    signin.mutate(validation.data);
  };

  const clearFieldError = (field: string) => {
    setFieldErrors((prev) => {
      if (!prev[field]) return prev;
      const rest = { ...prev };
      delete rest[field];
      return rest;
    });
  };

  const inputClass =
    "w-full h-11 px-3.5 rounded-xl bg-surface-sunken border border-border text-foreground text-sm placeholder:text-foreground-muted/50 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 transition-colors";

  return (
    <div className="landing-dark landing relative isolate flex min-h-dvh items-center justify-center overflow-hidden bg-background px-4 py-6 text-foreground sm:py-8">
      <Spotlight size="page" />
      <div className="hero-rise relative w-full max-w-sm">
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

        <div className="overflow-hidden rounded-2xl border border-border bg-surface/90 p-6 backdrop-blur-sm sm:px-7">
          <h1 className="mb-1 text-center font-heading text-[1.75rem] font-extrabold leading-tight tracking-[-0.03em] text-foreground">
            {t("signin.title")}
          </h1>
          <p className="text-sm text-foreground-muted text-center mb-5">
            {t("signin.subtitle")}
          </p>

          <div className="space-y-4">
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="space-y-1">
                <label
                  htmlFor="email"
                  className="text-sm font-medium text-foreground-body"
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
              </div>

              <div className="space-y-1">
                <label
                  htmlFor="password"
                  className="text-sm font-medium text-foreground-body"
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
                    placeholder={t("signin.passwordPlaceholder")}
                    required
                    autoComplete="current-password"
                    aria-invalid={!!fieldErrors.password}
                    aria-describedby={
                      fieldErrors.password ? "password-error" : undefined
                    }
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
              </div>

              {(signin.error || oauthError) && (
                <p
                  role="alert"
                  className="text-sm text-destructive bg-destructive/10 border border-destructive/25 px-3 py-2 rounded-lg flex items-center gap-2"
                >
                  <AlertCircle size={16} className="shrink-0" />
                  {oauthError ||
                    signin.error?.message ||
                    t("signin.fallbackError")}
                </p>
              )}

              <button
                type="submit"
                disabled={signin.isPending}
                className="w-full h-11 bg-cta rounded-[9px] font-bold text-sm duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {signin.isPending ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    {t("signin.pending")}
                  </>
                ) : (
                  t("signin.submit")
                )}
              </button>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-surface px-2 text-foreground-muted">
                  {t("or")}
                </span>
              </div>
            </div>

            <GoogleSignInButton />
          </div>

          <p className="text-sm text-foreground-muted text-center mt-5">
            {t("signin.noAccount")}{" "}
            <Link
              href="/signup"
              className="text-primary hover:text-primary-hover font-medium transition-colors"
            >
              {t("signin.switch")}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
