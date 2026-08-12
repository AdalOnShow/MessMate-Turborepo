"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  ReceiptText,
  Settings,
  User,
  Users,
  Utensils,
  WalletCards,
} from "lucide-react";
import { useGetMyMess } from "../../hooks/use-messes";

const navItems = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/dashboard/members", label: "Members", icon: Users },
  { href: "/dashboard/meals", label: "Meals", icon: Utensils },
  { href: "/dashboard/expenses", label: "Expenses", icon: ReceiptText },
  { href: "/dashboard/deposits", label: "Deposits", icon: WalletCards },
  { href: "/dashboard/profile", label: "Profile", icon: User },
];

export function BottomNav() {
  const pathname = usePathname();
  const { data: myMess } = useGetMyMess();
  const isManager = myMess?.current_user_role === "MANAGER";

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-foreground-muted/15 bg-background/95 pb-safe pt-1 backdrop-blur lg:hidden">
      <div className="flex items-stretch justify-around gap-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active =
            pathname === item.href ||
            (item.href !== "/dashboard" &&
              pathname.startsWith(item.href + "/"));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-1 flex-col items-center justify-center gap-1 py-2 text-foreground-muted transition-colors ${
                active ? "text-primary" : "active:text-foreground-muted"
              }`}
            >
              <Icon
                size={22}
                strokeWidth={active ? 2.5 : 2}
                aria-hidden="true"
              />
              <span className="text-[10px] font-semibold leading-none">
                {item.label}
              </span>
            </Link>
          );
        })}

        {isManager && (
          <Link
            href="/dashboard/settings"
            className={`flex flex-1 flex-col items-center justify-center gap-1 py-2 text-foreground-muted transition-colors ${
              pathname === "/dashboard/settings"
                ? "text-primary"
                : "active:text-foreground-muted"
            }`}
          >
            <Settings
              size={22}
              strokeWidth={pathname === "/dashboard/settings" ? 2.5 : 2}
              aria-hidden="true"
            />
            <span className="text-[10px] font-semibold leading-none">
              Settings
            </span>
          </Link>
        )}
      </div>
    </nav>
  );
}
