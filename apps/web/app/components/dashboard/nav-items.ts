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
  type LucideIcon,
} from "lucide-react";

/** Keys in the `nav` message namespace. */
export type NavLabel =
  | "home"
  | "dashboard"
  | "members"
  | "months"
  | "meals"
  | "bazaar"
  | "expenses"
  | "deposits"
  | "reports"
  | "profile"
  | "settings"
  | "messSettings"
  | "createAccount"
  | "createMess";

export interface NavItem {
  href: string;
  label: NavLabel;
  icon: LucideIcon;
  managerOnly?: boolean;
}

/** Full list, in sidebar order. */
export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "dashboard", icon: Home },
  { href: "/dashboard/members", label: "members", icon: Users },
  { href: "/dashboard/months", label: "months", icon: Calendar },
  { href: "/dashboard/meals", label: "meals", icon: Utensils },
  { href: "/dashboard/bazaar", label: "bazaar", icon: ShoppingCart },
  { href: "/dashboard/expenses", label: "expenses", icon: ReceiptText },
  { href: "/dashboard/deposits", label: "deposits", icon: WalletCards },
  { href: "/dashboard/reports", label: "reports", icon: BarChart3 },
  { href: "/dashboard/profile", label: "profile", icon: User },
];

/**
 * Desktop sidebar order. Separate from NAV_ITEMS so the mobile "More" sheet
 * (built from NAV_ITEMS) keeps its own order.
 */
const SIDEBAR_ORDER = [
  "/dashboard",
  "/dashboard/members",
  "/dashboard/meals",
  "/dashboard/bazaar",
  "/dashboard/expenses",
  "/dashboard/deposits",
  "/dashboard/months",
  "/dashboard/reports",
  "/dashboard/profile",
];

export const SIDEBAR_ITEMS: NavItem[] = SIDEBAR_ORDER.map(
  (href) => NAV_ITEMS.find((item) => item.href === href)!,
);

export const MANAGER_NAV_ITEMS: NavItem[] = [
  {
    href: "/dashboard/settings",
    label: "messSettings",
    icon: Settings,
    managerOnly: true,
  },
];

/** Mobile bottom bar (a fifth "More" tab is added by BottomNav). */
export const PRIMARY_TABS: NavItem[] = [
  { href: "/dashboard", label: "home", icon: Home },
  { href: "/dashboard/meals", label: "meals", icon: Utensils },
  { href: "/dashboard/bazaar", label: "bazaar", icon: ShoppingCart },
  { href: "/dashboard/reports", label: "reports", icon: BarChart3 },
];

/** Everything not in the bottom bar, shown in the "More" sheet. */
export const MORE_ITEMS: NavItem[] = [
  ...NAV_ITEMS.filter(
    (item) => !PRIMARY_TABS.some((tab) => tab.href === item.href),
  ),
  ...MANAGER_NAV_ITEMS,
];

export function isActivePath(pathname: string, href: string) {
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname === href || pathname.startsWith(href + "/");
}

/** Sub-pages that should show a back button + their own title on mobile. */
const NESTED_PAGES: { href: string; label: NavLabel; parent: string }[] = [
  {
    href: "/dashboard/members/create-account",
    label: "createAccount",
    parent: "/dashboard/members",
  },
];

/** Title + optional back target for the mobile top bar. */
export function getPageMeta(pathname: string): {
  label: NavLabel | null;
  backHref: string | null;
} {
  const nested = NESTED_PAGES.find((p) => pathname.startsWith(p.href));
  if (nested) return { label: nested.label, backHref: nested.parent };
  if (pathname === "/dashboard") return { label: null, backHref: null };

  const item = [...NAV_ITEMS, ...MANAGER_NAV_ITEMS].find((i) =>
    isActivePath(pathname, i.href),
  );
  return { label: item?.label ?? null, backHref: null };
}
