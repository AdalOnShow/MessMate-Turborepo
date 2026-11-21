"use client";

import { useState } from "react";
import Link from "next/link";
import { useMessages, useTranslations } from "next-intl";
import {
  ArrowDown,
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronDown,
  Copy,
  Download,
  ExternalLink,
  Feather,
  Maximize2,
  Monitor,
  Smartphone,
  WifiOff,
  Zap,
} from "lucide-react";
import {
  promptInstall,
  useDeviceEnv,
  useInstallState,
  type DeviceEnv,
} from "../../lib/pwa";
import { toast } from "../../store/toast";
import { cn } from "../../lib/utils";
import { plainRich } from "../landing/ui";
import { PageHero } from "../landing/PageHero";
import { PhoneScene, type SceneId } from "./PhoneScenes";

type Os = "ios" | "android";
type GuideId = "iosSafari" | "iosChrome" | "androidChrome" | "samsung";

const GUIDES: Record<
  GuideId,
  {
    os: Os;
    browser: "safari" | "chrome" | "samsung";
    scenes: SceneId[];
  }
> = {
  iosSafari: {
    os: "ios",
    browser: "safari",
    scenes: [
      "ios-safari-bar",
      "ios-share-sheet",
      "ios-add-confirm",
      "homescreen",
    ],
  },
  iosChrome: {
    os: "ios",
    browser: "chrome",
    scenes: [
      "ios-chrome-bar",
      "ios-share-sheet",
      "ios-add-confirm",
      "homescreen",
    ],
  },
  androidChrome: {
    os: "android",
    browser: "chrome",
    scenes: ["chrome-bar", "chrome-menu", "android-install", "homescreen"],
  },
  samsung: {
    os: "android",
    browser: "samsung",
    scenes: [
      "samsung-bar",
      "samsung-menu",
      "samsung-addto",
      "android-add",
      "homescreen",
    ],
  },
};

const GUIDES_BY_OS: Record<Os, GuideId[]> = {
  ios: ["iosSafari", "iosChrome"],
  android: ["androidChrome", "samsung"],
};

/**
 * Browsers we guide people through. Others (Brave, Firefox, Edge, Opera,
 * in-app browsers...) either can't install MessMate or do it unreliably, so
 * visitors using them are asked to open the site in one of these instead.
 */
const SUPPORTED: Record<"ios" | "android", DeviceEnv["browser"][]> = {
  ios: ["safari", "chrome"],
  android: ["chrome", "samsung"],
};

export function isSupportedBrowser(env: DeviceEnv) {
  return env.os === "desktop" || SUPPORTED[env.os].includes(env.browser);
}

/** The guide matching the visitor's own phone + browser. */
function guideFor(env: DeviceEnv | null): GuideId {
  if (env?.os === "ios")
    return env.browser === "chrome" ? "iosChrome" : "iosSafari";
  if (env?.browser === "samsung") return "samsung";
  return "androidChrome";
}

