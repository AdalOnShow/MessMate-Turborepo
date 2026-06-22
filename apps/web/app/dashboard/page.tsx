"use client";

import { useSessionStore } from "../store";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { AuthInitializer } from "../components/AuthInitializer";
import { Sidebar } from "../components/dashboard/Sidebar";

function DashboardContent() {
  const { user, isAuthenticated } = useSessionStore();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/signin");
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated) {
    return null; // Will redirect via useEffect
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <main className="px-4 py-8 lg:ml-72 lg:px-8">
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
              <ul className="space-y-3 text-sm text-foreground-muted">
                <li>View your messes</li>
                <li>Manage meals</li>
                <li>Check balances</li>
                <li>View reports</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
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
