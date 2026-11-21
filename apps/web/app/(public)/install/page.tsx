import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { PublicShell } from "../../components/landing/PublicShell";
import { InstallGuide } from "../../components/install/InstallGuide";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("install");
  return { title: t("metaTitle"), description: t("metaDescription") };
}

/** Public install guide: reachable logged in or out (see `publicRoutes` in proxy.ts). */
export default function InstallPage() {
  return (
    <PublicShell>
      <InstallGuide />
    </PublicShell>
  );
}
