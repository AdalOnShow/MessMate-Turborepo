import { getTranslations } from "next-intl/server";
import { Globe } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { AUTHOR } from "../../lib/author";
import { GitHubIcon, LinkedInIcon } from "../about/SocialIcons";

const PRODUCT_LINKS = [
  { key: "nav.features", href: "/#features" },
  { key: "nav.howItWorks", href: "/#how-it-works" },
  { key: "footer.productPreview", href: "/#preview" },
] as const;

const RESOURCE_LINKS = [
  { key: "footer.accountingSystem", href: "/#accounting" },
  { key: "nav.faq", href: "/#faq" },
  { key: "nav.guide", href: "/guide" },
  { key: "nav.install", href: "/install" },
  { key: "nav.about", href: "/about" },
] as const;

const ACCOUNT_LINKS = [
  { key: "signIn", href: "/signin" },
  { key: "getStarted", href: "/signup" },
] as const;

export async function Footer() {
  const t = await getTranslations("landing");
  const tc = await getTranslations("common");
  return (
    <footer className="border-t border-border bg-surface pt-16 pb-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 pb-12 md:grid-cols-2 lg:grid-cols-12">
          <div className="space-y-4 lg:col-span-5">
            <Link href="/" className="flex items-center gap-2.5">
              <Image
                src="/messmate-logo.png"
                alt={t("nav.logoAlt")}
                width={860}
                height={600}
                className="h-10 w-auto"
              />
            </Link>
            <p className="max-w-sm text-sm leading-relaxed text-foreground-muted">
              {t("footer.tagline")}
            </p>
          </div>

          <div className="lg:col-span-2">
            <h4 className="text-sm font-mono font-medium uppercase tracking-[0.12em] text-foreground font-heading">
              {t("footer.product")}
            </h4>
            <ul className="mt-4 space-y-2.5">
              {PRODUCT_LINKS.map((link) => (
                <li key={link.key}>
                  <a
                    href={link.href}
                    className="text-sm text-foreground-muted transition-colors hover:text-primary"
                  >
                    {t(link.key)}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-2">
            <h4 className="text-sm font-mono font-medium uppercase tracking-[0.12em] text-foreground font-heading">
              {t("footer.resources")}
            </h4>
            <ul className="mt-4 space-y-2.5">
              {RESOURCE_LINKS.map((link) => (
                <li key={link.key}>
                  <a
                    href={link.href}
                    className="text-sm text-foreground-muted transition-colors hover:text-primary"
                  >
                    {t(link.key)}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-3">
            <h4 className="text-sm font-mono font-medium uppercase tracking-[0.12em] text-foreground font-heading">
              {t("footer.account")}
            </h4>
            <ul className="mt-4 space-y-2.5">
              {ACCOUNT_LINKS.map((link) => (
                <li key={link.key}>
                  <a
                    href={link.href}
                    className="text-sm text-foreground-muted transition-colors hover:text-primary"
                  >
                    {tc(link.key)}
                  </a>
                </li>
              ))}
            </ul>

            <div className="mt-6 rounded-2xl border border-border bg-surface-raised/60 p-4">
              <p className="text-xs font-semibold text-foreground-muted">
                {t.rich("footer.builtBy", {
                  strong: (c) => (
                    <span className="font-bold text-foreground">{c}</span>
                  ),
                })}
              </p>
              <p className="mt-1 text-xs text-foreground-muted">
                {t("footer.builtByRole")}
              </p>
              <div className="mt-3 flex items-center gap-2.5">
                {[
                  {
                    label: "GitHub",
                    href: AUTHOR.links.github,
                    icon: <GitHubIcon />,
                  },
                  {
                    label: "Portfolio",
                    href: AUTHOR.links.portfolio,
                    icon: <Globe className="size-4" aria-hidden="true" />,
                  },
                  {
                    label: "LinkedIn",
                    href: AUTHOR.links.linkedin,
                    icon: <LinkedInIcon />,
                  },
                ].map((s) => (
                  <a
                    key={s.label}
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={s.label}
                    className="flex size-8 items-center justify-center rounded-lg border border-border text-foreground-muted transition-colors hover:border-primary/40 hover:text-primary"
                  >
                    {s.icon}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="h-px w-full bg-surface-raised" />

        <div className="flex flex-col items-center justify-between gap-3 pt-6 sm:flex-row">
          <p className="text-xs text-foreground-muted">{t("footer.rights")}</p>
          <p className="text-xs text-foreground-muted">{t("footer.madeFor")}</p>
        </div>
      </div>
    </footer>
  );
}
