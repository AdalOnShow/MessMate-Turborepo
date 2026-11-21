import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { PublicShell } from "../../components/landing/PublicShell";
import { UserGuide } from "../../components/guide/UserGuide";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("guide");
  return { title: t("metaTitle"), description: t("metaDescription") };
}

/** Public user guide: reachable logged in or out (see `publicRoutes` in proxy.ts). */
export default function GuidePage() {
  return (
    <PublicShell>
      <UserGuide />
    </PublicShell>
  );
}
