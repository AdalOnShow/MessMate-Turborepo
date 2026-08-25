"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Calendar,
  Home,
  LogOut,
  ReceiptText,
  Settings,
  User,
  Users,
  Utensils,
  UtensilsCrossed,
  WalletCards,
} from "lucide-react";
import { useSessionStore } from "../../store";
import { useLogout } from "../../hooks/use-auth";
import { useGetMyMess } from "../../hooks/use-messes";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: Home },
  { href: "/dashboard/members", label: "Members", icon: Users },
  { href: "/dashboard/months", label: "Months", icon: Calendar },
  { href: "/dashboard/meal-types", label: "Meal Types", icon: UtensilsCrossed },
  { href: "/dashboard/meals", label: "Meals", icon: Utensils },
  { href: "/dashboard/expenses", label: "Expenses", icon: ReceiptText },
  { href: "/dashboard/deposits", label: "Deposits", icon: WalletCards },
  { href: "/dashboard/profile", label: "Profile", icon: User },
];

function initials(name?: string | null, email?: string | null) {
  const source = name?.trim() || email?.split("@")[0] || "User";
  return source
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function Sidebar() {
  const pathname = usePathname();
  const user = useSessionStore((state) => state.user);
  const logout = useLogout();
  const { data: myMess } = useGetMyMess();
  const isManager = myMess?.current_user_role === "MANAGER";

  return (
    <aside className="hidden lg:flex lg:fixed lg:inset-y-0 lg:left-0 lg:w-72 lg:flex-col">
      <div className="flex h-16 items-center gap-3 border-b border-foreground-muted/10 px-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-primary/25 bg-primary/10 text-lg font-bold text-primary">
          M
        </div>
        <Link
          href="/dashboard"
          className="text-xl font-bold tracking-tight text-foreground"
        >
          Mess<span className="text-primary">Mate</span>
        </Link>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href + "/"));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex h-11 items-center gap-3 rounded-lg px-3 text-sm font-semibold transition-colors ${
                active
                  ? "bg-primary text-background"
                  : "text-foreground-muted hover:bg-surface-raised hover:text-foreground"
              }`}
            >
              <Icon size={18} aria-hidden="true" />
              {item.label}
            </Link>
          );
        })}

        {isManager && (
          <Link
            href="/dashboard/settings"
            className={`flex h-11 items-center gap-3 rounded-lg px-3 text-sm font-semibold transition-colors ${
              pathname === "/dashboard/settings"
                ? "bg-primary text-background"
                : "text-foreground-muted hover:bg-surface-raised hover:text-foreground"
            }`}
          >
            <Settings size={18} aria-hidden="true" />
            Mess Settings
          </Link>
        )}
      </nav>

      <div className="border-t border-foreground-muted/10 p-4">
        <div className="mb-3 flex items-center gap-3 rounded-lg bg-background/60 p-3">
          {user?.avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={user.avatar}
              alt=""
              className="h-10 w-10 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/15 text-sm font-bold text-primary">
              {initials(user?.name, user?.email)}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-foreground">
              {user?.name || "MessMate user"}
            </p>
            <p className="truncate text-xs text-foreground-muted">
              {user?.email}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => logout.mutate()}
          disabled={logout.isPending}
          className="flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-foreground-muted/15 text-sm font-semibold text-foreground-muted transition-colors hover:border-destructive/40 hover:bg-destructive/10 hover:text-destructive disabled:cursor-not-allowed disabled:opacity-60"
        >
          <LogOut size={16} aria-hidden="true" />
          Logout
        </button>
      </div>
    </aside>
  );
}
