"use client";

import { usePathname } from "next/navigation";
import { AuthInitializer } from "../components/AuthInitializer";
import { ProtectedPage } from "../protected-page";
import { Sidebar } from "../components/dashboard/Sidebar";
import { BottomNav } from "../components/dashboard/BottomNav";
import { LanguageToggle } from "../components/LanguageToggle";
import { MobileTopBar } from "../components/dashboard/MobileTopBar";

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
          <div className="pt-safe pb-safe min-h-dvh bg-background">
            <div className="px-4 py-8 md:px-6 md:py-10 lg:px-8">
              <div className="mb-6 flex justify-end">
                <LanguageToggle />
              </div>
              {children}
            </div>
          </div>
        </ProtectedPage>
      </AuthInitializer>
    );
  }

  return (
    <AuthInitializer>
      <ProtectedPage>
        <div className="pb-bottom-nav min-h-dvh bg-background lg:ml-72 lg:pb-8">
          <Sidebar />
          <MobileTopBar />
          <main className="px-4 py-5 sm:py-8 lg:px-8">
            <div className="mx-auto max-w-6xl">{children}</div>
          </main>
          <BottomNav />
        </div>
      </ProtectedPage>
    </AuthInitializer>
  );
}
