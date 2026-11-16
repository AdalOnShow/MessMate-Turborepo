"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useSignup } from "../hooks/use-auth";
import { GoogleSignInButton } from "../components/GoogleSignInButton";
import { useTranslations } from "next-intl";
import { Eye, EyeOff, Loader2, AlertCircle } from "lucide-react";
import { formatZodError, signUpSchema } from "@repo/shared";

const OAUTH_ERRORS = ["ACCOUNT_EXISTS", "NO_EMAIL", "EMAIL_NOT_VERIFIED"] as const;

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validation = signUpSchema.safeParse({ name, email, password });

    if (!validation.success) {
      setFieldErrors(formatZodError(validation.error));
      return;
    }

    setFieldErrors({});
    signup.mutate(validation.data);
  };

  return (
    <div className="relative min-h-dvh flex items-center justify-center bg-background px-4 py-12">
      <div
        className="bg-grid pointer-events-none absolute inset-0 opacity-50"
        aria-hidden
      />
      <div className="relative w-full max-w-sm">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center justify-center gap-2.5 mb-10 focus:outline-none"
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

        <div className="bg-surface border border-border rounded-2xl overflow-hidden p-8 shadow-panel">
          <div
            className="-mx-8 -mt-8 mb-8 flex items-center gap-3 border-b border-border bg-surface-raised px-4 py-2.5"
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
          <p className="text-sm text-foreground-muted text-center mb-8">
            {t("signup.subtitle")}
          </p>

          <div className="space-y-4">
            <GoogleSignInButton />

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

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1.5">
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
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t("namePlaceholder")}
                  required
                  autoComplete="name"
                  className="w-full h-11 px-3.5 rounded-xl bg-surface-sunken border border-border text-foreground text-sm placeholder:text-foreground-muted/50 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 transition-colors"
                />
                {fieldErrors.name && (
                  <p className="text-xs text-destructive">{fieldErrors.name}</p>
                )}
              </div>

              <div className="space-y-1.5">
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
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t("emailPlaceholder")}
                  required
                  autoComplete="email"
                  className="w-full h-11 px-3.5 rounded-xl bg-surface-sunken border border-border text-foreground text-sm placeholder:text-foreground-muted/50 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 transition-colors"
                />
                {fieldErrors.email && (
                  <p className="text-xs text-destructive">
                    {fieldErrors.email}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
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
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={t("signup.passwordPlaceholder")}
                    required
                    minLength={8}
                    autoComplete="new-password"
                    className="w-full h-11 px-3.5 pr-11 rounded-xl bg-surface-sunken border border-border text-foreground text-sm placeholder:text-foreground-muted/50 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 transition-colors"
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
                {fieldErrors.password && (
                  <p className="text-xs text-destructive">
                    {fieldErrors.password}
                  </p>
                )}
                <p className="text-xs text-foreground-muted/70">
                  {t("signup.passwordHint")}
                </p>
              </div>

              {(signup.error || oauthError) && (
                <p className="text-sm text-destructive bg-destructive/10 border border-destructive/25 px-3 py-2 rounded-lg flex items-center gap-2">
                  <AlertCircle size={16} />
                  {oauthError ||
                    signup.error?.message ||
                    t("signup.fallbackError")}
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
          </div>

          <p className="text-sm text-foreground-muted text-center mt-6">
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
