import {
  Crown,
  UserRound,
  Check,
  Settings2,
  NotebookPen,
  UtensilsCrossed,
  CalendarRange,
  ReceiptText,
  Wallet,
  Users,
} from "lucide-react";
import { getTranslations } from "next-intl/server";
import { SectionHeading, richAccent } from "./ui";
import { Reveal } from "./Reveal";

const MANAGER_FEATURES = [
  { icon: Settings2, key: "f1" },
  { icon: ReceiptText, key: "f2" },
  { icon: NotebookPen, key: "f3" },
  { icon: CalendarRange, key: "f4" },
  { icon: Users, key: "f5" },
] as const;

const MEMBER_FEATURES = [
  { icon: UtensilsCrossed, key: "f1" },
  { icon: ReceiptText, key: "f2" },
  { icon: Wallet, key: "f3" },
  { icon: Users, key: "f4" },
  { icon: CalendarRange, key: "f5" },
] as const;

async function RoleCard({
  icon: Icon,
  role,
  accent,
  features,
}: {
  icon: React.ElementType;
  role: "manager" | "member";
  accent: string;
  features: ReadonlyArray<{
    icon: React.ElementType;
    key: "f1" | "f2" | "f3" | "f4" | "f5";
  }>;
}) {
  const t = await getTranslations(`landing.roles.${role}`);
  return (
    <div className="flex h-full flex-col rounded-2xl border border-border bg-surface-raised/50 p-6 transition-all duration-300 hover:border-primary/30 hover:-translate-y-1 hover:shadow-xl hover:shadow-black/30 lg:p-8">
      <div className="flex items-center justify-between">
        <span
          className={`flex size-12 items-center justify-center rounded-xl ring-1 ${accent}`}
        >
          <Icon className="size-6" />
        </span>
        <span
          className={`rounded-full px-3 py-1 text-[11px] font-bold ${
            role === "manager"
              ? "bg-accent-warm/15 text-accent-warm"
              : "bg-primary/15 text-primary"
          }`}
        >
          {t("badge")}
        </span>
      </div>
      <h3 className="mt-5 text-xl font-bold text-foreground font-heading">
        {t("title")}
      </h3>
      <p className="mt-1.5 text-sm text-foreground-muted">
        {t("tagline")}
      </p>
      <ul className="mt-6 space-y-3.5">
        {features.map((f) => (
          <li key={f.key} className="flex items-start gap-3">
            <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <f.icon className="size-3.5" />
            </span>
            <span className="text-sm leading-relaxed text-foreground-muted">
              {t(f.key)}
            </span>
          </li>
        ))}
      </ul>
      <div className="mt-auto pt-6">
        <div className="flex items-start gap-2 rounded-xl border border-success/25 bg-success/5 p-3">
          <Check className="mt-0.5 size-4 shrink-0 text-success" />
          <p className="text-xs leading-relaxed text-foreground-muted">
            {t("note")}
          </p>
        </div>
      </div>
    </div>
  );
}

export async function RoleSection() {
  const t = await getTranslations("landing.roles");
  return (
    <section className="border-y border-border bg-surface-sunken py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow={t("eyebrow")}
          title={t.rich("title", richAccent)}
          subtitle={t("subtitle")}
        />

        <div className="mx-auto mt-14 grid max-w-4xl grid-cols-1 gap-6 lg:grid-cols-2">
          <Reveal>
            <RoleCard
              icon={Crown}
              role="manager"
              accent="text-accent-warm bg-accent-warm/10 ring-accent-warm/25"
              features={MANAGER_FEATURES}
            />
          </Reveal>
          <Reveal delay={120}>
            <RoleCard
              icon={UserRound}
              role="member"
              accent="text-primary bg-primary/10 ring-primary/25"
              features={MEMBER_FEATURES}
            />
          </Reveal>
        </div>

        <Reveal delay={120}>
          <p className="mx-auto mt-8 max-w-xl text-center text-sm text-foreground-muted">
            {t("footnote")}
          </p>
        </Reveal>
      </div>
    </section>
  );
}
