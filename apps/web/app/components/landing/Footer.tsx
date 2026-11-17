import { getTranslations } from "next-intl/server";
import { Globe } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

const PRODUCT_LINKS = [
  { key: "nav.features", href: "/#features" },
  { key: "nav.howItWorks", href: "/#how-it-works" },
  { key: "footer.productPreview", href: "/#preview" },
] as const;

const RESOURCE_LINKS = [
  { key: "footer.accountingSystem", href: "/#accounting" },
  { key: "nav.faq", href: "/#faq" },
  { key: "nav.install", href: "/install" },
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
                <a
                  href="#"
                  aria-label="GitHub"
                  className="flex size-8 items-center justify-center rounded-lg border border-border text-foreground-muted transition-colors hover:border-primary/40 hover:text-primary"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                    className="size-4"
                  >
                    <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
                  </svg>
                </a>
                <a
                  href="#"
                  aria-label="Portfolio"
                  className="flex size-8 items-center justify-center rounded-lg border border-border text-foreground-muted transition-colors hover:border-primary/40 hover:text-primary"
                >
                  <Globe className="size-4" />
                </a>
                <a
                  href="#"
                  aria-label="LinkedIn"
                  className="flex size-8 items-center justify-center rounded-lg border border-border text-foreground-muted transition-colors hover:border-primary/40 hover:text-primary"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                    className="size-4"
                  >
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 1 1 0-4.125 2.062 2.062 0 0 1 0 4.125zM7.119 20.452H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                  </svg>
                </a>
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
