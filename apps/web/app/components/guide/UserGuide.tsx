"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useMessages, useTranslations } from "next-intl";
import {
  ArrowRight,
  BarChart3,
  Calculator,
  CalendarCheck,
  CalendarPlus,
  Check,
  ChevronDown,
  Crown,
  Download,
  Lightbulb,
  Link2,
  MapPin,
  PencilLine,
  Receipt,
  Search,
  ShoppingCart,
  UserPlus,
  Users,
  Utensils,
  WalletCards,
  X,
  type LucideIcon,
} from "lucide-react";
import { cn } from "../../lib/utils";
import { richAccent } from "../landing/ui";

type Role = "manager" | "member";

type SectionId =
  | "getStarted"
  | "addMembers"
  | "startMonth"
  | "dailyMeals"
  | "approveBazaar"
  | "expenses"
  | "deposits"
  | "fixMistakes"
  | "closeMonth"
  | "manageMess"
  | "joinMess"
  | "myBalance"
  | "submitBazaar"
  | "installApp";

/** Icon and where "Open in app" goes; the text lives in messages/guide.json. */
const SECTION_META: Record<SectionId, { icon: LucideIcon; href: string }> = {
  getStarted: { icon: UserPlus, href: "/signup" },
  addMembers: { icon: Users, href: "/dashboard/members" },
  startMonth: { icon: CalendarPlus, href: "/dashboard/months" },
  dailyMeals: { icon: Utensils, href: "/dashboard/meals" },
  approveBazaar: { icon: ShoppingCart, href: "/dashboard/bazaar" },
  expenses: { icon: Receipt, href: "/dashboard/expenses" },
  deposits: { icon: WalletCards, href: "/dashboard/deposits" },
  fixMistakes: { icon: PencilLine, href: "/dashboard/reports" },
  closeMonth: { icon: CalendarCheck, href: "/dashboard/months" },
  manageMess: { icon: Crown, href: "/dashboard/members" },
  joinMess: { icon: UserPlus, href: "/signup" },
  myBalance: { icon: BarChart3, href: "/dashboard" },
  submitBazaar: { icon: ShoppingCart, href: "/dashboard/bazaar" },
  installApp: { icon: Download, href: "/install" },
};

/** Each role's path through the app, in the order it is used. */
const ROLE_SECTIONS: Record<Role, SectionId[]> = {
  manager: [
    "getStarted",
    "addMembers",
    "startMonth",
    "dailyMeals",
    "approveBazaar",
    "expenses",
    "deposits",
    "fixMistakes",
    "closeMonth",
    "manageMess",
    "installApp",
  ],
  member: ["joinMess", "myBalance", "submitBazaar", "installApp"],
};

const FAQ_KEYS = [
  "rateChanges",
  "pending",
  "lateMonth",
  "removed",
  "twoManagers",
] as const;

interface SectionText {
  title: string;
  summary: string;
  steps: string[];
  where: string;
  tip?: string;
}

const anchor = (id: SectionId) => `guide-${id}`;

