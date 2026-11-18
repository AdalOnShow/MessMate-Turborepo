import { getTranslations } from "next-intl/server";
import {
  ArrowUpRight,
  Calculator,
  Globe,
  Layers,
  Mail,
  Users,
  type LucideIcon,
} from "lucide-react";
import { AUTHOR } from "../../lib/author";
import { richAccent } from "../landing/ui";
import { GitHubIcon, LinkedInIcon } from "./SocialIcons";
import { ProfilePhoto } from "./ProfilePhoto";

const PROJECT_CARDS: {
  key: "problem" | "solution" | "stack";
  icon: LucideIcon;
}[] = [
  { key: "problem", icon: Users },
  { key: "solution", icon: Calculator },
  { key: "stack", icon: Layers },
];

const SKILLS = [
  "Next.js",
  "React",
  "TypeScript",
  "NestJS",
  "Node.js",
  "Express.js",
  "PostgreSQL",
  "Prisma",
  "MongoDB",
  "Redis",
  "Tailwind CSS",
  "Docker",
];

export async function AboutContent() {
  const t = await getTranslations("about");

  const socials = [
    {
      key: "linkedin",
      href: AUTHOR.links.linkedin,
      icon: <LinkedInIcon className="size-5" />,
      handle: "in/adalonshow",
    },
    {
      key: "github",
      href: AUTHOR.links.github,
      icon: <GitHubIcon className="size-5" />,
      handle: "AdalOnShow",
    },
    {
      key: "portfolio",
      href: AUTHOR.links.portfolio,
      icon: <Globe className="size-5" aria-hidden="true" />,
      handle: "sharifadal.me",
    },
    {
      key: "email",
      href: `mailto:${AUTHOR.links.email}`,
      icon: <Mail className="size-5" aria-hidden="true" />,
      handle: AUTHOR.links.email,
    },
  ] as const;

  return (
    <>
      {/* Hero */}
      <section className="mx-auto max-w-5xl px-4 pt-12 pb-12 sm:px-6 lg:pt-20">
        <span className="label-mono text-primary">{t("eyebrow")}</span>
        <h1 className="mt-4 font-heading text-4xl heading-tight text-foreground sm:text-5xl">
          {t.rich("title", richAccent)}
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-relaxed text-foreground-muted sm:text-lg">
          {t("subtitle")}
        </p>
      </section>

      {/* The project */}
      <section className="mx-auto max-w-5xl px-4 pb-16 sm:px-6">
        <h2 className="font-heading text-2xl heading-tight text-foreground">
          {t("project.heading")}
        </h2>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {PROJECT_CARDS.map(({ key, icon: Icon }) => (
            <div
              key={key}
              className="rounded-2xl border border-border bg-surface p-5"
            >
              <span className="flex size-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
                <Icon size={20} aria-hidden="true" />
              </span>
              <h3 className="mt-4 font-semibold text-foreground">
                {t(`project.${key}.title`)}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-foreground-muted">
                {t(`project.${key}.body`)}
              </p>
            </div>
          ))}
        </div>
        <a
          href={AUTHOR.repo}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-4 py-2.5 text-sm font-semibold text-foreground transition-colors hover:border-primary/40 hover:text-primary"
        >
          <GitHubIcon />
          {t("project.sourceCode")}
          <ArrowUpRight size={16} aria-hidden="true" />
        </a>
      </section>

      {/* About me */}
      <section className="mx-auto max-w-5xl px-4 pb-20 sm:px-6">
        <h2 className="font-heading text-2xl heading-tight text-foreground">
          {t("me.heading")}
        </h2>
        <div className="mt-6 rounded-2xl border border-border bg-surface p-6 sm:p-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
            <ProfilePhoto
              src={AUTHOR.photo}
              alt={t("me.photoAlt")}
              initials={AUTHOR.initials}
            />
            <div className="min-w-0">
              <p className="font-heading text-2xl font-bold text-foreground">
                {AUTHOR.name}
              </p>
              <p className="mt-1 text-sm font-medium text-primary">
                {t("me.role")}
              </p>
              <p className="mt-4 text-sm leading-relaxed text-foreground-muted sm:text-base">
                {t("me.bio")}
              </p>
              <p className="mt-3 text-sm leading-relaxed text-foreground-muted sm:text-base">
                {t("me.why")}
              </p>
              <ul
                className="mt-5 flex flex-wrap gap-2"
                aria-label={t("me.skills")}
              >
                {SKILLS.map((skill) => (
                  <li
                    key={skill}
                    className="rounded-full border border-border bg-surface-raised px-3 py-1 text-xs font-medium text-foreground"
                  >
                    {skill}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-8 grid gap-3 border-t border-border pt-6 sm:grid-cols-2">
            {socials.map((s) => (
              <a
                key={s.key}
                href={s.href}
                {...(s.key === "email"
                  ? {}
                  : { target: "_blank", rel: "noopener noreferrer" })}
                className="group flex items-center gap-3 rounded-xl border border-border bg-surface-raised p-4 transition-colors hover:border-primary/40"
              >
                <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-background text-foreground-muted transition-colors group-hover:text-primary">
                  {s.icon}
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-foreground">
                    {t(`me.links.${s.key}`)}
                  </span>
                  <span className="block truncate text-xs text-foreground-muted">
                    {s.handle}
                  </span>
                </span>
                <ArrowUpRight
                  size={16}
                  aria-hidden="true"
                  className="ml-auto shrink-0 text-foreground-muted transition-colors group-hover:text-primary"
                />
              </a>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
