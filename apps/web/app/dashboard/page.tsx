"use client";

import { useSessionStore } from "../store";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { AuthInitializer } from "../components/AuthInitializer";

function DashboardContent() {
  const { user, isAuthenticated, clearSession } = useSessionStore();
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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            Welcome to Your Dashboard!
          </h1>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-blue-50 p-6 rounded-lg">
              <h2 className="text-xl font-semibold text-blue-900 mb-2">
                User Profile
              </h2>
              <p className="text-blue-700">Name: {user?.name}</p>
              <p className="text-blue-700">Email: {user?.email}</p>
              <p className="text-blue-700">
                System Role: {user ? "USER" : "MEMBER"}
              </p>
            </div>

            <div className="bg-green-50 p-6 rounded-lg">
              <h2 className="text-xl font-semibold text-green-900 mb-2">
                Quick Actions
              </h2>
              <ul className="space-y-2 text-green-700">
                <li>• View your messes</li>
                <li>• Manage meals</li>
                <li>• Check balances</li>
                <li>• View reports</li>
              </ul>
            </div>
          </div>

          <div className="mt-8">
            <button
              onClick={() => {
                clearSession();
                router.push("/");
              }}
              className="bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
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
