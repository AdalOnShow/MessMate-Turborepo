"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Calendar,
  Home,
  LogOut,
  ReceiptText,
  Settings,
  ShoppingCart,
  User,
  Users,
  Utensils,
  WalletCards,
} from "lucide-react";
import { useSessionStore } from "../../store";
import { useLogout } from "../../hooks/use-auth";
import { useGetMyMess } from "../../hooks/use-messes";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: Home },
  { href: "/dashboard/members", label: "Members", icon: Users },
  { href: "/dashboard/months", label: "Months", icon: Calendar },
  { href: "/dashboard/meals", label: "Meals", icon: Utensils },
  { href: "/dashboard/bazaar", label: "Bazaar", icon: ShoppingCart },
  { href: "/dashboard/expenses", label: "Expenses", icon: ReceiptText },
  { href: "/dashboard/deposits", label: "Deposits", icon: WalletCards },
  { href: "/dashboard/reports", label: "Reports", icon: BarChart3 },
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
    <aside className="hidden border-border bg-surface-sunken lg:fixed lg:inset-y-0 lg:left-0 lg:flex lg:w-72 lg:flex-col lg:border-r">
      <div className="flex h-[60px] items-center gap-3 border-b border-border px-5">
        <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-lg border border-border bg-surface-raised">
          <Image
            src="/messmate-icon.png"
            alt="MessMate"
            width={460}
            height={400}
            className="h-6 w-auto object-contain"
          />
        </div>
        <Link
          href="/dashboard"
          className="text-lg font-extrabold tracking-[-0.03em] text-foreground"
        >
          Mess<span className="text-primary">Mate</span>
        </Link>
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-5">
        <p className="label-mono mb-2 px-3 text-[10px] text-foreground-muted">
          Workspace
        </p>
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
              className={`relative flex h-10 items-center gap-3 rounded-lg border px-3 text-sm font-medium transition-colors ${
                active
                  ? "border-primary/25 bg-primary/10 text-foreground before:absolute before:inset-y-2 before:-left-3 before:w-0.5 before:rounded-full before:bg-primary [&_svg]:text-primary"
                  : "border-transparent text-foreground-muted hover:bg-surface-raised hover:text-foreground"
              }`}
            >
              <Icon size={18} aria-hidden="true" />
              {item.label}
            </Link>
          );
        })}

        {isManager && (
          <>
            <p className="label-mono mb-2 mt-5 px-3 text-[10px] text-foreground-muted">
              Manager
            </p>
            <Link
              href="/dashboard/settings"
              className={`relative flex h-10 items-center gap-3 rounded-lg border px-3 text-sm font-medium transition-colors ${
                pathname === "/dashboard/settings"
                  ? "border-primary/25 bg-primary/10 text-foreground before:absolute before:inset-y-2 before:-left-3 before:w-0.5 before:rounded-full before:bg-primary [&_svg]:text-primary"
                  : "border-transparent text-foreground-muted hover:bg-surface-raised hover:text-foreground"
              }`}
            >
              <Settings size={18} aria-hidden="true" />
              Mess Settings
            </Link>
          </>
        )}
      </nav>

      <div className="border-t border-border p-4">
        <div className="mb-3 flex items-center gap-3 rounded-xl border border-border bg-surface p-3">
          {user?.avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={user.avatar}
              alt=""
              className="h-10 w-10 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-primary/30 bg-primary/10 text-sm font-bold text-primary">
              {initials(user?.name, user?.email)}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-foreground">
              {user?.name || "MessMate user"}
            </p>
            <p className="truncate font-mono text-[11px] text-foreground-muted">
              {user?.email}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => logout.mutate()}
          disabled={logout.isPending}
          className="flex h-10 w-full items-center justify-center gap-2 rounded-[9px] border border-border text-sm font-semibold text-foreground-muted transition-colors hover:border-destructive/40 hover:bg-destructive/10 hover:text-destructive disabled:cursor-not-allowed disabled:opacity-60"
        >
          <LogOut size={16} aria-hidden="true" />
          Logout
        </button>
      </div>
    </aside>
  );
}
