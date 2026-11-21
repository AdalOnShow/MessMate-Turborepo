import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { Compass } from "lucide-react";
import { ErrorScreen } from "../components/feedback/ErrorScreen";
import { Spotlight } from "../components/landing/Spotlight";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("misc.notFound");
  return { title: t("pageNotFoundMessmate") };
}

export default function NotFound() {
  const t = useTranslations("misc.notFound");
  return (
    <div className="landing-dark landing relative isolate flex min-h-dvh items-center justify-center overflow-hidden bg-background text-foreground">
      <Spotlight size="page" />
      <ErrorScreen
        icon={Compass}
        code="404"
        title={t("pageNotFound")}
        description={t("pageReLookingDoesn")}
        homeHref="/"
        homeLabel={t("goHome")}
      />
    </div>
  );
}
