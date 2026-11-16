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
import { SectionHeading } from "./ui";
import { Reveal } from "./Reveal";

const MANAGER_FEATURES = [
  { icon: Settings2, text: "Create the mess and configure meal types" },
  { icon: ReceiptText, text: "Approve and manage all expenses" },
  { icon: NotebookPen, text: "Bulk-enter meals to save time" },
  { icon: CalendarRange, text: "Open and close monthly cycles" },
  { icon: Users, text: "Invite members and manage roles" },
];

const MEMBER_FEATURES = [
  { icon: UtensilsCrossed, text: "Record their own meals in one tap" },
  { icon: ReceiptText, text: "Add and see every expense" },
  { icon: Wallet, text: "Deposit money against the shared ledger" },
  { icon: Users, text: "See the live meal rate and own balance" },
  { icon: CalendarRange, text: "Audit the full mess-wide activity log" },
];

function RoleCard({
  icon: Icon,
  title,
  badge,
  accent,
  features,
}: {
  icon: React.ElementType;
  title: string;
  badge: string;
  accent: string;
  features: { icon: React.ElementType; text: string }[];
}) {
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
            title === "Managers"
              ? "bg-accent-warm/15 text-accent-warm"
              : "bg-primary/15 text-primary"
          }`}
        >
          {badge}
        </span>
      </div>
      <h3 className="mt-5 text-xl font-bold text-foreground font-heading">
        {title}
      </h3>
      <p className="mt-1.5 text-sm text-foreground-muted">
        {title === "Managers"
          ? "Run the mess. Keep everyone honest — by design."
          : "Just live in the mess. Stay fully in the loop."}
      </p>
      <ul className="mt-6 space-y-3.5">
        {features.map((f) => (
          <li key={f.text} className="flex items-start gap-3">
            <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <f.icon className="size-3.5" />
            </span>
            <span className="text-sm leading-relaxed text-foreground-muted">
              {f.text}
            </span>
          </li>
        ))}
      </ul>
      <div className="mt-auto pt-6">
        <div className="flex items-start gap-2 rounded-xl border border-success/25 bg-success/5 p-3">
          <Check className="mt-0.5 size-4 shrink-0 text-success" />
          <p className="text-xs leading-relaxed text-foreground-muted">
            {title === "Managers"
              ? "Every manager action is logged and visible to the mess."
              : "Members see everything managers see — no secrets, no surprises."}
          </p>
        </div>
      </div>
    </div>
  );
}

export function RoleSection() {
  return (
    <section className="border-y border-border bg-surface-sunken py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Roles, Not Tiers"
          title={
            <>
              Managers Run It.{" "}
              <span className="text-primary">Members Own It.</span>
            </>
          }
          subtitle="MessMate keeps two clear roles. No paid tiers, no paywalls — just a shared living arrangement that finally has structure."
        />

        <div className="mx-auto mt-14 grid max-w-4xl grid-cols-1 gap-6 lg:grid-cols-2">
          <Reveal>
            <RoleCard
              icon={Crown}
              title="Managers"
              badge="Up to 2 per mess"
              accent="text-accent-warm bg-accent-warm/10 ring-accent-warm/25"
              features={MANAGER_FEATURES}
            />
          </Reveal>
          <Reveal delay={120}>
            <RoleCard
              icon={UserRound}
              title="Members"
              badge="Everyone else"
              accent="text-primary bg-primary/10 ring-primary/25"
              features={MEMBER_FEATURES}
            />
          </Reveal>
        </div>

        <Reveal delay={120}>
          <p className="mx-auto mt-8 max-w-xl text-center text-sm text-foreground-muted">
            Max two managers per mess, both with equal permissions. No
            hierarchies, no owner seats — just two people keeping the books
            honest.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
