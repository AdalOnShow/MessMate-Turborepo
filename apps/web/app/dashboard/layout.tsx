"use client";

import { usePathname } from "next/navigation";
import { AuthInitializer } from "../components/AuthInitializer";
import { ProtectedPage } from "../protected-page";
import { Sidebar } from "../components/dashboard/Sidebar";
import { BottomNav } from "../components/dashboard/BottomNav";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isCreateMess = pathname === "/dashboard/create-mess";

  if (isCreateMess) {
    return (
      <AuthInitializer>
        <ProtectedPage>
          <div className="min-h-screen bg-background px-4 py-8 md:px-6 md:py-10 lg:px-8">
            {children}
          </div>
        </ProtectedPage>
      </AuthInitializer>
    );
  }

  return (
    <AuthInitializer>
      <ProtectedPage>
        <div className="min-h-screen bg-background pb-20 lg:ml-72 lg:pb-8">
          <Sidebar />
          <main className="px-4 py-8 lg:px-8">
            <div className="mx-auto max-w-6xl">{children}</div>
          </main>
          <BottomNav />
        </div>
      </ProtectedPage>
    </AuthInitializer>
  );
}
