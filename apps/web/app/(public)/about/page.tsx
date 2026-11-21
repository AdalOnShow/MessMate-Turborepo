import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { PublicShell } from "../../components/landing/PublicShell";
import { AboutContent } from "../../components/about/AboutContent";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("about");
  return { title: t("metaTitle"), description: t("metaDescription") };
}

/** Public about page: reachable logged in or out (see `publicRoutes` in proxy.ts). */
export default function AboutPage() {
  return (
    <PublicShell>
      <AboutContent />
    </PublicShell>
  );
}