function sectionFromHash(): SectionId | null {
  const hash = window.location.hash.replace(/^#guide-/, "");
  return hash in SECTION_META ? (hash as SectionId) : null;
}

export function UserGuide() {
  const t = useTranslations("guide");
  const messages = useMessages() as unknown as {
    guide: { sections: Record<SectionId, SectionText> };
  };
  const texts = messages.guide.sections;

  const [role, setRole] = useState<Role>("manager");
  const [query, setQuery] = useState("");
  const [active, setActive] = useState<SectionId | null>(null);

  // Role and section come from the link (?role=member#guide-submitBazaar),
  // so a shared link opens exactly where it pointed.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const fromHash = sectionFromHash();
    const linked: Role | null =
      params.get("role") === "member"
        ? "member"
        : fromHash && !ROLE_SECTIONS.manager.includes(fromHash)
          ? "member"
          : null;
    if (linked) setRole(linked);
    if (fromHash) {
      requestAnimationFrame(() =>
        document
          .getElementById(anchor(fromHash))
          ?.scrollIntoView({ block: "start" }),
      );
    }
  }, []);

  const changeRole = (next: Role) => {
    setRole(next);
    setQuery("");
    const url = new URL(window.location.href);
    if (next === "member") url.searchParams.set("role", "member");
    else url.searchParams.delete("role");
    url.hash = "";
    window.history.replaceState(null, "", url);
    document
      .getElementById("guide-content")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const q = query.trim().toLowerCase();
  const visible = useMemo(
    () =>
      ROLE_SECTIONS[role].filter((id) => {
        if (!q) return true;
        const s = texts[id];
        return [s.title, s.summary, s.where, s.tip ?? "", ...s.steps]
          .join(" ")
          .toLowerCase()
          .includes(q);
      }),
    [role, q, texts],
  );

  useScrollSpy(visible, setActive);

  return (
    <>
      {/* Hero with the role choice */}
      <section className="border-b border-border">
        <div className="mx-auto max-w-6xl px-4 pt-12 pb-10 sm:px-6 lg:pt-16">
          <span className="label-mono text-primary">{t("eyebrow")}</span>
          <h1 className="mt-4 max-w-3xl font-heading text-4xl heading-tight text-foreground sm:text-5xl">
            {t.rich("title", richAccent)}
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-foreground-muted sm:text-lg">
            {t("subtitle")}
          </p>

          <p className="mt-8 text-sm font-semibold text-foreground">
            {t("iAm")}
          </p>
          <div
            role="tablist"
            aria-label={t("iAm")}
            className="mt-3 grid max-w-xl grid-cols-2 gap-3"
          >
            {(["manager", "member"] as const).map((r) => (
              <button
                key={r}
                type="button"
                role="tab"
                aria-selected={role === r}
                aria-controls="guide-content"
                onClick={() => changeRole(r)}
                className={cn(
                  "rounded-2xl border p-4 text-left transition-colors",
                  role === r
                    ? "border-primary bg-primary/10"
                    : "border-border bg-surface hover:border-border-strong",
                )}
              >
                <span className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-2 font-semibold text-foreground">
                    {r === "manager" ? (
                      <Crown size={18} className="text-accent-warm" />
                    ) : (
                      <Users size={18} className="text-primary" />
                    )}
                    {t(`roles.${r}.label`)}
                  </span>
                  <span
                    aria-hidden="true"
                    className={cn(
                      "flex size-5 items-center justify-center rounded-full border",
                      role === r
                        ? "border-primary bg-primary text-white"
                        : "border-border-strong",
                    )}
                  >
                    {role === r && <Check size={12} strokeWidth={3} />}
                  </span>
                </span>
                <span className="mt-1 block text-xs text-foreground-muted sm:text-sm">
                  {t(`roles.${r}.hint`)}
                </span>
              </button>
            ))}
          </div>
        </div>
      </section>

      <div
        id="guide-content"
        className="mx-auto max-w-6xl scroll-mt-[60px] px-4 pb-20 sm:px-6"
      >
        {/* Mobile: search + section chips stay at the top while scrolling. */}
        <div className="sticky top-[60px] z-30 -mx-4 border-b border-border bg-background/90 px-4 pt-3 pb-2 backdrop-blur-xl sm:-mx-6 sm:px-6 lg:hidden">
          <SearchBox value={query} onChange={setQuery} />
          <SectionChips
            ids={visible}
            active={active}
            titleOf={(id) => texts[id].title}
          />
        </div>

        <div className="lg:grid lg:grid-cols-[240px_1fr] lg:gap-10 lg:pt-10">
          {/* Desktop: table of contents beside the steps. */}
          <aside className="hidden lg:block">
            <div className="sticky top-[84px] space-y-4">
              <SearchBox value={query} onChange={setQuery} />
              <nav aria-label={t("onThisPage")}>
                <p className="label-mono mb-2 px-2 text-[10px] text-foreground-muted">
                  {t("onThisPage")}
                </p>
                <ol className="space-y-0.5">
                  {visible.map((id, i) => (
                    <li key={id}>
                      <a
                        href={`#${anchor(id)}`}
                        aria-current={active === id ? "true" : undefined}
                        className={cn(
                          "flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm transition-colors",
                          active === id
                            ? "bg-primary/10 font-semibold text-primary"
                            : "text-foreground-muted hover:bg-surface hover:text-foreground",
                        )}
                      >
                        <span
                          className={cn(
                            "flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold",
                            active === id
                              ? "bg-primary text-white"
                              : "bg-surface-raised text-foreground-muted",
                          )}
                        >
                          {i + 1}
                        </span>
                        <span className="truncate">{texts[id].title}</span>
                      </a>
                    </li>
                  ))}
                </ol>
              </nav>
            </div>
          </aside>

          <div className="min-w-0 pt-6 lg:pt-0">
            {visible.length === 0 ? (
              <div className="rounded-2xl border border-border bg-surface p-8 text-center">
                <p className="text-sm text-foreground-muted">
                  {t("noResults", { query: query.trim() })}
                </p>
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="mt-3 text-sm font-semibold text-primary hover:underline"
                >
                  {t("clearSearch")}
                </button>
              </div>
            ) : (
              <ol className="space-y-5">
                {visible.map((id, i) => (
                  <GuideSection
                    key={`${role}-${id}`}
                    id={id}
                    number={i + 1}
                    text={texts[id]}
                    role={role}
                  />
                ))}
              </ol>
            )}

            {!q && (
              <>
                <MathCard />
                <Faq />
                <Cta />
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

/* ---------- sections ---------- */

function GuideSection({
  id,
  number,
  text,
  role,
}: {
  id: SectionId;
  number: number;
  text: SectionText;
  role: Role;
}) {
  const t = useTranslations("guide");
  const { icon: Icon, href } = SECTION_META[id];

  return (
    <li
      id={anchor(id)}
      className="scroll-mt-[150px] rounded-2xl border border-border bg-surface p-5 sm:p-6 lg:scroll-mt-[84px]"
    >
      <div className="flex items-start gap-4">
        <span className="relative flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Icon size={20} aria-hidden="true" />
          <span className="absolute -top-1.5 -right-1.5 flex size-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white">
            {number}
          </span>
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="font-heading text-lg font-bold text-foreground sm:text-xl">
            {text.title}
          </h2>
          <p className="mt-1 text-sm leading-relaxed text-foreground-muted">
            {text.summary}
          </p>
        </div>
      </div>

      <ol className="mt-5 space-y-3">
        {text.steps.map((step, i) => (
          <li key={i} className="flex gap-3">
            <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full border border-border-strong text-xs font-semibold text-foreground">
              {i + 1}
            </span>
            <span className="text-sm leading-relaxed text-foreground sm:text-[15px]">
              {step}
            </span>
          </li>
        ))}
      </ol>

      <p className="mt-5 inline-flex max-w-full items-center gap-2 rounded-lg bg-background/60 px-3 py-2 text-sm">
        <MapPin
          size={15}
          className="shrink-0 text-primary"
          aria-hidden="true"
        />
        <span className="text-foreground-muted">{t("where")}:</span>
        <span className="font-semibold text-foreground">{text.where}</span>
      </p>

      {text.tip && (
        <div className="mt-3 flex gap-2.5 rounded-xl border border-accent-warm/25 bg-accent-warm/10 px-3.5 py-3 text-sm">
          <Lightbulb
            size={16}
            className="mt-0.5 shrink-0 text-accent-warm"
            aria-hidden="true"
          />
          <p className="leading-relaxed text-foreground">
            <span className="font-semibold">{t("tip")}: </span>
            {text.tip}
          </p>
        </div>
      )}

      <div className="mt-5 flex flex-wrap gap-2 border-t border-border pt-4">
        <Link
          href={href}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-3.5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
        >
          {t("openInApp")}
          <ArrowRight size={15} aria-hidden="true" />
        </Link>
        <CopySectionLink id={id} role={role} />
      </div>
    </li>
  );
}

/** Copies a link straight to this section, e.g. to send on WhatsApp. */
function CopySectionLink({ id, role }: { id: SectionId; role: Role }) {
  const t = useTranslations("guide");
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    const url = new URL("/guide", window.location.origin);
    if (role === "member") url.searchParams.set("role", "member");
    url.hash = anchor(id);
    try {
      await navigator.clipboard.writeText(url.toString());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt(t("copyLink"), url.toString());
    }
  };

  return (
    <button
      type="button"
      onClick={copy}
      className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border px-3.5 text-sm font-semibold text-foreground-muted transition-colors hover:border-border-strong hover:text-foreground"
    >
      {copied ? (
        <Check size={15} className="text-success" aria-hidden="true" />
      ) : (
        <Link2 size={15} aria-hidden="true" />
      )}
      <span aria-live="polite">{copied ? t("linkCopied") : t("copyLink")}</span>
    </button>
  );
}

/* ---------- navigation ---------- */

function SearchBox({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const t = useTranslations("guide");
  return (
    <div className="relative">
      <Search
        size={16}
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-foreground-muted"
      />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={t("searchPlaceholder")}
        aria-label={t("searchPlaceholder")}
        className="h-10 w-full rounded-xl border border-border bg-surface pr-9 pl-9 text-base text-foreground placeholder:text-foreground-muted focus:border-primary focus:ring-2 focus:ring-primary/15 focus:outline-none sm:text-sm [&::-webkit-search-cancel-button]:hidden"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label={t("clearSearch")}
          className="absolute top-1/2 right-2 flex size-6 -translate-y-1/2 items-center justify-center rounded-full text-foreground-muted hover:text-foreground"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}

function SectionChips({
  ids,
  active,
  titleOf,
}: {
  ids: SectionId[];
  active: SectionId | null;
  titleOf: (id: SectionId) => string;
}) {
  const scroller = useRef<HTMLDivElement>(null);

  // Keep the chip of the section being read in view.
  useEffect(() => {
    if (!active) return;
    const chip = scroller.current?.querySelector<HTMLElement>(
      `[data-id="${active}"]`,
    );
    chip?.scrollIntoView({ inline: "center", block: "nearest" });
  }, [active]);

  if (ids.length === 0) return null;
  return (
    <div
      ref={scroller}
      className="no-scrollbar -mx-1 mt-2 flex gap-1.5 overflow-x-auto px-1"
    >
      {ids.map((id, i) => (
        <a
          key={id}
          data-id={id}
          href={`#${anchor(id)}`}
          className={cn(
            "flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
            active === id
              ? "border-primary bg-primary/10 text-primary"
              : "border-border bg-surface text-foreground-muted",
          )}
        >
          <span className="tabular-nums opacity-70">{i + 1}</span>
          {titleOf(id)}
        </a>
      ))}
    </div>
  );
}

/** Marks the section being read (for the contents list and chips). */
function useScrollSpy(
  ids: SectionId[],
  onActive: (id: SectionId | null) => void,
) {
  const update = useCallback(() => {
    // The section crossing 40% of the screen height is the one being read.
    const offset = window.innerHeight * 0.4;
    let current: SectionId | null = ids[0] ?? null;
    for (const id of ids) {
      const el = document.getElementById(anchor(id));
      if (el && el.getBoundingClientRect().top - offset <= 0) current = id;
    }
    onActive(current);
  }, [ids, onActive]);

  useEffect(() => {
    update();
    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(update);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [update]);
}

/* ---------- after the steps ---------- */

function MathCard() {
  const t = useTranslations("guide.math");
  return (
    <section className="mt-10 rounded-2xl border border-primary/20 bg-primary/[0.04] p-5 sm:p-6">
      <h2 className="flex items-center gap-2 font-heading text-lg font-bold text-foreground">
        <Calculator size={18} className="text-primary" aria-hidden="true" />
        {t("title")}
      </h2>
      <ul className="mt-4 space-y-2.5">
        {(["rate", "bill", "balance"] as const).map((key) => (
          <li
            key={key}
            className="rounded-lg border border-border bg-surface px-3 py-2 text-sm font-medium text-foreground"
          >
            {t(key)}
          </li>
        ))}
      </ul>
    </section>
  );
}

function Faq() {
  const t = useTranslations("guide.faq");
  return (
    <section className="mt-10">
      <h2 className="font-heading text-2xl heading-tight text-foreground">
        {t("title")}
      </h2>
      <div className="mt-4 divide-y divide-border rounded-2xl border border-border bg-surface">
        {FAQ_KEYS.map((key) => (
          <details key={key} className="group px-5 py-4">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-foreground [&::-webkit-details-marker]:hidden">
              {t(`items.${key}.q`)}
              <ChevronDown
                size={18}
                aria-hidden="true"
                className="shrink-0 text-foreground-muted transition-transform group-open:rotate-180"
              />
            </summary>
            <p className="mt-3 text-sm leading-relaxed text-foreground-muted">
              {t(`items.${key}.a`)}
            </p>
          </details>
        ))}
      </div>
    </section>
  );
}

function Cta() {
  const t = useTranslations("guide.cta");
  return (
    <section className="mt-10 rounded-2xl border border-border bg-surface-raised p-6 text-center sm:p-8">
      <h2 className="font-heading text-2xl heading-tight text-foreground">
        {t("title")}
      </h2>
      <p className="mt-2 text-sm text-foreground-muted">{t("body")}</p>
      <div className="mt-5 flex flex-col justify-center gap-3 sm:flex-row">
        <Link
          href="/signup"
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-6 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
        >
          {t("signup")}
          <ArrowRight size={16} aria-hidden="true" />
        </Link>
        <Link
          href="/install"
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-border bg-surface px-6 text-sm font-semibold text-foreground transition-colors hover:border-primary/40 hover:text-primary"
        >
          <Download size={16} aria-hidden="true" />
          {t("install")}
        </Link>
      </div>
    </section>
  );
}
