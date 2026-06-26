"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useSessionStore } from "../../../store";
import { useGetMyMess } from "../../../hooks/use-messes";
import { createMemberAccount } from "../../../actions/members";
import { Sidebar } from "../../../components/dashboard/Sidebar";
import { BottomNav } from "../../../components/dashboard/BottomNav";

export default function CreateAccountPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const prefilledEmail = searchParams.get("email") || "";

  const { isAuthenticated } = useSessionStore();
  const { data: myMess } = useGetMyMess(isAuthenticated);

  const [name, setName] = useState("");
  const [email, setEmail] = useState(prefilledEmail);
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!myMess?.id) return;

    setLoading(true);
    setError(null);

    try {
      await createMemberAccount({
        name,
        email,
        password,
        phone: phone || undefined,
        messId: myMess.id,
      });
      router.push("/dashboard/members");
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to create account";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background pb-20 lg:ml-72 lg:pb-8">
      <Sidebar />
      <main className="px-4 py-8 lg:px-8">
        <div className="mx-auto max-w-lg">
          <div className="mb-8">
            <p className="text-sm font-semibold uppercase tracking-wide text-primary">
              Members
            </p>
            <h1 className="mt-2 text-2xl font-bold text-foreground sm:text-3xl">
              Create Member Account
            </h1>
          </div>

          <form
            onSubmit={handleSubmit}
            className="space-y-4 rounded-xl border border-foreground-muted/15 bg-surface p-6"
          >
            {error && (
              <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-500">
                {error}
              </div>
            )}

            <div>
              <label
                htmlFor="name"
                className="mb-1 block text-sm font-medium text-foreground"
              >
                Name
              </label>
              <input
                id="name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-foreground-muted/20 bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-foreground-muted focus:border-primary focus:outline-none"
                placeholder="Enter full name"
              />
            </div>

            <div>
              <label
                htmlFor="email"
                className="mb-1 block text-sm font-medium text-foreground"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                readOnly={false}
                className="w-full rounded-lg border border-foreground-muted/20 bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-foreground-muted focus:border-primary focus:outline-none"
                placeholder="Enter email address"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-1 block text-sm font-medium text-foreground"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-foreground-muted/20 bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-foreground-muted focus:border-primary focus:outline-none"
                placeholder="Minimum 6 characters"
              />
            </div>

            <div>
              <label
                htmlFor="phone"
                className="mb-1 block text-sm font-medium text-foreground"
              >
                Phone <span className="text-foreground-muted">(optional)</span>
              </label>
              <input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-lg border border-foreground-muted/20 bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-foreground-muted focus:border-primary focus:outline-none"
                placeholder="Enter phone number"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Link
                href="/dashboard/members"
                className="rounded-lg border border-foreground-muted/20 px-4 py-2 text-sm font-semibold text-foreground-muted transition-colors hover:bg-surface-raised"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={loading || !name || !email || !password}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Creating..." : "Create Account"}
              </button>
            </div>
          </form>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
