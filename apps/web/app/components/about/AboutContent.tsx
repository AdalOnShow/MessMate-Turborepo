import { getTranslations } from "next-intl/server";
import { ArrowUpRight, Globe, Mail } from "lucide-react";
import { AUTHOR } from "../../lib/author";
import { Container, plainRich } from "../landing/ui";
import { PageHero } from "../landing/PageHero";
import { GitHubIcon, LinkedInIcon } from "./SocialIcons";
import { ProfilePhoto } from "./ProfilePhoto";

const PROJECT = ["problem", "solution", "stack"] as const;

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
      <PageHero title={t.rich("title", plainRich)} subtitle={t("subtitle")} />

      {/* The project */}
      <section className="py-16 lg:py-24">
        <Container className="grid grid-cols-1 gap-10 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <h2 className="font-heading text-[clamp(1.5rem,2.8vw,2.125rem)] font-bold leading-[1.15] tracking-[-0.02em] text-foreground">
              {t("project.heading")}
            </h2>
            <a
              href={AUTHOR.repo}
              target="_blank"
              rel="noopener noreferrer"
              className="group mt-6 inline-flex items-center gap-2 rounded-[10px] border border-border-strong px-4 py-2.5 text-sm font-semibold text-foreground transition-colors hover:border-foreground-muted hover:bg-surface"
            >
              <GitHubIcon />
              {t("project.sourceCode")}
              <ArrowUpRight
                size={16}
                aria-hidden="true"
                className="transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
              />
            </a>
          </div>
          <dl className="divide-y divide-border border-y border-border lg:col-span-8">
            {PROJECT.map((key) => (
              <div
                key={key}
                className="grid gap-2 py-6 sm:grid-cols-[12rem_1fr] sm:gap-8"
              >
                <dt className="font-heading text-base font-semibold text-foreground">
                  {t(`project.${key}.title`)}
                </dt>
                <dd className="max-w-[62ch] text-[15px] leading-relaxed text-foreground-muted">
                  {t(`project.${key}.body`)}
                </dd>
              </div>
            ))}
          </dl>
        </Container>
      </section>

      {/* About me */}
      <section className="border-t border-border bg-surface-sunken py-16 lg:py-24">
        <Container className="grid grid-cols-1 gap-10 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <h2 className="font-heading text-[clamp(1.5rem,2.8vw,2.125rem)] font-bold leading-[1.15] tracking-[-0.02em] text-foreground">
              {t("me.heading")}
            </h2>
            <div className="mt-6">
              <ProfilePhoto
                src={AUTHOR.photo}
                alt={t("me.photoAlt")}
                initials={AUTHOR.initials}
              />
            </div>
          </div>

          <div className="min-w-0 lg:col-span-8">
            <p className="font-heading text-2xl font-bold text-foreground">
              {AUTHOR.name}
            </p>
            <p className="mt-1 text-sm font-medium text-primary">
              {t("me.role")}
            </p>
            <p className="mt-5 max-w-[62ch] text-[15px] leading-relaxed text-foreground-body sm:text-base">
              {t("me.bio")}
            </p>
            <p className="mt-3 max-w-[62ch] text-[15px] leading-relaxed text-foreground-muted sm:text-base">
              {t("me.why")}
            </p>
            <ul
              className="mt-6 flex flex-wrap gap-2"
              aria-label={t("me.skills")}
            >
              {SKILLS.map((skill) => (
                <li
                  key={skill}
                  className="rounded-full border border-border px-3 py-1 text-xs font-medium text-foreground-body"
                >
                  {skill}
                </li>
              ))}
            </ul>

            <ul className="mt-10 divide-y divide-border border-y border-border">
              {socials.map((s) => (
                <li key={s.key}>
                  <a
                    href={s.href}
                    {...(s.key === "email"
                      ? {}
                      : { target: "_blank", rel: "noopener noreferrer" })}
                    className="group flex items-center gap-4 py-4 transition-colors"
                  >
                    <span className="text-foreground-muted transition-colors group-hover:text-primary">
                      {s.icon}
                    </span>
                    <span className="w-28 shrink-0 text-sm font-semibold text-foreground">
                      {t(`me.links.${s.key}`)}
                    </span>
                    <span className="min-w-0 truncate text-sm text-foreground-muted transition-colors group-hover:text-foreground">
                      {s.handle}
                    </span>
                    <ArrowUpRight
                      size={16}
                      aria-hidden="true"
                      className="ml-auto shrink-0 text-foreground-muted transition-[color,transform] duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary"
                    />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </Container>
      </section>
    </>
  );
}
