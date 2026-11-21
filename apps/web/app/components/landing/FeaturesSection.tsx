import type { ReactNode } from "react";
import { getTranslations } from "next-intl/server";
import { Avatar, Container, SectionHeading } from "./ui";
import { MealWeek } from "./MealWeek";

const EXPENSES = [
  {
    key: "bazaar",
    amount: "৳4,250",
    tag: "bazaar",
    by: "Adal",
    initials: "AN",
  },
  {
    key: "internet",
    amount: "৳1,200",
    tag: "shared",
    by: "Rahim",
    initials: "RU",
  },
  { key: "gas", amount: "৳950", tag: "shared", by: "Fahad", initials: "FK" },
] as const;

const DEPOSITS = [
  { name: "Adal Nawab", amount: "৳6,000", pct: 75 },
  { name: "Fahad Karim", amount: "৳5,500", pct: 69 },
  { name: "Rahim Uddin", amount: "৳4,000", pct: 50 },
];

const LOG = [
  { key: "deposit", who: "Rahim", initials: "RU", when: "r1" },
  { key: "dinner", who: "Adal", initials: "AN", when: "r2" },
  { key: "bazaar", who: "Fahad", initials: "FK", when: "r3" },
  { key: "role", who: "Adal", initials: "AN", when: "r4" },
] as const;

const MEMBERS = [
  { initials: "AN", name: "Adal Nawab", role: "MANAGER" },
  { initials: "FK", name: "Fahad Karim", role: "MANAGER" },
  { initials: "RU", name: "Rahim Uddin", role: "MEMBER" },
  { initials: "KM", name: "Karim Mia", role: "MEMBER" },
] as const;

function FeatureRow({
  title,
  body,
  children,
  flip = false,
}: {
  title: string;
  body: string;
  children: ReactNode;
  flip?: boolean;
}) {
  return (
    <div className="grid grid-cols-1 items-center gap-8 py-12 md:grid-cols-12 md:gap-12 lg:py-16">
      <div className={`md:col-span-5 ${flip ? "md:order-2" : ""}`}>
        <h3 className="font-heading text-[clamp(1.625rem,2.8vw,2.25rem)] font-extrabold leading-[1.1] tracking-[-0.03em] text-balance text-foreground">
          {title}
        </h3>
        <p className="mt-4 max-w-[46ch] text-[15px] leading-relaxed text-foreground-muted sm:text-base">
          {body}
        </p>
      </div>
      <div className={`min-w-0 md:col-span-7 ${flip ? "md:order-1" : ""}`}>
        <div className="hover-panel rounded-2xl border border-border bg-surface p-4 sm:p-6">
          {children}
        </div>
      </div>
    </div>
  );
}

export async function FeaturesSection() {
  const t = await getTranslations("landing.features");
  const tRole = await getTranslations("role");

  return (
    <section
      id="features"
      className="scroll-mt-20 border-t border-border pt-20 lg:pt-28"
    >
      <Container>
        <SectionHeading title={t("title")} subtitle={t("subtitle")} />

        <div className="mt-6 divide-y divide-border">
          <FeatureRow title={t("meals.title")} body={t("meals.body")}>
            <MealWeek />
          </FeatureRow>

          <FeatureRow title={t("money.title")} body={t("money.body")} flip>
            <ul className="divide-y divide-border">
              {EXPENSES.map((e) => (
                <li
                  key={e.key}
                  className="hover-row flex items-center gap-3 py-3 first:pt-0"
                >
                  <Avatar
                    initials={e.initials}
                    className="!size-8 !text-[10px]"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-foreground">
                      {t(`money.rows.${e.key}`)}
                    </p>
                    <p className="text-xs text-foreground-muted">
                      {t("money.by", { name: e.by })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-foreground">
                      {e.amount}
                    </p>
                    <span
                      className={`text-[11px] font-semibold ${
                        e.tag === "shared" ? "text-accent-warm" : "text-primary"
                      }`}
                    >
                      {t(`money.tags.${e.tag}`)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
            <div className="mt-2 rounded-xl bg-surface-raised p-4">
              <div className="flex items-baseline justify-between gap-2 text-sm">
                <span className="font-semibold text-foreground">
                  {t("money.deposits")}
                </span>
                <span className="text-foreground-muted">
                  {t("money.collected")}{" "}
                  <span className="font-bold text-foreground">৳28,500</span>
                </span>
              </div>
              <ul className="mt-3 space-y-2.5">
                {DEPOSITS.map((d) => (
                  <li key={d.name}>
                    <div className="flex justify-between text-xs">
                      <span className="text-foreground-body">{d.name}</span>
                      <span className="font-semibold text-success">
                        {d.amount}
                      </span>
                    </div>
                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-surface-overlay">
                      <div
                        className="bar-fill h-full rounded-full bg-success"
                        style={{ width: `${d.pct}%` }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </FeatureRow>

          <FeatureRow title={t("trust.title")} body={t("trust.body")}>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-5">
              <div className="sm:col-span-3">
                <p className="text-sm font-semibold text-foreground">
                  {t("trust.log")}
                </p>
                <ol className="mt-3 space-y-4">
                  {LOG.map((row) => (
                    <li key={row.key} className="hover-row flex gap-3">
                      <Avatar
                        initials={row.initials}
                        className="!size-7 !text-[10px]"
                      />
                      <div className="min-w-0">
                        <p className="text-sm leading-snug text-foreground-muted">
                          <span className="font-semibold text-foreground">
                            {row.who}
                          </span>{" "}
                          {t(`trust.rows.${row.key}`)}
                        </p>
                        <p className="mt-0.5 text-xs text-foreground-muted/80">
                          {t(`trust.when.${row.when}`)}
                        </p>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
              <ul className="space-y-2 border-t border-border pt-5 sm:col-span-2 sm:border-t-0 sm:border-l sm:pt-0 sm:pl-5">
                {MEMBERS.map((m) => (
                  <li
                    key={m.name}
                    className="hover-row flex items-center gap-2.5"
                  >
                    <Avatar
                      initials={m.initials}
                      className="!size-7 !text-[10px]"
                    />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">
                        {m.name}
                      </p>
                      <p
                        className={`text-[11px] font-semibold ${
                          m.role === "MANAGER"
                            ? "text-accent-warm"
                            : "text-foreground-muted"
                        }`}
                      >
                        {tRole(m.role)}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </FeatureRow>
        </div>
      </Container>
    </section>
  );
}