export function InstallGuide() {
  const t = useTranslations("install");
  const messages = useMessages();
  const env = useDeviceEnv();
  const detected = guideFor(env);
  const [picked, setPicked] = useState<GuideId | null>(null);
  const guideId = picked ?? detected;
  const guide = GUIDES[guideId];
  const steps: { title: string; body: string }[] = Object.values(
    messages.install.guides[guideId],
  );

  const pickOs = (os: Os) => {
    if (os === guide.os) return;
    setPicked(GUIDES[detected].os === os ? detected : GUIDES_BY_OS[os][0]!);
  };

  return (
    <>
      {/* Hero */}
      <PageHero
        title={t.rich("title", plainRich)}
        subtitle={t("subtitle")}
        aside={
          <div className="flex justify-center lg:justify-end">
            <PhoneScene
              scene="homescreen"
              os={env?.os === "ios" ? "ios" : "android"}
              className="w-[220px] rotate-[-4deg] transition-transform duration-500 ease-out hover:rotate-0 hover:-translate-y-1"
            />
          </div>
        }
      >
        {env && (
          <p className="mt-6 inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1.5 text-xs text-foreground-muted">
            {env.os === "desktop" ? (
              <Monitor size={14} aria-hidden="true" />
            ) : (
              <Smartphone size={14} aria-hidden="true" />
            )}
            {t("detected")}:
            <span className="font-semibold text-foreground">
              {t(`os.${env.os}`)} · {t(`browser.${env.browser}`)}
            </span>
          </p>
        )}

        <div className="mt-6 max-w-xl">
          {env && <PrimaryAction env={env} />}
        </div>
      </PageHero>

      {/* Step-by-step */}
      <section
        id="guide"
        className="scroll-mt-20 border-t border-border bg-surface-sunken py-16"
      >
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="text-center">
            <h2 className="font-heading text-3xl heading-tight text-foreground sm:text-4xl">
              {t("guideTitle")}
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm text-foreground-muted sm:text-base">
              {t("guideSubtitle")}
            </p>
          </div>

          {/* OS tabs */}
          <div
            role="tablist"
            aria-label={t("guideTitle")}
            className="mx-auto mt-8 grid max-w-sm grid-cols-2 rounded-xl border border-border bg-surface p-1"
          >
            {(["ios", "android"] as const).map((os) => (
              <button
                key={os}
                type="button"
                role="tab"
                aria-selected={guide.os === os}
                onClick={() => pickOs(os)}
                className={cn(
                  "flex h-10 items-center justify-center gap-2 rounded-lg text-sm font-semibold transition-colors",
                  guide.os === os
                    ? "bg-primary text-white"
                    : "text-foreground-muted hover:text-foreground",
                )}
              >
                <Smartphone size={16} aria-hidden="true" />
                {t(`os.${os}`)}
              </button>
            ))}
          </div>

          {/* Browser tabs */}
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {GUIDES_BY_OS[guide.os].map((id) => (
              <button
                key={id}
                type="button"
                aria-pressed={guideId === id}
                onClick={() => setPicked(id)}
                className={cn(
                  "inline-flex h-9 items-center gap-1.5 rounded-full border px-4 text-sm font-medium transition-colors",
                  guideId === id
                    ? "border-primary/40 bg-primary/10 text-primary"
                    : "border-border bg-surface text-foreground-muted hover:text-foreground",
                )}
              >
                {t(`browser.${GUIDES[id].browser}`)}
                {env &&
                  id === detected &&
                  env.os !== "desktop" &&
                  isSupportedBrowser(env) && (
                    <span className="rounded-full bg-success/15 px-1.5 py-0.5 text-[10px] font-semibold text-success">
                      {t("recommended")}
                    </span>
                  )}
              </button>
            ))}
          </div>

          {/* Steps */}
          <ol
            key={guideId}
            className="mt-12 flex flex-wrap justify-center gap-x-6 gap-y-12"
          >
            {steps.map((step, i) => (
              <li
                key={step.title}
                className="animate-pop-in flex w-full max-w-[270px] flex-col items-center text-center"
                style={{
                  animationDelay: `${i * 70}ms`,
                  animationFillMode: "both",
                }}
              >
                <PhoneScene scene={guide.scenes[i]!} os={guide.os} />
                <span className="mt-6 inline-flex items-center gap-2 text-xs font-semibold text-primary">
                  <span className="grid size-6 place-items-center rounded-full bg-primary text-[11px] text-white">
                    {i + 1}
                  </span>
                  {t("stepLabel", { n: i + 1 })}
                </span>
                <h3 className="mt-2 font-heading text-lg font-semibold text-foreground">
                  {step.title}
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-foreground-muted">
                  {step.body}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <Benefits />
      <Faq />
    </>
  );
}

/* ---------- primary action card ---------- */

function PrimaryAction({ env }: { env: DeviceEnv }) {
  const t = useTranslations("install.action");
  const tb = useTranslations("install");
  const install = useInstallState();
  const [busy, setBusy] = useState(false);

  if (install.kind === "installed") {
    return (
      <Card
        tone="success"
        icon={<CheckCircle2 size={22} />}
        title={t("installedTitle")}
        desc={t("installedDesc")}
      >
        <Link
          href="/dashboard"
          className="bg-cta inline-flex h-11 items-center gap-2 rounded-[9px] px-5 text-sm font-bold"
        >
          {t("openDashboard")}
          <ArrowRight size={16} aria-hidden="true" />
        </Link>
      </Card>
    );
  }

  // Not one of our browsers (including Facebook/Messenger's in-app
  // browser): ask them to switch first, even if this browser offers its own
  // install prompt.
  if (!isSupportedBrowser(env)) {
    const isAndroid = env.os === "android";
    const { host, pathname } = window.location;
    const inapp = env.browser === "inapp";
    return (
      <Card
        tone="warn"
        icon={<ExternalLink size={20} />}
        title={
          inapp
            ? t("inappTitle")
            : isAndroid
              ? t("unsupportedTitle")
              : t("unsupportedTitleIos")
        }
        desc={
          inapp
            ? isAndroid
              ? t("inappDescAndroid")
              : t("inappDescIos")
            : isAndroid
              ? t("unsupportedDescAndroid", {
                  browser: tb(`browser.${env.browser}`),
                })
              : t("unsupportedDescIos", {
                  browser: tb(`browser.${env.browser}`),
                })
        }
      >
        {isAndroid && (
          <a
            href={`intent://${host}${pathname}#Intent;scheme=https;package=com.android.chrome;end`}
            className="bg-cta inline-flex h-11 items-center gap-2 rounded-[9px] px-5 text-sm font-bold"
          >
            {t("openInChrome")}
            <ExternalLink size={16} aria-hidden="true" />
          </a>
        )}
        <CopyLink />
        <p className="w-full text-xs leading-relaxed text-foreground-muted">
          {isAndroid ? t("copyHintAndroid") : t("copyHintIos")}
        </p>
      </Card>
    );
  }

  if (install.kind === "prompt") {
    return (
      <div>
        <button
          type="button"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            try {
              const accepted = await promptInstall();
              if (accepted) toast.success(t("successToast"));
              else toast.info(t("dismissedToast"));
            } finally {
              setBusy(false);
            }
          }}
          className="bg-cta group inline-flex h-14 w-full items-center justify-center gap-2.5 rounded-xl px-8 text-base font-bold transition-transform active:scale-[0.98] disabled:opacity-70 sm:w-auto"
        >
          <Download
            size={20}
            aria-hidden="true"
            className="group-hover:animate-bounce"
          />
          {t("installNow")}
        </button>
        <p className="mt-2.5 text-sm text-foreground-muted">
          {t("installNowDesc")}
        </p>
      </div>
    );
  }

  if (env.os === "desktop") {
    return (
      <Card
        icon={<Monitor size={20} />}
        title={t("desktopTitle")}
        desc={t("desktopDesc")}
      >
        <CopyLink />
      </Card>
    );
  }

  const ios = env.os === "ios";
  return (
    <Card
      icon={<Smartphone size={20} />}
      title={ios ? t("iosTitle") : t("manualTitle")}
      desc={ios ? t("iosDesc") : t("manualDesc")}
    >
      <a
        href="#guide"
        className="bg-cta inline-flex h-11 items-center gap-2 rounded-[9px] px-5 text-sm font-bold"
      >
        {t("showSteps")}
        <ArrowDown size={16} aria-hidden="true" className="animate-bounce" />
      </a>
    </Card>
  );
}

function Card({
  icon,
  title,
  desc,
  tone = "default",
  children,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  tone?: "default" | "success" | "warn";
  children?: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border p-4 sm:p-5",
        tone === "success" && "border-success/30 bg-success/10",
        tone === "warn" && "border-accent-warm/30 bg-accent-warm/10",
        tone === "default" && "border-primary/25 bg-primary/10",
      )}
    >
      <div className="flex gap-3">
        <span
          aria-hidden="true"
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-xl text-white",
            tone === "success" && "bg-success",
            tone === "warn" && "bg-accent-warm text-cta-foreground",
            tone === "default" && "bg-primary",
          )}
        >
          {icon}
        </span>
        <div className="min-w-0">
          <p className="font-semibold text-foreground">{title}</p>
          <p className="mt-1 text-sm leading-relaxed text-foreground-muted">
            {desc}
          </p>
        </div>
      </div>
      {children && (
        <div className="mt-4 flex flex-wrap gap-2.5">{children}</div>
      )}
    </div>
  );
}

