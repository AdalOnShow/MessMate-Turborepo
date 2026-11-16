"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Calendar,
  Home,
  ReceiptText,
  Settings,
  ShoppingCart,
  User,
  Users,
  Utensils,
  WalletCards,
} from "lucide-react";
import { useGetMyMess } from "../../hooks/use-messes";
import { useTranslations } from "next-intl";

const navItems = [
  { href: "/dashboard", label: "home", icon: Home },
  { href: "/dashboard/members", label: "members", icon: Users },
  { href: "/dashboard/months", label: "months", icon: Calendar },
  { href: "/dashboard/meals", label: "meals", icon: Utensils },
  { href: "/dashboard/bazaar", label: "bazaar", icon: ShoppingCart },
  { href: "/dashboard/expenses", label: "expenses", icon: ReceiptText },
  { href: "/dashboard/deposits", label: "deposits", icon: WalletCards },
  { href: "/dashboard/reports", label: "reports", icon: BarChart3 },
  { href: "/dashboard/profile", label: "profile", icon: User },
] as const;

export function BottomNav() {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const { data: myMess } = useGetMyMess();
  const isManager = myMess?.current_user_role === "MANAGER";

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-surface-sunken/95 pb-safe pt-1 backdrop-blur lg:hidden">
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
              <span className="font-mono text-[9px] font-medium uppercase leading-none tracking-wider">
                {t(item.label)}
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
            <span className="font-mono text-[9px] font-medium uppercase leading-none tracking-wider">
              {t("settings")}
            </span>
          </Link>
        )}
      </div>
    </nav>
  );
}
