"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSessionStore } from "../store";
import { AuthInitializer } from "../components/AuthInitializer";
import { Sidebar } from "../components/dashboard/Sidebar";
import { BottomNav } from "../components/dashboard/BottomNav";
import { useGetMyMess } from "../hooks/use-messes";

function DashboardContent() {
  const { user, isAuthenticated } = useSessionStore();
  const router = useRouter();

  const { data: myMess, isLoading: messLoading } =
    useGetMyMess(isAuthenticated);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/signin");
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background pb-20 lg:ml-72 lg:pb-8">
      <Sidebar />
      <main className="px-4 py-8 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8">
            <p className="text-sm font-semibold uppercase tracking-wide text-primary">
              Dashboard
            </p>
            <h1 className="mt-2 text-3xl font-bold text-foreground">
              Welcome back{user?.name ? `, ${user.name}` : ""}
            </h1>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="rounded-xl border border-foreground-muted/15 bg-surface p-6">
              <h2 className="mb-4 text-xl font-semibold text-foreground">
                User Profile
              </h2>
              <dl className="space-y-3 text-sm">
                <div>
                  <dt className="text-foreground-muted">Name</dt>
                  <dd className="font-medium text-foreground">{user?.name}</dd>
                </div>
                <div>
                  <dt className="text-foreground-muted">Email</dt>
                  <dd className="font-medium text-foreground">{user?.email}</dd>
                </div>
                <div>
                  <dt className="text-foreground-muted">Phone</dt>
                  <dd className="font-medium text-foreground">
                    {user?.phone || "Not added"}
                  </dd>
                </div>
              </dl>
            </div>

            <div className="rounded-xl border border-foreground-muted/15 bg-surface p-6">
              <h2 className="mb-4 text-xl font-semibold text-foreground">
                Quick Actions
              </h2>

              {messLoading ? (
                <p className="text-sm text-foreground-muted">Loading...</p>
              ) : myMess ? (
                <div className="space-y-4">
                  <div className="rounded-lg border border-primary/30 bg-primary/10 p-3">
                    <p className="text-xs font-medium uppercase tracking-wide text-primary">
                      Current Mess
                    </p>
                    <p className="mt-1 font-semibold text-foreground">
                      {myMess.name}
                    </p>
                    <p className="mt-0.5 text-xs text-foreground-muted">
                      You are a manager
                    </p>
                  </div>
                  <ul className="space-y-2 text-sm text-foreground-muted">
                    <li>Manage meals</li>
                    <li>Check balances</li>
                    <li>View reports</li>
                    <li>Manage members</li>
                  </ul>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-foreground-muted">
                    Create a mess to get started.
                  </p>
                  <Link
                    href="/dashboard/create-mess"
                    className="flex w-full items-center justify-center rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
                  >
                    Create Mess
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}

export default function DashboardPage() {
  return (
    <AuthInitializer>
      <DashboardContent />
    </AuthInitializer>
  );
}