function CopyLink() {
  const t = useTranslations("install.action");
  const [copied, setCopied] = useState(false);
  // The install page itself, so the new browser opens straight on the guide.
  const url = `${window.location.origin}/install`;

  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(url);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        } catch {
          // Clipboard is blocked in some in-app browsers: let the user copy by hand.
          window.prompt(t("copyLink"), url);
        }
      }}
      className="inline-flex h-11 items-center gap-2 rounded-[9px] border border-border-strong bg-surface px-5 text-sm font-semibold text-foreground transition-colors hover:border-primary/50"
    >
      {copied ? (
        <Check size={16} className="text-success" aria-hidden="true" />
      ) : (
        <Copy size={16} aria-hidden="true" />
      )}
      {copied ? t("copied") : t("copyLink")}
    </button>
  );
}

/* ---------- benefits + FAQ ---------- */

const BENEFITS = [
  { key: "fullscreen", icon: Maximize2 },
  { key: "fast", icon: Zap },
  { key: "offline", icon: WifiOff },
  { key: "light", icon: Feather },
] as const;

function Benefits() {
  const t = useTranslations("install.benefits");
  return (
    <section className="py-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <h2 className="text-center font-heading text-3xl heading-tight text-foreground">
          {t("title")}
        </h2>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {BENEFITS.map(({ key, icon: Icon }) => (
            <div
              key={key}
              className="rounded-2xl border border-border bg-surface p-5"
            >
              <span className="flex size-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
                <Icon size={20} aria-hidden="true" />
              </span>
              <p className="mt-4 font-semibold text-foreground">
                {t(`${key}.title`)}
              </p>
              <p className="mt-1 text-sm leading-relaxed text-foreground-muted">
                {t(`${key}.body`)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const FAQ_KEYS = ["safe", "update", "account", "uninstall"] as const;

function Faq() {
  const t = useTranslations("install.faq");
  return (
    <section className="border-t border-border pt-16 pb-24">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <h2 className="text-center font-heading text-3xl heading-tight text-foreground">
          {t("title")}
        </h2>
        <div className="mt-8 divide-y divide-border rounded-2xl border border-border bg-surface">
          {FAQ_KEYS.map((key) => (
            <details key={key} className="group px-5 py-4">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-foreground [&::-webkit-details-marker]:hidden">
                {t(`${key}.q`)}
                <ChevronDown
                  size={18}
                  aria-hidden="true"
                  className="shrink-0 text-foreground-muted transition-transform group-open:rotate-180"
                />
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-foreground-muted">
                {t(`${key}.a`)}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
