import {
  UtensilsCrossed,
  ReceiptText,
  Wallet,
  CalendarRange,
  ShieldCheck,
} from "lucide-react";
import { getTranslations } from "next-intl/server";
import { SectionHeading, Avatar, richAccent } from "./ui";
import { Reveal } from "./Reveal";

const EVENTS = [
  {
    icon: UtensilsCrossed,
    key: "meal",
    initials: "AN",
    color: "text-primary bg-primary/10",
  },
  {
    icon: ReceiptText,
    key: "expense",
    initials: "RU",
    color: "text-accent-warm bg-accent-warm/10",
  },
  {
    icon: Wallet,
    key: "deposit",
    initials: "FK",
    color: "text-success bg-success/10",
  },
  {
    icon: CalendarRange,
    key: "month",
    initials: "MGR",
    color: "text-destructive bg-destructive/10",
  },
] as const;

export async function ActivitySection() {
  const t = await getTranslations("landing.activity");
  return (
    <section className="bg-background py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 items-center gap-14 lg:grid-cols-2 lg:gap-20">
          <Reveal>
            <div className="relative rounded-2xl border border-border bg-surface p-6 shadow-panel lg:p-8">
              <div className="absolute inset-y-8 left-9 w-px bg-surface-overlay" />
              <div className="space-y-6">
                {EVENTS.map((ev, i) => (
                  <div key={ev.key} className="relative flex gap-4 pl-0">
                    <div className="z-10 mt-0.5 flex flex-col items-center">
                      <span
                        className={`flex size-9 items-center justify-center rounded-full ring-1 ring-foreground-muted/15 ${ev.color}`}
                      >
                        <ev.icon className="size-4" />
                      </span>
                      {i < EVENTS.length - 1 && (
                        <span className="mt-1 w-px flex-1 bg-surface-overlay" />
                      )}
                    </div>
                    <div className="flex-1 pb-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Avatar
                          initials={ev.initials}
                          className="!size-6 !text-[8px]"
                        />
                        <p className="text-sm leading-snug text-foreground-muted">
                          <span className="font-semibold text-foreground">
                            {t(`events.${ev.key}.actor`)}
                          </span>{" "}
                          {t(`events.${ev.key}.text`)}
                        </p>
                      </div>
                      <div className="mt-1.5 flex items-center gap-2">
                        <span className="text-[11px] text-foreground-muted/70">
                          {t(`events.${ev.key}.when`)}
                        </span>
                        <span className="rounded bg-surface-raised px-1.5 py-0.5 text-[9px] font-bold text-foreground-muted">
                          {t(`events.${ev.key}.tag`)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>

          <div>
            <SectionHeading
              align="left"
              eyebrow={t("eyebrow")}
              title={t.rich("title", richAccent)}
              subtitle={t("subtitle")}
            />
            <div className="mt-8 space-y-4 text-sm leading-relaxed text-foreground-muted">
              <p>{t("body1")}</p>
              <p>{t("body2")}</p>
            </div>
            <div className="mt-8 flex items-center gap-3 rounded-2xl border border-success/25 bg-success/5 p-4">
              <span className="flex size-10 items-center justify-center rounded-xl bg-success/15 text-success">
                <ShieldCheck className="size-5" />
              </span>
              <p className="text-sm text-foreground-muted">
                {t.rich("audit", {
                  strong: (c) => (
                    <span className="font-semibold text-foreground">{c}</span>
                  ),
                })}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
