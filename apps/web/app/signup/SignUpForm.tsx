"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useSignup } from "../hooks/use-auth";
import { GoogleSignInButton } from "../components/GoogleSignInButton";
import { Eye, EyeOff, Loader2, AlertCircle } from "lucide-react";
import { formatZodError, signUpSchema } from "@repo/shared";

function getErrorMessage(error: string): string {
  switch (error) {
    case "ACCOUNT_EXISTS":
      return "An account with this email already exists. Please sign in with your password.";
    case "NO_EMAIL":
      return "Google did not provide an email address. Please try again or use email sign up.";
    case "EMAIL_NOT_VERIFIED":
      return "Your Google email is not verified. Please verify it in your Google account settings.";
    case "google_auth_failed":
    default:
      return "Google sign up failed. Please try again.";
  }
}

export default function SignUpForm() {
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
      setOauthError(getErrorMessage(error));
      router.replace("/signup");
    }
  }, [searchParams, router]);

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
    <div className="min-h-dvh flex items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center justify-center gap-2.5 mb-10 focus:outline-none"
        >
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10 border border-primary/20">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-5.5 h-5.5 text-primary"
            >
              <path d="M12 2v20" />
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          </div>
          <span className="text-xl font-bold tracking-tight text-foreground font-heading">
            Mess<span className="text-primary">Mate</span>
          </span>
        </Link>

        <div className="bg-surface border border-foreground-muted/10 rounded-2xl p-8">
          <h1 className="text-2xl font-bold text-foreground font-heading text-center mb-1">
            Create your account
          </h1>
          <p className="text-sm text-foreground-muted text-center mb-8">
            Start managing your mess in minutes
          </p>

          <div className="space-y-4">
            <GoogleSignInButton />

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-foreground-muted/15" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-surface px-2 text-foreground-muted">
                  or
                </span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <label
                  htmlFor="name"
                  className="text-sm font-medium text-foreground"
                >
                  Full name
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  required
                  autoComplete="name"
                  className="w-full h-11 px-3.5 rounded-xl bg-background border border-foreground-muted/15 text-foreground text-sm placeholder:text-foreground-muted/50 focus:outline-none focus:border-primary/50 transition-colors"
                />
                {fieldErrors.name && (
                  <p className="text-xs text-destructive">{fieldErrors.name}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="email"
                  className="text-sm font-medium text-foreground"
                >
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  autoComplete="email"
                  className="w-full h-11 px-3.5 rounded-xl bg-background border border-foreground-muted/15 text-foreground text-sm placeholder:text-foreground-muted/50 focus:outline-none focus:border-primary/50 transition-colors"
                />
                {fieldErrors.email && (
                  <p className="text-xs text-destructive">{fieldErrors.email}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="password"
                  className="text-sm font-medium text-foreground"
                >
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min. 8 characters"
                    required
                    minLength={8}
                    autoComplete="new-password"
                    className="w-full h-11 px-3.5 pr-11 rounded-xl bg-background border border-foreground-muted/15 text-foreground text-sm placeholder:text-foreground-muted/50 focus:outline-none focus:border-primary/50 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground-muted hover:text-foreground transition-colors cursor-pointer"
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
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
                  Must be at least 8 characters
                </p>
              </div>

              {(signup.error || oauthError) && (
                <p className="text-sm text-red-500 bg-red-500/10 px-3 py-2 rounded-lg flex items-center gap-2">
                  <AlertCircle size={16} />
                  {oauthError ||
                    signup.error?.message ||
                    "Something went wrong. Please try again."}
                </p>
              )}

              <button
                type="submit"
                disabled={signup.isPending}
                className="w-full h-11 rounded-xl bg-primary text-background font-bold text-sm hover:bg-primary-hover active:scale-[0.98] transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {signup.isPending ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Creating account...
                  </>
                ) : (
                  "Create account"
                )}
              </button>
            </form>
          </div>

          <p className="text-sm text-foreground-muted text-center mt-6">
            Already have an account?{" "}
            <Link
              href="/signin"
              className="text-primary hover:text-primary-hover font-medium transition-colors"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
